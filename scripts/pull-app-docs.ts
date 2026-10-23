// Copies the app repository's contributor docs into app-docs/ for the build: from NEWSES_APP_DIR
// when set (the pipeline's second source, or a local checkout), otherwise from a sparse, shallow
// clone of NEWSES_APP_BRANCH (default dev).
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export const APP_REPO = 'https://github.com/newses-app/newses.git';
/** The app repository's paths the site publishes; requirements.md stays internal. */
export const APP_PATHS = ['docs/architecture.md', 'docs/adr', 'AGENTS.md'];

/** Replaces `out` with `APP_PATHS` copied from the app checkout at `source`. */
export function copyAppDocs(source: string, out: string): void {
  const missing = APP_PATHS.filter((path) => !existsSync(join(source, path)));
  if (missing.length > 0) throw new Error(`${source} has no ${missing.join(', ')}`);
  rmSync(out, { recursive: true, force: true });
  for (const path of APP_PATHS) cpSync(join(source, path), join(out, path), { recursive: true });
}

/** Clones only `APP_PATHS` of `branch` into a new temporary directory and returns it. */
function cloneAppDocs(branch: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'newses-app-docs-'));
  const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, stdio: 'inherit' });
  git(
    'clone',
    '--quiet',
    '--depth=1',
    '--filter=blob:none',
    '--sparse',
    `--branch=${branch}`,
    APP_REPO,
    '.',
  );
  git('sparse-checkout', 'set', '--no-cone', ...APP_PATHS.map((path) => `/${path}`));
  return dir;
}

if (import.meta.main) {
  const out = resolve(import.meta.dirname, '..', 'app-docs');
  const local = process.env.NEWSES_APP_DIR;
  if (local) {
    copyAppDocs(resolve(local), out);
  } else {
    const dir = cloneAppDocs(process.env.NEWSES_APP_BRANCH ?? 'dev');
    try {
      copyAppDocs(dir, out);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
}
