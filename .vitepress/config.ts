import { fileURLToPath } from 'node:url';
import { defineConfig, type DefaultTheme, type UserConfig, type UserConfigFn } from 'vitepress';
import { readAdrs } from './adr.ts';

/** GitHub links (social link, "Edit this page"); off while the repositories are private. */
const PUBLIC_REPOS = false as boolean;

/** The stage's origin, for the sitemap. */
const SITE_URL = process.env.SITE_URL ?? 'https://newses.app';

/**
 * The app stage's downloads folder, whose `latest.json` the download page reads: `DOWNLOADS_URL`,
 * else prod's for builds and dev's for `vitepress dev`. The stage allows only the site's own
 * origins to fetch it, so the dev server proxies it.
 */
function downloads(command: 'build' | 'serve'): NonNullable<UserConfig['vite']> {
  const url = new URL(
    process.env.DOWNLOADS_URL ??
      (command === 'serve'
        ? 'https://reader-dev.newses.app/downloads/'
        : 'https://reader.newses.app/downloads/'),
  );
  const latest = `${url.pathname}latest.json`;
  return {
    define: {
      __DOWNLOADS_URL__: JSON.stringify(url.href),
      __LATEST_JSON_URL__: JSON.stringify(command === 'serve' ? latest : new URL(latest, url).href),
    },
    server: { proxy: { [latest]: { target: url.origin, changeOrigin: true } } },
  };
}

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

const config: UserConfigFn<DefaultTheme.Config> = ({ command }) =>
  defineConfig({
    lang: 'en',
    title: 'Newses',
    description: 'Self-hosted, multi-user RSS reader and Tiny Tiny RSS replacement',
    cleanUrls: true,
    lastUpdated: true,
    sitemap: { hostname: SITE_URL },
    // Page data goes in a script file rather than inline, so the CSP allows inline scripts by hash.
    metaChunk: true,
    markdown: {
      // Mermaid fences become diagrams, drawn in the browser (MermaidDiagram.vue).
      config(md) {
        const fence = md.renderer.rules.fence;
        md.renderer.rules.fence = (tokens, idx, options, env, self) => {
          const token = tokens[idx];
          if (token?.info.trim() === 'mermaid') {
            return `<MermaidDiagram code="${encodeURIComponent(token.content)}" />`;
          }
          return fence
            ? fence(tokens, idx, options, env, self)
            : self.renderToken(tokens, idx, options);
        };
      },
    },
    vite: downloads(command),
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
      footer: { message: 'Released under the AGPL-3.0-or-later license.' },
      search: { provider: 'local' },
      nav: [
        { text: 'Guide', link: '/guide/getting-started', activeMatch: '^/guide/' },
        {
          text: 'Contributing',
          link: '/contributing/',
          activeMatch: '^/contributing/',
        },
        { text: 'Download', link: '/download' },
      ],
      sidebar: {
        '/guide/': [
          {
            text: 'Run Newses',
            items: [
              { text: 'Getting started', link: '/guide/getting-started' },
              { text: 'Self-hosting with Docker', link: '/guide/self-hosting' },
              { text: 'Migrating from TTRSS', link: '/guide/migration-ttrss' },
            ],
          },
          {
            text: 'Use Newses',
            items: [
              { text: 'Reading', link: '/guide/reading' },
              { text: 'Feeds', link: '/guide/feeds' },
              { text: 'Labels, tags, notes, and scores', link: '/guide/organising' },
              { text: 'Keyboard shortcuts', link: '/guide/shortcuts' },
              { text: 'Sharing', link: '/guide/sharing' },
              { text: 'Account and security', link: '/guide/account' },
            ],
          },
          {
            text: 'Apps',
            items: [
              { text: 'Desktop and Android apps', link: '/guide/apps' },
              { text: 'Third-party clients', link: '/guide/clients' },
            ],
          },
          { text: 'Help', items: [{ text: 'FAQ', link: '/guide/faq' }] },
        ],
        '/contributing/': [
          {
            text: 'Contributing',
            items: [
              { text: 'Setup and conventions', link: '/contributing/' },
              { text: 'Architecture', link: '/contributing/architecture' },
            ],
          },
          {
            text: 'Decision records',
            link: '/contributing/adr/',
            collapsed: true,
            items: adrs.map((adr) => ({ text: `${adr.number}. ${adr.title}`, link: adr.link })),
          },
        ],
      },
      ...(PUBLIC_REPOS ? github : {}),
    },
  });

export default config;
