// Draws the site's social card, the image link previews show, into public/social-card.png: the
// icon, name, and tagline in the site's font and brand colour, beside the light reader screenshot
// when `pnpm screenshots` has written it.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { fileName } from '../.vitepress/screenshots.ts';

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'public', 'social-card.png');
const FONT = join(
  ROOT,
  'node_modules/vitepress/dist/client/theme-default/fonts/inter-roman-latin.woff2',
);
const ICON = join(ROOT, 'public', 'favicon.svg');
const SCREENSHOT = join(ROOT, 'public', 'screenshots', fileName('reader', 'desktop', 'light'));

/** Open Graph's recommended size. */
const WIDTH = 1200;
const HEIGHT = 630;

const dataUrl = (file: string, type: string) =>
  `data:${type};base64,${readFileSync(file).toString('base64')}`;

function html(): string {
  const screenshot = existsSync(SCREENSHOT)
    ? `<img class="screenshot" src="${dataUrl(SCREENSHOT, 'image/webp')}" alt="">`
    : '';
  return `<!doctype html>
<style>
  @font-face { font-family: Inter; src: url(${dataUrl(FONT, 'font/woff2')}); font-weight: 100 900; }
  * { margin: 0; box-sizing: border-box; }
  body {
    width: ${String(WIDTH)}px; height: ${String(HEIGHT)}px; overflow: hidden; position: relative;
    font-family: Inter, sans-serif; color: #3c3c43;
    background: linear-gradient(135deg, #fff8f1 0%, #ffe9d4 100%);
  }
  .text { position: absolute; left: 72px; top: 0; bottom: 0; width: 520px; display: flex;
    flex-direction: column; justify-content: center; gap: 24px; }
  .name { display: flex; align-items: center; gap: 20px; font-size: 64px; font-weight: 700;
    color: #1f1f1f; letter-spacing: -1px; }
  .name img { width: 88px; height: 88px; }
  .tagline { font-size: 44px; font-weight: 700; line-height: 1.15; color: #b35900;
    letter-spacing: -0.5px; }
  .details { font-size: 26px; line-height: 1.4; }
  .url { font-size: 24px; font-weight: 600; color: #67676c; }
  .screenshot { position: absolute; left: 640px; top: 96px; width: 900px; border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.08); box-shadow: 0 24px 64px rgba(120, 60, 0, 0.25); }
</style>
<div class="text">
  <div class="name"><img src="${dataUrl(ICON, 'image/svg+xml')}" alt="">Newses</div>
  <div class="tagline">Your feeds, on your own server</div>
  <div class="details">Self-hosted, multi-user RSS reader and Tiny Tiny RSS replacement, with web, desktop, and Android apps.</div>
  <div class="url">newses.app</div>
</div>
${screenshot}`;
}

if (import.meta.main) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
    await page.setContent(html());
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: OUT });
    console.log(OUT);
  } finally {
    await browser.close();
  }
}
