import type { DATA_TYPE } from '../constants';

type BannedItem = { uri: string; name?: string };
type EpisodeFields = { episodeName: string; showName: string; episodeUri?: string };
type TrackFields = { artist: string; album: string; uri: string };
type PlaylistTrackFields = {
  trackName: string;
  artistName: string;
  albumName: string;
  trackUri: string;
};

export type ExportedPlaylistItem = {
  track: PlaylistTrackFields | null;
  episode: EpisodeFields | null;
  localTrack: PlaylistTrackFields | null;
  addedDate: string;
};

export type ExportedPlaylist = {
  name: string;
  lastModifiedDate: string;
  items: ExportedPlaylistItem[];
  description: string | null;
  numberOfFollowers: number;
};

export type NamedUri = { name: string; uri: string };

export type ExportedLibrary = {
  tracks: TrackFields[];
  albums: TrackFields[];
  shows: (NamedUri & { publisher: string })[];
  episodes: NamedUri[];
  bannedTracks: BannedItem[];
  artists: NamedUri[];
  bannedArtists: BannedItem[];
  excludedFromTaste: BannedItem[];
};

export type ExportedRecentTrack = {
  endTime: string;
  artistName: string;
  trackName: string;
  uri: string;
  albumName: string;
};

export type ExportedRecentPodcast = {
  endTime: string;
  podcastName: string;
  episodeName: string;
  uri: string;
};

export type ExportedUserProfile = {
  displayName: string;
  username: string;
  uri: string;
  imageUrl?: string;
  followingCount?: number;
  country?: string;
  product?: string;
};

export type SearchHistoryItem = {
  type: string;
  name: string;
  uri: string;
};

export type ExportData = {
  playlists?: ExportedPlaylist[];
  library?: ExportedLibrary;
  recentlyPlayed?: { music: ExportedRecentTrack[]; podcasts: ExportedRecentPodcast[] };
  profile?: ExportedUserProfile;
  searchHistory?: SearchHistoryItem[];
};

export type ExportResult = {
  data: ExportData;
  warnings: string[];
  userName?: string;
};

export type DataType = (typeof DATA_TYPE)[keyof typeof DATA_TYPE];
