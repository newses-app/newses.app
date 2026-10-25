import { basename } from 'node:path';
import { defineLoader } from 'vitepress';

declare const data: string[];
export { data };

/** The screenshots present, so the home page shows only those. */
export default defineLoader({
  watch: ['../public/screenshots/*.webp'],
  load: (files: string[]) => files.map((file) => basename(file)),
});
