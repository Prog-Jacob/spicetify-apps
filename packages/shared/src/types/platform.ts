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
