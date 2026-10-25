import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { siteCsp } from './csp.ts';

describe('siteCsp', () => {
  it("allows the pages' inline scripts by hash, and fetches from the given origins", () => {
    const dir = mkdtempSync(join(tmpdir(), 'site-'));
    mkdirSync(join(dir, 'guide'));
    writeFileSync(
      join(dir, 'index.html'),
      '<script id="a">one()</script><script src="/x.js"></script>',
    );
    writeFileSync(join(dir, 'guide/x.html'), '<script id="a">one()</script>');

    const csp = siteCsp(dir, ['https://reader.example.com']);

    // printf 'one()' | openssl dgst -sha256 -binary | base64
    expect(csp).toContain(
      "script-src 'self' 'sha256-HR7iaask9daLMRRskMI++QeJtjWDOjyPA6lGzYGzKW4='; ",
    );
    expect(csp).toContain("connect-src 'self' https://reader.example.com; ");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('needs a built site', () => {
    expect(() => siteCsp(mkdtempSync(join(tmpdir(), 'site-')), [])).toThrow('pnpm build');
  });
});
