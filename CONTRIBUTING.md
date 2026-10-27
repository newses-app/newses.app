# Contributing to newses.app

This repository is the project site. Issues for it, and the contribution workflow, code of conduct, and security policy, live in [`newses-app/newses`](https://github.com/newses-app/newses): see its [CONTRIBUTING.md](https://github.com/newses-app/newses/blob/main/CONTRIBUTING.md).

For pull requests here:

- Branch from `dev` and target `dev`.
- `pnpm check` passes, and `NEWSES_APP_DIR=../newses pnpm build` succeeds (see [AGENTS.md](AGENTS.md) for the commands).
- Pages under `/contributing/` that come from the app repository (architecture, decision records, commands, and conventions) change there, not here.
