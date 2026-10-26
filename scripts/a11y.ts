// Checks every page in the sitemap, and the 404 page, with axe for WCAG 2.2 AA: in light and dark
// on desktop, and the home and download pages on a phone too. Reads the site at A11Y_URL (default
// `pnpm preview`'s address); exits non-zero on any violation.
import AxeBuilder from '@axe-core/playwright';
import { type Browser, chromium, devices } from 'playwright';

const BASE = process.env.A11Y_URL ?? 'http://localhost:4173';
const SCHEMES = ['light', 'dark'] as const;
const PHONE_PAGES = ['/', '/download'];

/** The sitemap's paths, whatever origin it was built for, and a missing page. */
async function paths(): Promise<string[]> {
  const sitemap = await (await fetch(new URL('/sitemap.xml', BASE))).text();
  const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, loc = '']) => new URL(loc).pathname,
  );
  return [...pages, '/no-such-page'];
}

async function check(
  browser: Browser,
  pages: string[],
  options: Parameters<Browser['newContext']>[0],
  label: string,
): Promise<number> {
  const context = await browser.newContext({ ...options, baseURL: BASE });
  const page = await context.newPage();
  let failures = 0;
  for (const path of pages) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      // Experimental; flags only the search button, whose shortcut hint isn't part of its name.
      .disableRules(['label-content-name-mismatch'])
      .analyze();
    for (const violation of violations) {
      failures += 1;
      console.log(
        `${label} ${path}: ${violation.id} (${violation.impact ?? ''}) ${violation.help}`,
      );
      for (const node of violation.nodes.slice(0, 3)) console.log(`    ${node.target.join(' ')}`);
    }
  }
  await context.close();
  return failures;
}

if (import.meta.main) {
  const pages = await paths();
  const browser = await chromium.launch();
  let failures = 0;
  try {
    for (const colorScheme of SCHEMES) {
      failures += await check(browser, pages, { colorScheme }, `desktop ${colorScheme}`);
      failures += await check(
        browser,
        PHONE_PAGES,
        { ...devices['Pixel 7'], colorScheme },
        `phone ${colorScheme}`,
      );
    }
  } finally {
    await browser.close();
  }
  console.log(`${String(pages.length)} pages, ${String(failures)} violations`);
  if (failures > 0) process.exitCode = 1;
}
