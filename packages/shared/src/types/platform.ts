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

export type PlaylistDetail = {
  error?: unknown;
  metadata?: {
    lastModified?: number;
    description?: string;
    totalFollowers?: number;
  };
  contents?: { items?: PlaylistItemDetail[] };
};

export type RootlistItem = {
  type: 'playlist' | 'folder' | (string & {});
  name: string;
  uri: string;
  items?: RootlistItem[];
};

export type RecentsContentsItem = {
  uri: string;
  name: string;
  type: string;
  addedAt?: { timestamp: number };
  playedAt?: number;
  contributors?: { uri?: string; name?: string }[];
  parent?: { uri?: string; name?: string };
};

export type RecentsContents = {
  items: RecentsContentsItem[] | { items: RecentsContentsItem[] };
};

export type CollectionItem = { uri: string; name?: string };

export type SpotifyUserProfile = {
  uri?: string;
  username?: string;
  displayName?: string;
  name?: string;
  imageUrl?: string;
};

export type ProgressInfo = {
  current: number;
  total: number;
  label: string;
};
