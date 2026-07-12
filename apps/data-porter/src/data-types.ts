import { t } from './i18n';
import { DATA_TYPE } from './constants';
import type { MessageKey } from './i18n';
import type { DataType, ExportData } from './types/export';

export type PreviewItem = {
  primary: string;
  secondary?: string;
  badge?: string;
  uri?: string;
  imageUrl?: string;
  // nested items the preview can drill into (e.g. a playlist's tracks)
  children?: PreviewItem[];
};

export type DataTypeConfig = {
  type: DataType;
  labelKey: MessageKey;
  descKey: MessageKey;
  icon: Spicetify.Icon;
  getCount: (data: ExportData) => number;
  getPreviewItems: (data: ExportData) => PreviewItem[];
  exportOnly?: boolean;
};

// search-history entries carry a lowercased GraphQL __typename
const SEARCH_BADGE_KEYS: Partial<Record<string, MessageKey>> = {
  artist: 'preview.badgeArtist',
  track: 'preview.badgeTrack',
  album: 'preview.badgeAlbum',
  playlist: 'preview.badgePlaylist',
  show: 'preview.badgeShow',
  podcast: 'preview.badgeShow',
  episode: 'preview.badgeEpisode',
  user: 'preview.badgeUser',
};

// keyed record so the compiler enforces an entry for every DataType;
// key order is the display order
export const DATA_TYPE_CONFIGS: Record<DataType, Omit<DataTypeConfig, 'type'>> = {
  [DATA_TYPE.PLAYLISTS]: {
    labelKey: 'dataType.playlists',
    descKey: 'dataType.playlists.desc',
    icon: 'playlist',
    getCount: (d) => d.playlists?.length ?? 0,
    getPreviewItems: (d) =>
      (d.playlists ?? []).map((p) => ({
        primary: p.name,
        secondary: t('dataType.itemCount', { count: p.items.length }),
        uri: p.uri,
        children: p.items.flatMap(({ track, episode, localTrack }) => {
          const tr = track ?? localTrack;
          if (tr)
            return [
              {
                primary: tr.trackName,
                secondary: [tr.artistName, tr.albumName].filter(Boolean).join(' · '),
                uri: tr.trackUri,
              },
            ];
          if (episode)
            return [
              {
                primary: episode.episodeName,
                secondary: episode.showName,
                uri: episode.episodeUri,
              },
            ];
          return [];
        }),
      })),
  },
  [DATA_TYPE.LIKED_SONGS]: {
    labelKey: 'dataType.likedSongs',
    descKey: 'dataType.likedSongs.desc',
    icon: 'heart',
    getCount: (d) => d.library?.tracks.length ?? 0,
    getPreviewItems: (d) =>
      (d.library?.tracks ?? []).map((tr) => ({
        // older exports have no track name; show artist as the title then
        primary: tr.name || tr.artist,
        secondary: tr.name ? [tr.artist, tr.album].filter(Boolean).join(' · ') : tr.album,
        uri: tr.uri,
      })),
  },
  [DATA_TYPE.ALBUMS]: {
    labelKey: 'dataType.albums',
    descKey: 'dataType.albums.desc',
    icon: 'album',
    getCount: (d) => d.library?.albums.length ?? 0,
    getPreviewItems: (d) =>
      (d.library?.albums ?? []).map((a) => ({ primary: a.album, secondary: a.artist, uri: a.uri })),
  },
  [DATA_TYPE.ARTISTS]: {
    labelKey: 'dataType.artists',
    descKey: 'dataType.artists.desc',
    icon: 'artist',
    getCount: (d) => d.library?.artists.length ?? 0,
    getPreviewItems: (d) =>
      (d.library?.artists ?? []).map((a) => ({ primary: a.name, uri: a.uri })),
  },
  [DATA_TYPE.SHOWS]: {
    labelKey: 'dataType.shows',
    descKey: 'dataType.shows.desc',
    icon: 'podcasts',
    getCount: (d) => d.library?.shows.length ?? 0,
    getPreviewItems: (d) =>
      (d.library?.shows ?? []).map((s) => ({
        primary: s.name,
        secondary: s.publisher,
        uri: s.uri,
      })),
  },
  [DATA_TYPE.EPISODES]: {
    labelKey: 'dataType.episodes',
    descKey: 'dataType.episodes.desc',
    icon: 'podcasts',
    getCount: (d) => d.library?.episodes?.length ?? 0,
    getPreviewItems: (d) =>
      (d.library?.episodes ?? []).map((e) => ({ primary: e.name, uri: e.uri })),
  },
  [DATA_TYPE.BANNED_CONTENT]: {
    labelKey: 'dataType.bannedContent',
    descKey: 'dataType.bannedContent.desc',
    icon: 'block',
    getCount: (d) =>
      (d.library?.bannedTracks?.length ?? 0) +
      (d.library?.bannedArtists?.length ?? 0) +
      (d.library?.excludedFromTaste?.length ?? 0),
    getPreviewItems: (d) =>
      (
        [
          [d.library?.bannedArtists, 'preview.badgeArtist'],
          [d.library?.bannedTracks, 'preview.badgeTrack'],
          [d.library?.excludedFromTaste, 'preview.badgeTaste'],
        ] as const
      ).flatMap(([items, key]) =>
        (items ?? []).map((b) => ({ primary: b.name ?? b.uri, badge: t(key), uri: b.uri })),
      ),
  },
  [DATA_TYPE.SEARCH_HISTORY]: {
    labelKey: 'dataType.searchHistory',
    descKey: 'dataType.searchHistory.desc',
    icon: 'search',
    getCount: (d) => d.searchHistory?.length ?? 0,
    getPreviewItems: (d) =>
      (d.searchHistory ?? []).map((s) => {
        const badgeKey = SEARCH_BADGE_KEYS[s.type];
        return {
          // older exports have empty names for artists; fall back to the URI
          primary: s.name || s.uri,
          badge: badgeKey ? t(badgeKey) : s.type,
          uri: s.uri,
        };
      }),
    exportOnly: true,
  },
  [DATA_TYPE.PROFILE]: {
    labelKey: 'dataType.profile',
    descKey: 'dataType.profile.desc',
    icon: 'artist',
    getCount: (d) => (d.profile ? 1 : 0),
    getPreviewItems: (d) =>
      d.profile
        ? [
            {
              primary: d.profile.displayName,
              secondary: `@${d.profile.username}`,
              imageUrl: d.profile.imageUrl,
            },
            ...(d.profile.country
              ? [{ primary: d.profile.country, badge: t('preview.badgeCountry') }]
              : []),
            ...(d.profile.product
              ? [{ primary: d.profile.product, badge: t('preview.badgeTier') }]
              : []),
          ]
        : [],
    exportOnly: true,
  },
  [DATA_TYPE.RECENTLY_PLAYED]: {
    labelKey: 'dataType.recentlyPlayed',
    descKey: 'dataType.recentlyPlayed.desc',
    icon: 'queue',
    getCount: (d) =>
      (d.recentlyPlayed?.music.length ?? 0) + (d.recentlyPlayed?.podcasts.length ?? 0),
    getPreviewItems: (d) => [
      ...(d.recentlyPlayed?.music ?? []).map((m) => ({
        primary: m.trackName,
        secondary: m.artistName,
        uri: m.uri,
      })),
      ...(d.recentlyPlayed?.podcasts ?? []).map((p) => ({
        primary: p.episodeName,
        secondary: p.podcastName,
        uri: p.uri,
      })),
    ],
    exportOnly: true,
  },
};

export const ALL_DATA_TYPES: DataTypeConfig[] = (Object.keys(DATA_TYPE_CONFIGS) as DataType[]).map(
  (type) => ({ type, ...DATA_TYPE_CONFIGS[type] }),
);

export const IMPORTABLE_DATA_TYPES = ALL_DATA_TYPES.filter((dt) => !dt.exportOnly);

export function getAvailableCounts(data: ExportData): Map<DataType, number> {
  const counts = new Map<DataType, number>();
  for (const dt of IMPORTABLE_DATA_TYPES) {
    const count = dt.getCount(data);
    if (count > 0) counts.set(dt.type, count);
  }
  return counts;
}
