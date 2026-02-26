import { DATA_TYPE } from './constants';
import type { MessageKey } from './i18n';
import type { DataType, ExportData } from './types/export';

type DataTypeConfig = {
  type: DataType;
  labelKey: MessageKey;
  descKey: MessageKey;
  icon: Spicetify.Icon;
  getCount: (data: ExportData) => number;
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
];

export function getAvailableCounts(data: ExportData): Map<DataType, number> {
  const counts = new Map<DataType, number>();
  for (const dt of DATA_TYPES) {
    const count = dt.getCount(data);
    if (count > 0) counts.set(dt.type, count);
  }
  return counts;
}
