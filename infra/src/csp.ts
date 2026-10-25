import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g;

/**
 * `'sha256-…'` sources for every inline script in the built site's pages: VitePress's appearance
 * and platform checks (`metaChunk` keeps its page data out of the HTML).
 */
export function inlineScriptHashes(siteDir: string): string[] {
  const pages = readdirSync(siteDir, { recursive: true, encoding: 'utf8' }).filter((file) =>
    file.endsWith('.html'),
  );
  if (pages.length === 0) throw new Error(`No pages in ${siteDir}: run pnpm build first`);
  const scripts = pages.flatMap((page) =>
    [...readFileSync(join(siteDir, page), 'utf8').matchAll(INLINE_SCRIPT)].map(([, s = '']) => s),
  );
  const hash = (script: string) => createHash('sha256').update(script).digest('base64');
  return [...new Set(scripts.filter((s) => s.trim()).map((s) => `'sha256-${hash(s)}'`))].sort();
}

/** The site's CSP: its own scripts and those inline ones, and fetches to `connectOrigins` too. */
export function siteCsp(siteDir: string, connectOrigins: string[]): string {
  return [
    "default-src 'none'",
    ["script-src 'self'", ...inlineScriptHashes(siteDir)].join(' '),
    // Vue renders style attributes.
    "style-src 'self' 'unsafe-inline'",
    // The theme's icons are data: URLs in CSS masks.
    "img-src 'self' data:",
    "font-src 'self'",
    ["connect-src 'self'", ...connectOrigins].join(' '),
    "manifest-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join('; ');
}
