import { DATA_TYPE } from './constants';
import type { MessageKey } from './i18n';
import type { DataType, ExportData } from './types/export';

export type DataTypeConfig = {
  type: DataType;
  labelKey: MessageKey;
  descKey: MessageKey;
  icon: Spicetify.Icon;
  getCount: (data: ExportData) => number;
  exportOnly?: boolean;
};

export const DATA_TYPES: DataTypeConfig[] = [
  {
    type: DATA_TYPE.PLAYLISTS,
    labelKey: 'dataType.playlists',
    descKey: 'dataType.playlists.desc',
    icon: 'playlist',
    getCount: (d) => d.playlists?.length ?? 0,
  },
  {
    type: DATA_TYPE.LIKED_SONGS,
    labelKey: 'dataType.likedSongs',
    descKey: 'dataType.likedSongs.desc',
    icon: 'heart',
    getCount: (d) => d.library?.tracks.length ?? 0,
  },
  {
    type: DATA_TYPE.ALBUMS,
    labelKey: 'dataType.albums',
    descKey: 'dataType.albums.desc',
    icon: 'album',
    getCount: (d) => d.library?.albums.length ?? 0,
  },
  {
    type: DATA_TYPE.ARTISTS,
    labelKey: 'dataType.artists',
    descKey: 'dataType.artists.desc',
    icon: 'artist',
    getCount: (d) => d.library?.artists.length ?? 0,
  },
  {
    type: DATA_TYPE.SHOWS,
    labelKey: 'dataType.shows',
    descKey: 'dataType.shows.desc',
    icon: 'podcasts',
    getCount: (d) => d.library?.shows.length ?? 0,
  },
  {
    type: DATA_TYPE.EPISODES,
    labelKey: 'dataType.episodes',
    descKey: 'dataType.episodes.desc',
    icon: 'podcasts',
    getCount: (d) => d.library?.episodes?.length ?? 0,
  },
  {
    type: DATA_TYPE.BANNED_CONTENT,
    labelKey: 'dataType.bannedContent',
    descKey: 'dataType.bannedContent.desc',
    icon: 'block',
    getCount: (d) =>
      (d.library?.bannedTracks?.length ?? 0) + (d.library?.bannedArtists?.length ?? 0),
  },
];

export const EXPORT_DATA_TYPES: DataTypeConfig[] = [
  ...DATA_TYPES,
  {
    type: DATA_TYPE.PROFILE,
    labelKey: 'dataType.profile',
    descKey: 'dataType.profile.desc',
    icon: 'artist',
    getCount: (d) => (d.profile ? 1 : 0),
    exportOnly: true,
  },
  {
    type: DATA_TYPE.RECENTLY_PLAYED,
    labelKey: 'dataType.recentlyPlayed',
    descKey: 'dataType.recentlyPlayed.desc',
    icon: 'queue',
    getCount: (d) =>
      (d.recentlyPlayed?.music.length ?? 0) + (d.recentlyPlayed?.podcasts.length ?? 0),
    exportOnly: true,
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
