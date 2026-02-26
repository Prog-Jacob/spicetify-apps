export const ROUTE = { IMPORT: '/import' } as const;

export const EXPORT_FILENAME_PREFIX = 'spotify-export';

export const LOG_STATUS = { OK: 'ok', SKIPPED: 'skipped', ERROR: 'error' } as const;

export const ANIMATION_STAGGER_MS = { CONFLICT_ITEM: 45, SUMMARY_ITEM: 80 } as const;

export const SOURCE_FORMAT = {
  OUR_EXPORT: 'our-export',
  SPOTIFY_OFFICIAL: 'spotify-official',
} as const;

export const CONFLICT_RESOLUTION = {
  SKIP: 'skip',
  MERGE: 'merge',
  CREATE_NEW: 'create-new',
} as const;

export const DATA_TYPE = {
  PLAYLISTS: 'playlists',
  LIKED_SONGS: 'likedSongs',
  ALBUMS: 'albums',
  ARTISTS: 'artists',
  SHOWS: 'shows',
} as const;

export const EXPORT_STATUS = {
  IDLE: 'idle',
  DONE: 'done',
  ERROR: 'error',
  FETCHING: 'fetching',
} as const;

export const IMPORT_STEP = {
  DONE: 'done',
  ERROR: 'error',
  UPLOAD: 'upload',
  PREVIEW: 'preview',
  CONFLICTS: 'conflicts',
  IMPORTING: 'importing',
} as const;
