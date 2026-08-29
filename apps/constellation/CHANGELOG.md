# @spicetify-apps/constellation

## 1.1.0

### Minor Changes

- chore(preview): refresh the constellation demo and halve its weight
- docs: correct the lens, paths, and removal copy after the rework
- docs(constellation): refresh the readme for the reworked explorer
- test(constellation): split the graph suite into co-located files
- feat(constellation): add the Arabic locale
- fix(constellation): move the zoom controls and help out of each other's way
- fix(constellation): make the dead-end lens do something and share one visible pass
- fix(constellation): surface a failed social fetch instead of losing friends
- feat(constellation): remove orphans with their cause and restore them together
- fix(constellation): keep a fresh cache instead of recrawling on every visit
- feat(constellation): add Liked Songs as an expandable playlist
- feat(constellation): trace real paths between marked items
- refactor(constellation): split the workspace and dock out of the app shell
- refactor(constellation): own the force-graph instance in a GraphCanvas class
- refactor(constellation): give types and chrome styles their own folders
- fix(shared): flush persisted state on unmount and wait for CosmosAsync
- refactor(ui): promote shared primitives out of constellation
- refactor(shared): fold per-app i18n wiring into createAppTranslator

## 1.0.0

### Major Changes

- docs(constellation): document the full feature set
- chore(preview): convert preview assets to webp
- fix(constellation): float the inspector into a scroll-safe panel
- fix(constellation): show update banner and gate render until ready
- chore(constellation): add preview thumbnail
- Merge remote-tracking branch 'origin/main' into feat/constellation-graph-view
- feat(constellation): multi-select shared-neighborhood lens with reach
- feat(constellation): crawl followed friends' playlists on load
- feat(constellation): tabbed control dock with physics panel
- refactor(constellation): unify control panels and rework layout
- feat(constellation): add, remove, and restore graph nodes
- feat(constellation): crawl followed users into the graph as nodes
- fix(constellation): repaint graph on hover after the sim cools
- fix(ui): stop Spotify shell chrome leaking through buttons
- feat(constellation): revise graph physics, lenses, and node geometry
- feat(constellation): rework control panel, filters, and inspector chrome
- feat(constellation): load avatars for added users and their entities
- feat(constellation): pin, persist, expand, and lens the graph
- refactor(shared): add profile-view client and reactive theme hook
- fix(constellation): keep inspector and canvas from overflowing the row
- refactor(constellation): rework force layout to centering gravity
- feat(constellation): add friends to the graph from the buddy feed
- feat(constellation): elevate graph chrome UI and controls
- feat(constellation): add external entities by link or URI
- refactor(constellation): filter graph-view visibility in data effect
- feat(constellation): add graph guide, nav controls, placeholders
- perf(constellation): split graph-view render path, trim canvas work
- refactor(constellation): persist graph controls via shared hook
- refactor(ui): promote toggle-chip to the shared UI kit
- feat(scripts): update symlink script to configure custom apps
- feat(constellation): keyboard-navigable search, RTL, and empty states
- feat(constellation): fade in node labels at high zoom
- feat(constellation): explore artists and albums via GraphQL expansion
- feat(constellation): cluster, collaboration, and added-since lenses
- feat(constellation): add community detection and collaboration derivation
- feat(constellation): thread addedAt from the library API to graph nodes
- feat(constellation): size-by-degree lens and neighborhood focus
- feat(constellation): cache the crawled library in IndexedDB
- refactor(constellation): extract a shared toggle-chip
- feat(constellation): wire controls and export into graph view
- feat(constellation): graph snapshot and export controls
- feat(constellation): node search query
- feat(constellation): type filter for node and link visibility
- refactor(constellation): extract node paint, add palette singleton
- refactor(constellation): tighten node styling, view boundary, and canvas hot path
- refactor(constellation): unify entity ingestion in services/ingest.ts
- feat(constellation): on-demand node expansion
- feat(constellation): app shell, inspector, and manifest entry
- feat(constellation): Tier-A library crawler
- feat(constellation): force-graph canvas renderer with theme-aware palette
- feat(constellation): graph domain model and node styling
