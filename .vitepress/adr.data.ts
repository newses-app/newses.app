import { fileURLToPath } from 'node:url';
import { defineLoader } from 'vitepress';
import { type Adr, readAdrs } from './adr.ts';

declare const data: Adr[];
export { data };

/** The pulled ADRs, for the index page. */
export default defineLoader({
  watch: ['../app-docs/docs/adr/*.md'],
  load: () => readAdrs(fileURLToPath(new URL('../app-docs/docs/adr', import.meta.url))),
});
