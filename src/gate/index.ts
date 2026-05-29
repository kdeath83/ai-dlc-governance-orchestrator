import { execSync } from 'child_process';
import { JURISDICTIONS } from '../generate/jurisdictions/mas-sg';
import { GateReport } from '../shared/types';
import { loadSteeringFile } from '../shared/config';
import { info, success, warning, error } from '../shared/logger';

export function classifyFile(
  filePath: string,
  materialPatterns: string[],
  routinePatterns: string[],
): { materiality: 'material' | 'routine'; reason: string } {
  for (const pattern of materialPatterns) {
    try {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(filePath)) {
        return { materiality: 'material', reason: `Matches material pattern: ${pattern}` };
      }
    } catch (e) {
      error(`Invalid regex pattern in material rules: ${pattern}`);
      continue;
    }
  }

  for (const pattern of routinePatterns) {
    try {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(filePath)) {
        return { materiality: 'routine', reason: `Matches routine pattern: ${pattern}` };
      }
    } catch (e) {
      error(`Invalid regex pattern in routine rules: ${pattern}`);
      continue;
    }
  }

  return { materiality: 'routine', reason: 'No materiality match; default to routine' };
}

function getPrFiles(prNumber: string): string[] {
  try {
    // If PR number is provided, try to fetch files from GitHub CLI or remote
    // Fallback to local diff for prototyping
    if (prNumber && prNumber !== '1') {
      try {
        const files = execSync(`gh pr view ${prNumber} --json files --jq '.files[].path'`, { encoding: 'utf8', stdio: 'pipe' })
          .trim()
          .split('\n')
          .filter(Boolean);
        return files;
      } catch {
        // Fallback to local diff if gh CLI fails or PR number is local-only
      }
    }
    const files = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8', stdio: 'pipe' })
      .trim()
      .split('\n')
      .filter(Boolean);
    return files;
  } catch {
    return (process.env.GATE_FILES || '')
      .split(',')
      .filter(Boolean);
  }
}

export async function gate(options: {
  pr: string;
  materiality: string;
  blockOn: string;
}): Promise<GateReport> {
  const jurisdictionId = options.materiality.toUpperCase();
  const config = JURISDICTIONS[jurisdictionId];

  if (!config) {
    error(`Unknown jurisdiction: ${jurisdictionId}`);
    throw Object.assign(new Error(`Unknown jurisdiction: ${jurisdictionId}`), { statusCode: 400 });
  }

  info(`Running risk gate for PR ${options.pr} (${jurisdictionId})...`);

  const files = getPrFiles(options.pr);
  if (files.length === 0) {
    warning('No files detected for this PR');
  }

  const fileClassifications = files.map(f => {
    const classification = classifyFile(
      f,
      config.materialityPatterns.material,
      config.materialityPatterns.routine,
    );
    return { path: f, ...classification };
  });

  const materialFiles = fileClassifications.filter(f => f.materiality === 'material');
  const overallMateriality = materialFiles.length > 0 ? 'material' : 'routine';
  const blocked = options.blockOn === 'material' && overallMateriality === 'material';

  const steeringFile = loadSteeringFile('.dlc/steering/');

  const report: GateReport = {
    pr: options.pr,
    timestamp: new Date().toISOString(),
    materiality: overallMateriality,
    blocked,
    blockReason: blocked ? 'Material changes detected; requires human review' : undefined,
    message: blocked
      ? 'Gate blocked: material changes require human review'
      : 'Gate passed: no material changes detected',
    files: fileClassifications,
    steering: {
      jurisdiction: jurisdictionId,
      version: steeringFile?.version || 'unknown',
    },
  };

  console.log('\n' + JSON.stringify(report, null, 2));

  if (blocked) {
    error('Gate blocked');
  } else {
    success('Gate passed');
  }

  return report;
}
