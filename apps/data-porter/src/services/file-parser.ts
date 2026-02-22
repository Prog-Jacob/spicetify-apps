import { t } from '../i18n';
import type { ParsedFile } from '../types/import';
import type { ExportData, ExportedPlaylist, ExportedLibrary } from '../types/export';

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

  const obj = raw as Record<string, unknown>;

  // Our export format: { playlists?: [...], library?: { tracks, albums, artists, shows } }
  if ('playlists' in obj || 'library' in obj) {
    const data: ExportData = {};
    if ('playlists' in obj) {
      if (!isPlaylistArray(obj.playlists))
        throw new Error(t('error.invalidPlaylists', { fileName }));
      data.playlists = obj.playlists;
    }
    if ('library' in obj) {
      if (!isLibrary(obj.library)) throw new Error(t('error.invalidLibrary', { fileName }));
      data.library = obj.library;
    }
    return { data, sourceFormat: 'our-export', fileName };
  }

  // Spotify official YourLibrary.json: top-level tracks/albums/artists/shows
  if ('tracks' in obj || 'albums' in obj || 'artists' in obj || 'shows' in obj) {
    const library: ExportedLibrary = {
      tracks: Array.isArray(obj.tracks) ? obj.tracks : [],
      albums: Array.isArray(obj.albums) ? obj.albums : [],
      artists: Array.isArray(obj.artists) ? obj.artists : [],
      shows: Array.isArray(obj.shows) ? obj.shows : [],
    };
    return { data: { library }, sourceFormat: 'spotify-official', fileName };
  }

  throw new Error(t('error.unrecognizedFormat', { fileName }));
}

export async function parseImportFile(file: File): Promise<ParsedFile> {
  checkFileSize(file.size, file.name);
  return parseImportText(await file.text(), file.name);
}
