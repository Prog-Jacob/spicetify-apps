export const PLAYLIST_PERMISSION = { BLOCKED: 'BLOCKED' } as const;

export const PLAYLIST_POSITION = { START: 'start', END: 'end' } as const;

export const platform = {
  get History() {
    return Spicetify.Platform.History;
  },
  get PlaylistAPI() {
    return Spicetify.Platform.PlaylistAPI;
  },
  get LibraryAPI() {
    return Spicetify.Platform.LibraryAPI;
  },
  get RootlistAPI() {
    return Spicetify.Platform.RootlistAPI;
  },
  get ClipboardAPI() {
    return Spicetify.Platform.ClipboardAPI;
  },
  get PlaylistPermissionsAPI() {
    return Spicetify.Platform.PlaylistPermissionsAPI;
  },
};
