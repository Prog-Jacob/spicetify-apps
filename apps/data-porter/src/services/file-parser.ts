import type { ExportData, ExportedPlaylist, ExportedLibrary } from '../types/export';
import type { ParsedFile } from '../types/import';

function isPlaylistArray(v: unknown): v is ExportedPlaylist[] {
  return (
    Array.isArray(v) &&
    v.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).name === 'string' &&
        Array.isArray((item as Record<string, unknown>).items),
    )
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

export async function parseImportFile(file: File): Promise<ParsedFile> {
  const text = await file.text();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(`"${file.name}" is not valid JSON`);
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`"${file.name}" must be a JSON object`);
  }

  const obj = raw as Record<string, unknown>;

  // Our export format: { playlists?: [...], library?: { tracks, albums, artists, shows } }
  if ('playlists' in obj || 'library' in obj) {
    const data: ExportData = {};
    if ('playlists' in obj) {
      if (!isPlaylistArray(obj.playlists))
        throw new Error(`"${file.name}": invalid playlists array`);
      data.playlists = obj.playlists;
    }
    if ('library' in obj) {
      if (!isLibrary(obj.library)) throw new Error(`"${file.name}": invalid library object`);
      data.library = obj.library;
    }
    return { data, sourceFormat: 'our-export', fileName: file.name };
  }

  // Spotify official YourLibrary.json: top-level tracks/albums/artists/shows
  if ('tracks' in obj || 'albums' in obj || 'artists' in obj || 'shows' in obj) {
    const library: ExportedLibrary = {
      tracks: Array.isArray(obj.tracks) ? obj.tracks : [],
      albums: Array.isArray(obj.albums) ? obj.albums : [],
      artists: Array.isArray(obj.artists) ? obj.artists : [],
      shows: Array.isArray(obj.shows) ? obj.shows : [],
    };
    return { data: { library }, sourceFormat: 'spotify-official', fileName: file.name };
  }

  throw new Error(
    `"${file.name}" is not a recognized format. Expected a Data Porter export or Spotify YourLibrary.json / Playlist1.json.`,
  );
}
