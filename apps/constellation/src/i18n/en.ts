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
  'inspector.connections': 'Connections ({count})',
} as const;

export default en;
export type MessageKey = keyof typeof en;
