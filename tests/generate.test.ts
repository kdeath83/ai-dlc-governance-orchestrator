import { generate } from '../src/generate';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('generate', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dlc-gov-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('generates MAS-SG steering file', async () => {
    const filePath = await generate({ jurisdiction: 'MAS-SG', output: tmpDir });
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('MAS-SG');
    expect(content).toContain('requireEncryption');
  });

  it('generates EU-AI-ACT steering file', async () => {
    const filePath = await generate({ jurisdiction: 'EU-AI-ACT', output: tmpDir });
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('EU-AI-ACT');
  });

  it('fails for unknown jurisdiction', async () => {
    await expect(generate({ jurisdiction: 'UNKNOWN', output: tmpDir })).rejects.toThrow('Unknown jurisdiction');
  });
});
