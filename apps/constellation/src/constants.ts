export const NODE_TYPE = {
  TRACK: 'track',
  ARTIST: 'artist',
  ALBUM: 'album',
  PLAYLIST: 'playlist',
  USER: 'user',
} as const;

export const EDGE_TYPE = {
  PERFORMED_BY: 'performed_by',
  ON_ALBUM: 'on_album',
  MADE_BY: 'made_by',
  SAVED: 'saved',
  OWNS: 'owns',
  FOLLOWS: 'follows',
  CONTAINS: 'contains',
  COLLABORATED: 'collaborated',
  RELATED_TO: 'related_to',
} as const;

export const LIKED_SONGS_URI = 'spotify:collection:tracks';

export const ALL_NODE_TYPES = Object.values(NODE_TYPE);
