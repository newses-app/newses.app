import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface Adr {
  number: string;
  title: string;
  /** `Accepted`, `Superseded by NNNN`, … */
  status: string;
  link: string;
}

/** Reads an ADR's `# NNNN. Title` heading and `- Status:` line. */
export function parseAdr(file: string, text: string): Adr {
  const heading = /^# (\d{4})\. (.+)$/m.exec(text);
  const status = /^- Status: (.+)$/m.exec(text);
  if (!heading?.[1] || !heading[2] || !status?.[1]) {
    throw new Error(`${file}: expected a "# NNNN. Title" heading and a "- Status:" line`);
  }
  return {
    number: heading[1],
    title: heading[2].trim(),
    status: status[1].trim(),
    link: `/contributing/adr/${file.replace(/\.md$/, '')}`,
  };
}

/** The ADRs in `dir` (the pulled `docs/adr`), in number order. */
export function readAdrs(dir: string): Adr[] {
  return readdirSync(dir)
    .filter((file) => /^\d{4}-.+\.md$/.test(file))
    .sort()
    .map((file) => parseAdr(file, readFileSync(join(dir, file), 'utf8')));
}
