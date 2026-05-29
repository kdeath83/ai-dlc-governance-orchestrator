import { classifyFile } from '../src/gate';

const MAS_PATTERNS = {
  material: ['api.*contract', 'auth.*flow', 'encryption'],
  routine: ['\\.css$', '\\.md$'],
};

describe('gate', () => {
  it('classifies API contract as material', () => {
    const result = classifyFile('src/api-contract-v2.ts', MAS_PATTERNS.material, MAS_PATTERNS.routine);
    expect(result.materiality).toBe('material');
  });

  it('classifies auth flow as material', () => {
    const result = classifyFile('src/auth-flow.ts', MAS_PATTERNS.material, MAS_PATTERNS.routine);
    expect(result.materiality).toBe('material');
  });

  it('classifies CSS as routine', () => {
    const result = classifyFile('styles.css', MAS_PATTERNS.material, MAS_PATTERNS.routine);
    expect(result.materiality).toBe('routine');
  });

  it('classifies markdown as routine', () => {
    const result = classifyFile('README.md', MAS_PATTERNS.material, MAS_PATTERNS.routine);
    expect(result.materiality).toBe('routine');
  });

  it('defaults unknown to routine', () => {
    const result = classifyFile('src/utils.ts', MAS_PATTERNS.material, MAS_PATTERNS.routine);
    expect(result.materiality).toBe('routine');
  });
});
