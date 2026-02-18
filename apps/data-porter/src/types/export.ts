export type LibraryTrackItem = {
  type: 'track';
  uri: string;
  name: string;
  album: { uri: string; name: string };
  artists: { uri: string; name: string }[];
};

export type LibraryContentItem = {
  type: 'playlist' | 'album' | 'artist' | 'show' | (string & {});
  uri: string;
  name: string;
  artists?: { uri: string; name: string }[];
  publisher?: string;
};

export type LibraryPage<T> = {
  items: T[];
  offset: number;
  limit: number;
  totalLength: number;
};

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

export type ExportProgress = {
  current: number;
  total: number;
  label: string;
};
