import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { AuditReport } from '../shared/types';
import { loadSteeringFile } from '../shared/config';
import { info, success, warning, error } from '../shared/logger';

function isGitRepo(): boolean {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function sanitizeCommitHash(raw: string): string | null {
  // Git commit hashes are hex strings, 40 chars for SHA-1, 64 for SHA-256
  // Allow HEAD and HEAD~N, but strip any shell metacharacters
  const allowed = /^[a-zA-Z0-9~^._-]+$/;
  if (!allowed.test(raw)) return null;
  return raw;
}

function detectAiGenerated(commitMessage: string, files: string[]): boolean {
  const aiMarkers = [
    /ai-generated/i,
    /generated-by-/i,
    /kiro/i,
    /claude-code/i,
    /codex/i,
    /copilot/i,
    /\[ai\]/i,
  ];
  const hasMarker = aiMarkers.some(m => m.test(commitMessage));
  const hasSteeringRef = files.some(f => f.includes('.dlc/steering') || f.includes('.dlc'));
  return hasMarker || hasSteeringRef;
}

function checkRequirementLink(commitMessage: string): boolean {
  const patterns = [
    /REQ-\d+/i,
    /USER-\d+/i,
    /JIRA-\d+/i,
    /#\d+/i,
    /github\.com\/.+\/issues\/\d+/i,
    /trello\/.+/i,
  ];
  return patterns.some(p => p.test(commitMessage));
}

function checkTestCoverage(files: string[]): boolean {
  return files.some(f =>
    f.includes('test') ||
    f.includes('spec') ||
    f.includes('__tests__') ||
    f.endsWith('.test.ts') ||
    f.endsWith('.test.js') ||
    f.endsWith('.spec.ts') ||
    f.endsWith('.spec.js')
  );
}

export async function audit(options: {
  commit: string;
  steering: string;
}): Promise<AuditReport> {
  if (!isGitRepo()) {
    error('Not a git repository. Run from a git project.');
    throw Object.assign(new Error('Not a git repository'), { statusCode: 400 });
  }

  const sanitized = sanitizeCommitHash(options.commit);
  if (!sanitized) {
    error('Invalid commit hash');
    throw Object.assign(new Error('Invalid commit hash'), { statusCode: 400 });
  }

  const commitHash = sanitized === 'HEAD'
    ? execSync('git rev-parse HEAD', { encoding: 'utf8', stdio: 'pipe' }).toString().trim()
    : sanitized;

  info(`Auditing commit ${commitHash}...`);

  let message: string;
  let files: string[];

  try {
    message = execSync(`git log -1 --format=%B -- ${commitHash}`, { encoding: 'utf8', stdio: 'pipe' }).trim();
    files = execSync(`git diff-tree --no-commit-id --name-only -r -- ${commitHash}`, { encoding: 'utf8', stdio: 'pipe' })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch (e: any) {
    error(`Failed to read commit ${commitHash}: ${e.message}`);
    throw Object.assign(new Error(`Failed to read commit ${commitHash}`), { statusCode: 400 });
  }

  const steeringFile = loadSteeringFile(options.steering);
  const aiGenerated = detectAiGenerated(message, files);
  const requirementLinked = checkRequirementLink(message);
  const testCoverage = checkTestCoverage(files);
  const steeringFilePresent = steeringFile !== null;

  const messages: string[] = [];
  if (aiGenerated) messages.push('AI-generated code detected');
  if (!requirementLinked) messages.push('Missing requirement link in commit message');
  if (!testCoverage) messages.push('No test files in commit');
  if (!steeringFilePresent) messages.push('Steering file not found');

  const report: AuditReport = {
    commit: commitHash,
    timestamp: new Date().toISOString(),
    requirementLinked,
    testCoverage,
    steeringFilePresent,
    aiGenerated,
    files,
    pass: requirementLinked && testCoverage && steeringFilePresent,
    messages,
  };

  console.log('\n' + JSON.stringify(report, null, 2));

  if (report.pass) {
    success('Audit passed');
  } else {
    warning('Audit failed: ' + messages.join(', '));
  }

  return report;
}
