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
| `NEWSES_APP_DIR=../newses pnpm dev` | Site with hot reload on `localhost:5173`, after `docs:pull`; the download page reads the dev stage's `latest.json` (or `DOWNLOADS_URL`'s) through the dev server's proxy |
| `NEWSES_APP_DIR=../newses pnpm build` | Static site in `.vitepress/dist`, after `docs:pull`; fails on dead internal links. `SITE_URL` (default `https://newses.app`) sets the sitemap's origin, `DOWNLOADS_URL` (default `https://reader.newses.app/downloads/`) the app stage the download page reads |
| `pnpm preview` | Serves the last build |
| `pnpm cdk synth` | Synthesise the site's pipelines and stacks (build the site first: its inline scripts' hashes go in the CSP); deployments run through the pipelines |
| `aws ssm put-parameter --name /<prefix>/deploy-config --type String --overwrite --value file://infra/deploy.config.json` | Store the AWS deployment config (gitignored; copy `infra/deploy.config.example.json`) where the pipelines' synth reads it; needed by `cdk` locally too |
| `pnpm cdk deploy <prefix>-dev-pipeline` (and `<prefix>-prod-pipeline`) | Create a stage's pipeline, once; it runs on creation, and later changes deploy through it |

## Code conventions

- Node runs `.ts` directly: erasable syntax only (no enums, namespaces, parameter properties); relative imports use the `.ts` extension.
- Tests live next to code as `*.test.ts` (Vitest).
- `app-docs/` is generated; never edit it. Pulled pages are served under `/contributing/` by `rewrites` in `.vitepress/config.ts`, and the ADR sidebar is generated from their titles (`.vitepress/adr.ts`).
- `PUBLIC_REPOS` in `.vitepress/config.ts` switches on the GitHub social link and "Edit this page"; it stays off while the repositories are private.
- The site publishes only the project, and self-hosters never reuse it, so it may hardcode the project's URLs (`newses.app`, the app stages, the GitHub repositories). The app repository's rule against hardcoded URLs doesn't apply here; account-specific values for the CDK app still come from `infra/deploy.config.json`.

## Hosting

- `infra/` is the CDK app, in the app's AWS account: per stage, a self-mutating pipeline (`<prefix>-<stage>-pipeline`) and the site stack (`<prefix>-<stage>-site`: private S3 bucket, CloudFront, Route 53 aliases). Physical names start with the config's `resourcePrefix`; everything is tagged `project=<budgetProject>`, so the app's project budget counts it.
- The pipeline runs on every push to the stage's branch, and on pushes to the app repository's matching branch that change `docs/architecture.md`, `docs/adr/`, or `AGENTS.md`. It runs `pnpm check`, builds with the app checkout as `NEWSES_APP_DIR`, deploys, and smoke-tests the headers, the 404 page, and the `www` redirect.
- CloudFront redirects other hosts (`www`) to the stage's domain, serves clean URLs from their `.html` files and folders from `index.html`, and answers unknown paths with `404.html`. `assets/` is cached for a year and kept across deployments; everything else is revalidated, pruned, and invalidated on each deployment.
- Headers: HSTS, a CSP allowing VitePress's inline scripts by hash and fetches to the downloads origin, `DENY` framing, and `x-robots-tag: noindex` on stages with `noindex`.

## Commits

- Agents never commit, amend, or push on their own. Leave changes in the working tree for the maintainer's review, and commit only when asked.

## Docs map

| Page | Owns |
|---|---|
| `guide/self-hosting.md` | Operating a Docker deployment: install, configuration, upgrade, proxy, backup, restore |
| `guide/migration-ttrss.md` | Importing data from an existing TTRSS instance |
| `download.md` | The latest release's installers, read from the app stage's `latest.json` in the browser |
| `/contributing/` (pulled) | Architecture and ADRs, owned by the app repository; change them there |

Put each new fact in the page that owns it. Never state the same fact in two places: include a fact the app repository owns (`<!--@include: …-->`) rather than restating it.

## Doc rules

- Current state of the latest release only. When something changes, edit the page in place.
- No history, dates, or status in pages; decisions are ADRs in the app repository.
- A change to the app's configuration, deployment, or import behaviour arrives as a matching pull request here.

## Tracking

Issues for this repository are tracked in `newses-app/newses` (milestone **Project site**).
