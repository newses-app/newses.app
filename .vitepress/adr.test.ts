import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseAdr, readAdrs } from './adr.ts';

const adr = (heading: string, status: string) =>
  `${heading}\n\n- Status: ${status}\n- Date: 2026-10-03\n\n## Context\nText.\n`;

describe('parseAdr', () => {
  it('reads the number, title, status, and link', () => {
    expect(
      parseAdr(
        '0001-documentation-conventions.md',
        adr('# 0001. Documentation conventions', 'Superseded by 0079'),
      ),
    ).toEqual({
      number: '0001',
      title: 'Documentation conventions',
      status: 'Superseded by 0079',
      link: '/contributing/adr/0001-documentation-conventions',
    });
  });

  it('refuses an ADR without a numbered heading or status', () => {
    expect(() => parseAdr('0002-x.md', '# X\n\n- Status: Accepted\n')).toThrow('0002-x.md');
    expect(() => parseAdr('0002-x.md', '# 0002. X\n')).toThrow('0002-x.md');
  });
});

describe('readAdrs', () => {
  it('lists only numbered ADR files, in number order', () => {
    const dir = mkdtempSync(join(tmpdir(), 'adr-test-'));
    try {
      writeFileSync(join(dir, '0010-ten.md'), adr('# 0010. Ten', 'Accepted'));
      writeFileSync(join(dir, '0002-two.md'), adr('# 0002. Two', 'Accepted'));
      writeFileSync(join(dir, 'README.md'), '# ADRs\n');

      expect(readAdrs(dir).map((entry) => entry.number)).toEqual(['0002', '0010']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
