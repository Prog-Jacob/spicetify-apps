# @spicetify-apps/data-porter

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
