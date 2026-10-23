import { fileURLToPath } from 'node:url';
import { defineConfig, type DefaultTheme } from 'vitepress';
import { readAdrs } from './adr.ts';

/** GitHub links (social link, "Edit this page"); off while the repositories are private. */
const PUBLIC_REPOS = false as boolean;

/** The stage's origin, for the sitemap. */
const SITE_URL = process.env.SITE_URL ?? 'https://newses.app';

const adrs = readAdrs(fileURLToPath(new URL('../app-docs/docs/adr', import.meta.url)));

const github: Pick<DefaultTheme.Config, 'socialLinks' | 'editLink'> = {
  socialLinks: [{ icon: 'github', link: 'https://github.com/newses-app/newses' }],
  editLink: {
    // Serialized into the client, so it can use nothing outside itself.
    pattern: ({ filePath }) =>
      filePath.startsWith('app-docs/')
        ? `https://github.com/newses-app/newses/edit/dev/${filePath.slice('app-docs/'.length)}`
        : `https://github.com/newses-app/newses.app/edit/dev/${filePath}`,
  },
};

export default defineConfig({
  lang: 'en',
  title: 'Newses',
  description: 'Self-hosted, multi-user RSS reader and Tiny Tiny RSS replacement',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: { hostname: SITE_URL },
  srcExclude: ['README.md', 'AGENTS.md', 'CLAUDE.md', 'app-docs/AGENTS.md'],
  rewrites: {
    'app-docs/docs/architecture.md': 'contributing/architecture.md',
    'app-docs/docs/adr/:file': 'contributing/adr/:file',
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
  ],
  // Pulled pages aren't tracked here, so git has no date for them.
  transformPageData(pageData) {
    if (pageData.filePath.startsWith('app-docs/')) delete pageData.lastUpdated;
  },
  themeConfig: {
    logo: '/favicon.svg',
    search: { provider: 'local' },
    nav: [
      { text: 'Guide', link: '/guide/self-hosting', activeMatch: '^/guide/' },
      { text: 'Contributing', link: '/contributing/architecture', activeMatch: '^/contributing/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Self-hosting', link: '/guide/self-hosting' },
            { text: 'Migrating from TTRSS', link: '/guide/migration-ttrss' },
          ],
        },
      ],
      '/contributing/': [
        {
          text: 'Contributing',
          items: [{ text: 'Architecture', link: '/contributing/architecture' }],
        },
        {
          text: 'Decision records',
          collapsed: true,
          items: adrs.map((adr) => ({ text: `${adr.number}. ${adr.title}`, link: adr.link })),
        },
      ],
    },
    ...(PUBLIC_REPOS ? github : {}),
  },
});
