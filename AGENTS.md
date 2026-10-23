# AGENTS.md

The Newses project site at `newses.app`: landing page, user guides, contributor pages, and download page, built with VitePress. The app lives in `newses-app/newses`; this repository never changes it, and it never builds this one.

## Commands

| Command | Does |
|---|---|
| `nvm use` | Switch to Node 24 (`.nvmrc`) |
| `pnpm install` | Install dependencies |
| `pnpm check` | Lint, typecheck, format check, tests (run before every commit) |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm format` | Individual steps |
| `pnpm docs:pull` | Copies `docs/architecture.md`, `docs/adr/`, and `AGENTS.md` from the app repository into `app-docs/`: from the checkout at `NEWSES_APP_DIR` when set, otherwise a sparse clone of `NEWSES_APP_BRANCH` (default `dev`) with your git credentials |
| `NEWSES_APP_DIR=../newses pnpm dev` | Site with hot reload on `localhost:5173`, after `docs:pull` |
| `NEWSES_APP_DIR=../newses pnpm build` | Static site in `.vitepress/dist`, after `docs:pull`; fails on dead internal links. `SITE_URL` (default `https://newses.app`) sets the sitemap's origin |
| `pnpm preview` | Serves the last build |

## Code conventions

- Node runs `.ts` directly: erasable syntax only (no enums, namespaces, parameter properties); relative imports use the `.ts` extension.
- Tests live next to code as `*.test.ts` (Vitest).
- `app-docs/` is generated; never edit it. Pulled pages are served under `/contributing/` by `rewrites` in `.vitepress/config.ts`, and the ADR sidebar is generated from their titles (`.vitepress/adr.ts`).
- `PUBLIC_REPOS` in `.vitepress/config.ts` switches on the GitHub social link and "Edit this page"; it stays off while the repositories are private.

## Commits

- Agents never commit, amend, or push on their own. Leave changes in the working tree for the maintainer's review, and commit only when asked.

## Docs map

| Page | Owns |
|---|---|
| `guide/self-hosting.md` | Operating a Docker deployment: install, configuration, upgrade, proxy, backup, restore |
| `guide/migration-ttrss.md` | Importing data from an existing TTRSS instance |
| `/contributing/` (pulled) | Architecture and ADRs, owned by the app repository; change them there |

Put each new fact in the page that owns it. Never state the same fact in two places: include a fact the app repository owns (`<!--@include: …-->`) rather than restating it.

## Doc rules

- Current state of the latest release only. When something changes, edit the page in place.
- No history, dates, or status in pages; decisions are ADRs in the app repository.
- A change to the app's configuration, deployment, or import behaviour arrives as a matching pull request here.

## Tracking

Issues for this repository are tracked in `newses-app/newses` (milestone **Project site**).
