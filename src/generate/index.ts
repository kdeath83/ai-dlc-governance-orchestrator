import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { JURISDICTIONS } from './jurisdictions/mas-sg';
import { SteeringFile } from '../shared/types';
import { ensureSteeringDir } from '../shared/config';
import { info, success, error } from '../shared/logger';

export async function generate(options: {
  jurisdiction: string;
  output: string;
}): Promise<string> {
  const jurisdictionId = options.jurisdiction.toUpperCase();
  const config = JURISDICTIONS[jurisdictionId];

  if (!config) {
    error(`Unknown jurisdiction: ${jurisdictionId}`);
    info('Available jurisdictions: ' + Object.keys(JURISDICTIONS).join(', '));
    throw Object.assign(new Error(`Unknown jurisdiction: ${jurisdictionId}`), { statusCode: 400 });
  }

  info(`Generating steering file for ${config.name} (${jurisdictionId})...`);

  const steeringFile: SteeringFile = {
    jurisdiction: jurisdictionId,
    version: '0.1.0',
    generated: new Date().toISOString(),
    security: config.security,
    architecture: config.architecture,
    regulatory: config.regulatory,
    ai: {
      allowedAgents: ['amazon-kiro', 'claude-code', 'codex'],
      requireSteeringFile: true,
      maxCodeGenerationRatio: 0.85,
    },
  };

  const outputPath = path.resolve(options.output);
  ensureSteeringDir(outputPath);

  const filePath = path.join(outputPath, 'default.yaml');
  const content = yaml.dump(steeringFile, {
    indent: 2,
    lineWidth: 120,
    sortKeys: false,
  });

  fs.writeFileSync(filePath, content, 'utf8');
  success(`Steering file generated: ${filePath}`);

  info('Generated rules summary:');
  console.log(`  - Security: ${config.security.requireEncryption ? 'encryption required' : 'optional'}`);
  console.log(`  - Architecture: ${config.architecture.allowedRegions.join(', ')}`);
  console.log(`  - Regulatory: ${config.regulatory.requireHumanReview ? 'human review required' : 'optional'}`);
  console.log(`  - AI agents: ${steeringFile.ai.allowedAgents.join(', ')}`);

  return filePath;
}
