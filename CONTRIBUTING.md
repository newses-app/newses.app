# Contributing to newses.app

This repository is the project site: its pages, guides, and hosting. The code of conduct, security policy, and the rest of the contribution workflow live in [`newses-app/newses`](https://github.com/newses-app/newses): see its [CONTRIBUTING.md](https://github.com/newses-app/newses/blob/main/CONTRIBUTING.md).

## Issues

- File an issue here when the fix lands here: a wrong or unclear guide, a broken link or page, the download page, or the site's hosting. Use the page problem or suggestion form.
- Newses itself (the server, the web, desktop, and Android apps), and the architecture and decision records under `/contributing/`, are tracked in [`newses-app/newses`](https://github.com/newses-app/newses/issues).
- Report vulnerabilities in either repository privately, as its [security policy](https://github.com/newses-app/newses/security/policy) describes.

## Pull requests

- Branch from `dev` and target `dev`.
- `pnpm check` passes, and `NEWSES_APP_DIR=../newses pnpm build` succeeds (see [AGENTS.md](AGENTS.md) for the commands).
- Pages under `/contributing/` that come from the app repository (architecture, decision records, commands, and conventions) change there, not here.
