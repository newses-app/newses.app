import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['.vitepress/**/*.test.ts', 'scripts/**/*.test.ts', 'infra/src/**/*.test.ts'],
    // Synthesising the stacks takes a few seconds.
    testTimeout: 60_000,
    // Tests synthesise against the example, never a real deployment's config.
    env: {
      NEWSES_SITE_DEPLOY_CONFIG: fileURLToPath(
        new URL('infra/deploy.config.example.json', import.meta.url),
      ),
    },
  },
});
