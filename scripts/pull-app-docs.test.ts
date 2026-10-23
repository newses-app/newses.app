import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { copyAppDocs } from './pull-app-docs.ts';

const dirs: string[] = [];

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'pull-app-docs-test-'));
  dirs.push(dir);
  return dir;
}

function write(root: string, path: string, text: string): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('copyAppDocs', () => {
  it('copies architecture, ADRs, and AGENTS.md, but not requirements', () => {
    const source = tempDir();
    write(source, 'docs/architecture.md', '# Architecture\n');
    write(source, 'docs/adr/0001-one.md', '# 0001. One\n');
    write(source, 'docs/requirements.md', '# Requirements\n');
    write(source, 'AGENTS.md', '# AGENTS.md\n');
    const out = join(tempDir(), 'app-docs');
    write(out, 'docs/adr/0002-stale.md', 'stale');

    copyAppDocs(source, out);

    expect(readFileSync(join(out, 'docs/adr/0001-one.md'), 'utf8')).toBe('# 0001. One\n');
    expect(existsSync(join(out, 'docs/architecture.md'))).toBe(true);
    expect(existsSync(join(out, 'AGENTS.md'))).toBe(true);
    expect(existsSync(join(out, 'docs/requirements.md'))).toBe(false);
    expect(existsSync(join(out, 'docs/adr/0002-stale.md'))).toBe(false);
  });

  it('refuses a source without every path', () => {
    const source = tempDir();
    write(source, 'docs/architecture.md', '# Architecture\n');

    expect(() => {
      copyAppDocs(source, join(tempDir(), 'app-docs'));
    }).toThrow('has no docs/adr, AGENTS.md');
  });
});
