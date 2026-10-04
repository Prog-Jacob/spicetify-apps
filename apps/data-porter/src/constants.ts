export const PERMISSION_SETTLE_MS = 1000;
export const PLAYLIST_BATCH_SIZE = 10;
export const BATCH_DELAY_MS = 500;

// Spotify collection sets used by both exporter and importer; must stay in sync
export const BAN_SET = {
  ARTISTS: 'artistban',
  TRACKS: 'notinterested',
  TASTE: 'ignoreinrecs',
} as const;

export const EXPORT_FILENAME_PREFIX = 'spotify-export';

export const LOG_STATUS = { OK: 'ok', SKIPPED: 'skipped', ERROR: 'error' } as const;

export const SOURCE_FORMAT = {
  OUR_EXPORT: 'our-export',
  SPOTIFY_OFFICIAL: 'spotify-official',
  PROFILE: 'profile',
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
  EPISODES: 'episodes',
  RECENTLY_PLAYED: 'recentlyPlayed',
  BANNED_CONTENT: 'bannedContent',
  PROFILE: 'profile',
  SEARCH_HISTORY: 'searchHistory',
} as const;
