# CLAUDE.md

Custom apps for the Spotify desktop client, built on [Spicetify](https://spicetify.app). A pnpm monorepo meant to be forked. The developer guide below is the source of truth for layout, rules, building blocks and workflows.

@CONTRIBUTING.md

## Agent notes

- Run `pnpm precommit` before you call work done. It fails on lint warnings.
- Read `scripts/app-template/src/app.tsx` before you wire a new app.
- Never invent props for `Spicetify.ReactComponent.*`. Check the running client over DevTools first.
- Follow the import order and comment rules under "Code style" in the guide. Lint does not catch all of them.
- User docs: the root `README.md` and each `apps/<app>/README.md`. The Marketplace renders app READMEs, so keep Mermaid out of them.
