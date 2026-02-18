import type { DataTypeConfig } from './types/export';

export const DATA_TYPES: DataTypeConfig[] = [
  {
    type: 'playlists',
    label: 'Playlists',
    description: 'Playlists with all their tracks',
    icon: 'playlist',
    getCount: (d) => d.playlists?.length ?? 0,
  },
  {
    type: 'likedSongs',
    label: 'Liked Songs',
    description: 'Songs you\u2019ve liked',
    icon: 'heart',
    getCount: (d) => d.library?.tracks.length ?? 0,
  },
  {
    type: 'albums',
    label: 'Albums',
    description: 'Albums you\u2019ve saved',
    icon: 'album',
    getCount: (d) => d.library?.albums.length ?? 0,
  },
  {
    type: 'artists',
    label: 'Artists',
    description: 'Artists you follow',
    icon: 'artist',
    getCount: (d) => d.library?.artists.length ?? 0,
  },
  {
    type: 'shows',
    label: 'Shows',
    description: 'Podcasts you follow',
    icon: 'podcasts',
    getCount: (d) => d.library?.shows.length ?? 0,
  },
];
