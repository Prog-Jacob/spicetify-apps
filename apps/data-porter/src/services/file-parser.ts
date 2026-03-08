import { t } from '../i18n';
import { SOURCE_FORMAT } from '../constants';
import type { ParsedFile } from '../types/import';
import type { ExportData, ExportedLibrary, ExportedPlaylist } from '../types/export';

const MAX_FILE_SIZE = 20; // in MB

export const checkFileSize = (bytes: number, name: string): void => {
  const size = Math.floor(bytes / 1024 / 1024);
  if (size > MAX_FILE_SIZE) throw new Error(t('error.fileTooLargeSize', { name, size }));
};

function isPlaylistArray(v: unknown): v is ExportedPlaylist[] {
  return (
    Array.isArray(v) &&
    v.every((item) => {
      const o = item as Record<string, unknown>;
      return typeof o?.name === 'string' && Array.isArray(o.items);
    })
  );
}

function normalizeLibraryTracks(tracks: unknown[]): ExportedLibrary['tracks'] {
  return (tracks as Record<string, unknown>[]).map((track) => ({
    artist: String(track.artist ?? track.artistName ?? ''),
    album: String(track.album ?? track.albumName ?? ''),
    uri: String(track.uri ?? track.trackUri ?? ''),
  }));
}

function normalizeLibraryAlbums(albums: unknown[]): ExportedLibrary['albums'] {
  return (albums as Record<string, unknown>[]).map((album) => ({
    artist: String(album.artist ?? album.artistName ?? ''),
    album: String(album.album ?? album.albumName ?? album.name ?? ''),
    uri: String(album.uri ?? album.albumUri ?? ''),
  }));
}

function normalizeLibraryEpisodes(episodes: unknown[]): ExportedLibrary['episodes'] {
  return (episodes as Record<string, unknown>[]).map((ep) => ({
    name: String(ep.name ?? ep.episodeName ?? ''),
    uri: String(ep.uri ?? ep.episodeUri ?? ''),
  }));
}

function normalizeLibrary(raw: Record<string, unknown>): ExportedLibrary {
  const arr = <K extends keyof ExportedLibrary>(k: K): ExportedLibrary[K] =>
    (Array.isArray(raw[k]) ? raw[k] : []) as ExportedLibrary[K];

  return {
    tracks: normalizeLibraryTracks(arr('tracks')),
    albums: normalizeLibraryAlbums(arr('albums')),
    shows: arr('shows'),
    episodes: normalizeLibraryEpisodes(arr('episodes')),
    bannedTracks: arr('bannedTracks'),
    artists: arr('artists'),
    bannedArtists: arr('bannedArtists'),
    other: arr('other'),
  };
}

function isLibrary(v: unknown): v is ExportedLibrary {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    Array.isArray(o.tracks) &&
    Array.isArray(o.albums) &&
    Array.isArray(o.artists) &&
    Array.isArray(o.shows)
  );
}

export function parseImportText(text: string, fileName: string): ParsedFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(t('error.notValidJson', { fileName }));
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(t('error.notJsonObject', { fileName }));
  }

  const data: ExportData = {};
  const obj = raw as Record<string, unknown>;
  const hasWrapper = 'playlists' in obj || 'library' in obj;
  const hasTopLevel = 'tracks' in obj || 'albums' in obj || 'artists' in obj || 'shows' in obj;

  if (!hasWrapper && !hasTopLevel) throw new Error(t('error.unrecognizedFormat', { fileName }));

  if ('playlists' in obj) {
    if (!isPlaylistArray(obj.playlists)) throw new Error(t('error.invalidPlaylists', { fileName }));
    data.playlists = obj.playlists;
  }

  const libSource = 'library' in obj ? obj.library : hasTopLevel ? obj : null;
  if (libSource) {
    if (!isLibrary(libSource)) throw new Error(t('error.invalidLibrary', { fileName }));
    data.library = normalizeLibrary(libSource as Record<string, unknown>);
  }

  return {
    data,
    sourceFormat: hasWrapper ? SOURCE_FORMAT.OUR_EXPORT : SOURCE_FORMAT.SPOTIFY_OFFICIAL,
    fileName,
  };
}

export async function parseImportFile(file: File): Promise<ParsedFile> {
  checkFileSize(file.size, file.name);
  return parseImportText(await file.text(), file.name);
}
