export type { LibraryTrackItem, LibraryContentItem, LibraryPage } from '@shared/types/platform';

export type PlaylistItemDetail = {
  uri: string;
  name: string;
  artists?: { name: string }[];
  album?: { name: string };
  show?: { name: string };
  addedAt?: number;
};

type LocalTrackFields = { trackName: string; artistName: string; albumName: string };
type EpisodeFields = { episodeName: string; showName: string };
type TrackFields = LocalTrackFields & { trackUri: string };

export type ExportedPlaylistItem = {
  track: TrackFields | null;
  episode: EpisodeFields | null;
  localTrack: LocalTrackFields | null;
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

export type DataType = 'playlists' | 'likedSongs' | 'albums' | 'artists' | 'shows';

export type DataTypeConfig = {
  type: DataType;
  label: string;
  description: string;
  icon: Spicetify.Icon;
  getCount: (data: ExportData) => number;
};

export type ProgressInfo = {
  current: number;
  total: number;
  label: string;
};
