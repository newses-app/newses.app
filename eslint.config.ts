import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['app-docs/', '.vitepress/cache/', '.vitepress/dist/']),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  ...pluginVue.configs['flat/recommended'],
  // vue-tsc type-checks templates and scripts; type-aware lint rules cover the .ts files.
  { files: ['**/*.vue'], ...tseslint.configs.disableTypeChecked },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        projectService: false,
      },
    },
    rules: { 'no-undef': 'off' },
  },
  {
    files: ['.vitepress/theme/**/*.{ts,vue}'],
    languageOptions: { globals: globals.browser },
  },
  prettier,
);
