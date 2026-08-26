const en = {
  'app.title': 'Constellation',
  'app.loading': 'Mapping your library…',
  'app.loadingSub': 'Reading your saved songs, artists, albums, and playlists.',
  'app.error': 'Could not load your library.',
  'app.errorSub': 'Something interrupted the crawl.',
  'app.retry': 'Retry',
  'app.emptyTitle': 'Your library looks empty',
  'app.empty': 'Save some songs, artists, or playlists in Spotify, then reopen Constellation.',

  'type.track': 'Track',
  'type.artist': 'Artist',
  'type.album': 'Album',
  'type.playlist': 'Playlist',
  'type.user': 'You',

  'inspector.play': 'Play',
  'inspector.queue': 'Add to queue',
  'inspector.open': 'Open in Spotify',
  'inspector.saved': 'Saved {date}',
  'inspector.expand': 'Expand',
  'inspector.expanding': 'Expanding…',
  'inspector.focus': 'Focus neighborhood',
  'inspector.clearFocus': 'Clear focus',
  'inspector.unpin': 'Unpin',
  'inspector.close': 'Close',
  'inspector.connections': 'Connections ({count})',

  'controls.search': 'Search nodes…',
  'controls.noMatches': 'No matches',
  'controls.clearSearch': 'Clear search',
  'controls.resultCount': '{count} results',
  'controls.releasePins': 'Release {count} pinned',

  'scale.summary': '{nodes} nodes · {links} connections',
  'filters.show': 'Show',
  'filters.reset': 'Reset',
  'lens.label': 'Lenses',

  'panel.show': 'Controls',
  'panel.hide': 'Hide controls',

  'actions.expandAll': 'Expand all',
  'actions.expanding': 'Expanding {done}/{total}…',
  'actions.cancel': 'Cancel',

  'add.label': 'Add to graph',
  'add.placeholder': 'Paste a profile, artist, album, or playlist link',
  'add.button': 'Add',
  'add.adding': 'Adding…',
  'add.invalid': 'Paste a Spotify link or URI for a user, artist, album, or playlist.',
  'add.failed': 'Could not add that to the graph.',
  'add.userFailed': 'That profile is private or does not exist.',

  'friends.add': 'Add a friend',
  'friends.loading': 'Loading friends…',
  'friends.empty': 'No friends found on Spotify.',

  'actions.export': 'Export',
  'actions.image': 'Image',
  'actions.data': 'Data',

  'nav.zoomIn': 'Zoom in',
  'nav.zoomOut': 'Zoom out',
  'nav.fit': 'Fit graph to view',

  'lens.byDegree': 'Size by connections',
  'lens.byCluster': 'Color by cluster',
  'lens.common': 'Common only',
  'edges.collaborations': 'Collaborations',

  'time.all': 'All time',
  'time.since': 'Since {date}',
  'time.label': 'Show items added since',
  'time.section': 'Added since',
  'time.reset': 'Show all time',

  'expand.failed': 'Could not expand this node.',

  'guide.title': 'Explore your library',
  'guide.click': 'Click a node to inspect it.',
  'guide.hover': 'Hover a node to highlight its neighbours.',
  'guide.drag': 'Drag a node to pin it in place.',
  'guide.expand': 'Double-click a node to expand it.',
  'guide.zoom': 'Scroll to zoom in and out.',
  'guide.legendLibrary': 'Library links',
  'guide.legendCollab': 'Collaborations',
  'guide.dismiss': 'Got it',
  'guide.help': 'Show help',
} as const;

export default en;
export type MessageKey = keyof typeof en;
