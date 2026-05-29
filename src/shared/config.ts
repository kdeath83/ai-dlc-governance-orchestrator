import os from 'os';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { SteeringFile } from './types';

function isSafePath(targetPath: string): boolean {
  const resolved = path.resolve(targetPath);
  const cwd = process.cwd();
  const tmpDir = os.tmpdir();
  // Allow paths within cwd, explicit /tmp or /var/tmp, or system temp dir
  return (
    resolved.startsWith(cwd) ||
    resolved.startsWith('/tmp') ||
    resolved.startsWith('/var/tmp') ||
    resolved.startsWith(tmpDir)
  );
}

export function loadSteeringFile(steeringPath: string): SteeringFile | null {
  if (!isSafePath(steeringPath)) {
    throw new Error('Path traversal detected: steering path outside allowed directories');
  }
  const fullPath = path.resolve(steeringPath, 'default.yaml');
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  return yaml.load(content) as SteeringFile;
}

export function ensureSteeringDir(outputPath: string): void {
  if (!isSafePath(outputPath)) {
    throw new Error('Path traversal detected: output path outside allowed directories');
  }
  fs.mkdirSync(outputPath, { recursive: true });
}
