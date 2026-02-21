import type { DataType, ExportData } from './types/export';

type DataTypeConfig = {
  type: DataType;
  label: string;
  description: string;
  icon: Spicetify.Icon;
  getCount: (data: ExportData) => number;
};

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

export function getAvailableCounts(data: ExportData): Map<DataType, number> {
  const counts = new Map<DataType, number>();
  for (const dt of DATA_TYPES) {
    const count = dt.getCount(data);
    if (count > 0) counts.set(dt.type, count);
  }
  return counts;
}

export function toggleInSet<T>(set: Set<T>, item: T): Set<T> {
  const next = new Set(set);
  if (next.has(item)) next.delete(item);
  else next.add(item);
  return next;
}
