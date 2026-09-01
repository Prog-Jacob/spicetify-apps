import { t } from '../i18n';
import { SOURCE_FORMAT } from '../constants';
import type { ParsedFile } from '../types/import';
import type { ExportData, ExportedLibrary, ExportedPlaylist } from '../types/export';

const MAX_FILE_SIZE = 20; // in MB

export const checkFileSize = (bytes: number, name: string): void => {
  const size = Math.ceil(bytes / 1024 / 1024);
  if (size > MAX_FILE_SIZE)
    throw new Error(t('error.fileTooLargeSize', { name, size, max: MAX_FILE_SIZE }));
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

// First present field among the Spotify-official / our-export aliases, as a string
const field = (o: Record<string, unknown>, ...keys: string[]): string =>
  String(keys.map((k) => o[k]).find((v) => v != null) ?? '');

function normalizeLibrary(raw: ExportedLibrary | Record<string, unknown>): ExportedLibrary {
  const arr = <K extends keyof ExportedLibrary>(k: K): ExportedLibrary[K] =>
    (Array.isArray(raw[k]) ? raw[k] : []) as ExportedLibrary[K];

  return {
    tracks: arr('tracks')
      .filter((o) => o != null)
      .map((o) => ({
        name: field(o, 'name', 'trackName', 'track'),
        artist: field(o, 'artist', 'artistName'),
        album: field(o, 'album', 'albumName'),
        uri: field(o, 'uri', 'trackUri'),
      })),
    albums: arr('albums')
      .filter((o) => o != null)
      .map((o) => ({
        artist: field(o, 'artist', 'artistName'),
        album: field(o, 'album', 'albumName', 'name'),
        uri: field(o, 'uri', 'albumUri'),
      })),
    shows: arr('shows'),
    episodes: arr('episodes')
      .filter((o) => o != null)
      .map((o) => ({
        name: field(o, 'name', 'episodeName'),
        uri: field(o, 'uri', 'episodeUri'),
      })),
    bannedTracks: arr('bannedTracks'),
    artists: arr('artists'),
    bannedArtists: arr('bannedArtists'),
    excludedFromTaste: arr('excludedFromTaste'),
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
    // hand-edited files can hold null entries inside items
    data.playlists = obj.playlists.map((p) => ({
      ...p,
      items: p.items.filter((item) => typeof item === 'object' && item !== null),
    }));
  }

  const libSource = 'library' in obj ? obj.library : hasTopLevel ? obj : null;
  if (libSource) {
    if (!isLibrary(libSource)) throw new Error(t('error.invalidLibrary', { fileName }));
    data.library = normalizeLibrary(libSource);
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
