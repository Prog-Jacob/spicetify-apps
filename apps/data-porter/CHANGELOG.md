# @spicetify-apps/data-porter

## 3.1.0

### Minor Changes

- chore(data-porter): update preview gif
- refactor(data-porter): use shared SummaryTile and WarningBanner in export summary
- refactor(data-porter): rewrite import summary with stat tiles and filtering
- feat(ui): add SummaryTile and WarningBanner components
- feat(data-porter): redesign app icon
- chore: lint scripts/*.mjs as node modules
- chore(data-porter): tune marketplace search keywords
- docs: expand README and CLAUDE.md with architecture, forking, and commands
- feat: add setup-fork script and git pre-commit hook
- feat(create-app): add README template, new placeholders, and auto-install
- refactor: extract shared script helpers into lib.mts
- docs: add content preview section to README for data-porter
- docs: update Node.js and pnpm version requirements in README

## 3.0.0

### Major Changes

- fix(release): remove version specification for pnpm action setup
- chore: include changeset scripts in typecheck, add noEmit to base tsconfig
- chore: add CI workflow, dev-prelaunch script, and test command
- feat(data-porter): add content preview with drill-down and artwork enrichment
- fix(data-porter): improve exporter accuracy and harden file parser
- feat(ui): add Pill and FilterBar shared components
- refactor: remove platform facade, simplify batch API, drop unused deps

## 2.4.0

### Minor Changes

- chore: upgrade to TypeScript 6, ESLint 10, esbuild 0.28, tailwind-merge 3
- feat: add interactive create-app scaffolder with real template files
- docs: add compile-time assertion comments to i18n check files
- fix(data-porter): add URL fetch timeout, fix byte count check and playlist name dedup
- docs: add CLAUDE.md for Claude Code context

## 2.3.0

### Minor Changes

- feat(data-porter): wire profile import into the import flow
- feat(shared): add isProfileInput profile detector

## 2.2.0

### Minor Changes

- fix(release): conditionally commit version bump and changesets
- docs: rewrite root and data-porter READMEs
- feat(data-porter): playlist review step before import
- fix: relocate app i18n, enable bundled locales, fix release script
- refactor(data-porter): unify data type registry and break circular dep
- fix(ui): fix duplicate keys, timer leak, and conventions
- fix(data-porter): fix import order, progress, size check, and cancel
- fix(shared): fix null handling, pagination, and timezone bugs

## 2.1.0

### Minor Changes

- feat(data-porter): export/import taste exclusions (ignoreinrecs) with banned content

## 2.0.0

### Major Changes

- docs: rewrite and update root and data-porter READMEs and previews
- feat: integrate @changesets/cli for curated release notes
- fix(data-porter): use RootlistAPI for playlist discovery to include folder-nested playlists
- fix(shared): type Spicetify.Platform APIs and remove downstream as-casts
- feat(data-porter): add search history export and profile country/product fields
- feat(data-porter): unify file parser, add episode/banned content import, fix RecentsAPI fields
- feat(data-porter): add recently played, banned content, and profile export
- fix(data-porter): minify json exports
- fix(data-porter): enhance conflict card scrollbar layout
- fix(ui): reorganize imports and introduce native TextComponent replacement
