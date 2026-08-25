const en = {
  'app.title': 'Constellation',
  'app.loading': 'Mapping your library…',
  'app.error': 'Could not load your library.',

  'type.track': 'Track',
  'type.artist': 'Artist',
  'type.album': 'Album',
  'type.playlist': 'Playlist',
  'type.user': 'You',

  'inspector.empty': '{count} in view. Pick a node to inspect it.',
  'inspector.play': 'Play',
  'inspector.expand': 'Expand',
  'inspector.expanding': 'Expanding…',
  'inspector.focus': 'Focus neighborhood',
  'inspector.clearFocus': 'Clear focus',
  'inspector.connections': 'Connections ({count})',

  'controls.search': 'Search nodes…',
  'controls.noMatches': 'No matches',

  'actions.exportImage': 'Export image',
  'actions.exportData': 'Export data',

  'lens.byDegree': 'Size by connections',
  'lens.byCluster': 'Color by cluster',
  'edges.collaborations': 'Collaborations',

  'time.all': 'All time',
  'time.since': 'Since {date}',
  'time.label': 'Show items added since',

  'expand.failed': 'Could not expand this node.',
} as const;

export default en;
export type MessageKey = keyof typeof en;
