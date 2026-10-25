// Captures the app's main screens for the site into public/screenshots/, as WebP: the reader, an
// article, filters, and settings, in light and dark, on desktop and phone. Signs in to
// E2E_BASE_URL as E2E_LOGIN with E2E_PASSWORD (from the environment, else screenshots.env); use
// an account subscribed only to public feeds, as everything it shows is published.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Browser, type BrowserContextOptions, chromium, devices, type Page } from 'playwright';
import {
  fileName,
  type Screen,
  SCHEMES,
  type Viewport,
  VIEWPORTS,
} from '../.vitepress/screenshots.ts';

const OUT = join(import.meta.dirname, '..', 'public', 'screenshots');

const CONTEXTS: Record<Viewport, BrowserContextOptions> = {
  desktop: {},
  phone: { ...devices['Pixel 7'] },
};

interface ScreenSteps {
  /** Reaches the screen from the signed-in reader: three panes, All articles. */
  open: (page: Page) => Promise<void>;
  /** Undoes what opening it changed in the account, after the screenshot. */
  restore?: (page: Page) => Promise<void>;
}

const SCREENS: Record<Screen, ScreenSteps> = {
  reader: {
    open: async () => {
      // Signing in lands here.
    },
  },
  article: {
    open: async (page) => {
      await page.getByRole('list', { name: 'Articles' }).getByRole('link').first().click();
      await page.locator('article').getByRole('heading').first().waitFor();
    },
    // Opening it marked it read.
    restore: async (page) => {
      await page.getByRole('button', { name: 'Mark unread' }).click();
      await page.getByRole('button', { name: 'Mark read' }).waitFor();
    },
  },
  filters: {
    open: async (page) => {
      await page.goto('/settings/filters');
      await page.getByRole('heading', { level: 2 }).first().waitFor();
    },
  },
  settings: {
    open: async (page) => {
      await page.goto('/settings/appearance');
      await page.getByRole('heading', { level: 2 }).first().waitFor();
    },
  },
};

function setting(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name} in the environment or screenshots.env`);
  return value;
}

/** Signs in, then makes sure the reader shows three panes, as the screens expect. */
async function signIn(page: Page, login: string, password: string): Promise<void> {
  await page.goto('/all');
  await page.getByLabel('User name').fill(login);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('list', { name: 'Articles' }).waitFor();
  const prefs = (await (await page.request.get('/api/v1/prefs')).json()) as { layout: string };
  if (prefs.layout !== 'threePane') {
    const session = await page.request.get('/api/v1/auth/session');
    const { csrfToken } = (await session.json()) as { csrfToken: string | null };
    await page.request.patch('/api/v1/prefs', {
      headers: { 'x-csrf-token': csrfToken ?? '' },
      data: { layout: 'threePane' },
    });
  }
}

/** Re-encodes a PNG screenshot as WebP with the browser's own encoder. */
async function toWebp(browser: Browser, png: Buffer): Promise<Buffer> {
  const page = await browser.newPage();
  try {
    const url = await page.evaluate(
      async (src) => {
        const image = new Image();
        image.src = src;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas.getContext('2d')?.drawImage(image, 0, 0);
        return canvas.toDataURL('image/webp', 0.85);
      },
      `data:image/png;base64,${png.toString('base64')}`,
    );
    return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
  } finally {
    await page.close();
  }
}

if (import.meta.main) {
  const baseURL = setting('E2E_BASE_URL');
  const login = setting('E2E_LOGIN');
  const password = setting('E2E_PASSWORD');
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const viewport of Object.keys(VIEWPORTS) as Viewport[]) {
      const { width, height, scale } = VIEWPORTS[viewport];
      for (const colorScheme of SCHEMES) {
        // The app's theme follows the system unless the account chose otherwise.
        const context = await browser.newContext({
          ...CONTEXTS[viewport],
          viewport: { width, height },
          deviceScaleFactor: scale,
          baseURL,
          colorScheme,
        });
        const page = await context.newPage();
        await signIn(page, login, password);
        for (const [screen, steps] of Object.entries(SCREENS) as [Screen, ScreenSteps][]) {
          await page.goto('/all');
          await page.getByRole('list', { name: 'Articles' }).getByRole('link').first().waitFor();
          await steps.open(page);
          // Let images and transitions settle.
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(800);
          const file = fileName(screen, viewport, colorScheme);
          writeFileSync(join(OUT, file), await toWebp(browser, await page.screenshot()));
          console.log(file);
          await steps.restore?.(page);
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}
