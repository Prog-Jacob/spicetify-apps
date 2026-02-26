import type { DATA_TYPE } from '../constants';

type LocalTrackFields = { trackName: string; artistName: string; albumName: string };
type EpisodeFields = { episodeName: string; showName: string };
type TrackFields = LocalTrackFields & { trackUri: string };

export type PlaylistItemDetail = {
  uri: string;
  name: string;
  artists?: { name: string }[];
  album?: { name: string };
  show?: { name: string };
  addedAt?: number;
};

export type ExportedPlaylistItem = {
  track?: TrackFields;
  episode?: EpisodeFields;
  localTrack?: LocalTrackFields;
  addedDate: string;
};

export type ExportedPlaylist = {
  name: string;
  lastModifiedDate: string;
  items: ExportedPlaylistItem[];
  description: string | null;
  numberOfFollowers: number;
};

export type ExportedLibrary = {
  tracks: TrackFields[];
  albums: { artist: string; album: string; uri: string }[];
  artists: { name: string; uri: string }[];
  shows: { name: string; publisher: string; uri: string }[];
};

export type ExportData = {
  playlists?: ExportedPlaylist[];
  library?: ExportedLibrary;
};

export type ExportResult = {
  data: ExportData;
  warnings: string[];
  userName?: string;
};

export type DataType = (typeof DATA_TYPE)[keyof typeof DATA_TYPE];
