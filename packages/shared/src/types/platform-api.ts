import type {
  LibraryPage,
  RootlistItem,
  PlaylistDetail,
  CollectionItem,
  RecentsContents,
  LibraryTrackItem,
  LibraryContentItem,
  SpotifyUserProfile,
} from './platform';

export interface PlatformLibraryAPI {
  getTracks(params: { limit: number; offset: number }): Promise<LibraryPage<LibraryTrackItem>>;
  getContents(params: { limit: number; offset: number }): Promise<LibraryPage<LibraryContentItem>>;
  add(opts: { uris: string[] }): Promise<void>;
}

export interface PlatformPlaylistAPI {
  getPlaylist(uri: string): Promise<PlaylistDetail>;
  add(uri: string, uris: string[], opts?: { after?: 'start' | 'end' }): Promise<void>;
  updateDetails(uri: string, details: { name?: string; description?: string }): Promise<void>;
}

export interface PlatformRootlistAPI {
  getContents(): Promise<{ items: RootlistItem[] }>;
  createPlaylist(
    name: string,
    opts?: { before?: 'start' | 'end' },
  ): Promise<string | { uri?: string }>;
}

export interface PlatformRecentsAPI {
  getContents(): Promise<RecentsContents>;
}

export interface PlatformCollectionAPI {
  get(set: string): Promise<CollectionItem[]>;
  add(set: string, uris: string[]): Promise<void>;
}

export interface PlatformUserAPI {
  getUser(): Promise<SpotifyUserProfile>;
}

export interface PlatformPlaylistPermissionsAPI {
  setBasePermission(uri: string, permission: 'BLOCKED'): Promise<void>;
}

export interface PlatformClipboardAPI {
  copy(text: string): Promise<void>;
}

export interface PlatformHistory {
  push(path: string): void;
  listen(cb: (location: { pathname: string }) => void): (() => void) | undefined;
  location: { pathname: string };
}

export interface PlatformInitialProductState {
  country?: string;
  product?: string;
  [key: string]: string | undefined;
}
