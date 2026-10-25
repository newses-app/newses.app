// Vite bundles the theme's stylesheets.
declare module '*.css';

/** The app stage's downloads folder, ending in `/` (`downloads()` in `.vitepress/config.ts`). */
declare const __DOWNLOADS_URL__: string;

/** Its `latest.json`; a same-origin path under `vitepress dev`, which proxies it. */
declare const __LATEST_JSON_URL__: string;
