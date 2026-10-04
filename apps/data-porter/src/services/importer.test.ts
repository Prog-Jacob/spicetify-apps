import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importData } from './importer';
import type { ExportData } from '../types/export';
import { DATA_TYPE, CONFLICT_RESOLUTION } from '../constants';

const track = (n: number) => ({ name: `t${n}`, artist: '', album: '', uri: `spotify:track:${n}` });

test('a cancel mid-playlist still makes the created playlist private and keeps the log', async () => {
  const controller = new AbortController();
  const libraryAdds: string[][] = [];
  const privated: string[] = [];
  Object.assign(globalThis, {
    Spicetify: {
      Platform: {
        LibraryAPI: { add: async ({ uris }: { uris: string[] }) => void libraryAdds.push(uris) },
        RootlistAPI: { createPlaylist: async () => 'spotify:playlist:new' },
        PlaylistAPI: { add: async () => controller.abort() }, // the user cancels after batch 1
        PlaylistPermissionsAPI: {
          setBasePermission: async (uri: string) => void privated.push(uri),
        },
      },
      showNotification: () => {},
    },
  });

  const data = {
    library: { tracks: [track(2), track(1)] },
    playlists: [
      {
        name: 'p',
        lastModifiedDate: '',
        description: null,
        numberOfFollowers: 0,
        items: Array.from({ length: 60 }, (_, i) => ({
          track: { trackName: '', artistName: '', albumName: '', trackUri: `spotify:track:p${i}` },
          episode: null,
          localTrack: null,
          addedDate: '',
        })),
      },
    ],
  } as unknown as ExportData;

  const result = await importData(
    data,
    new Set([DATA_TYPE.LIKED_SONGS, DATA_TYPE.PLAYLISTS]),
    new Map(),
    new Map(),
    () => {},
    controller.signal,
    true,
  );

  assert.equal(result.cancelled, true);
  assert.deepEqual(privated, ['spotify:playlist:new']);
  assert.deepEqual(libraryAdds, [['spotify:track:1', 'spotify:track:2']], 'oldest first');
  assert.ok(
    result.log.some((e) => e.label.includes('"p"') && e.label.includes('50')),
    'the half-filled playlist is logged with what landed',
  );
  assert.equal(result.warnings.length, 1, 'the cancel is explained');
});

const playlist = (description: string | null) => ({
  name: 'p',
  lastModifiedDate: '',
  description,
  numberOfFollowers: 0,
  items: [
    {
      track: { trackName: '', artistName: '', albumName: '', trackUri: 'spotify:track:a' },
      episode: null,
      localTrack: null,
      addedDate: '',
    },
  ],
});

test('a playlist whose writes all fail is logged as an error only', async () => {
  Object.assign(globalThis, {
    Spicetify: {
      Platform: {
        RootlistAPI: { createPlaylist: async () => 'spotify:playlist:new' },
        PlaylistAPI: {
          add: async () => {
            throw new Error('nope');
          },
        },
        PlaylistPermissionsAPI: { setBasePermission: async () => {} },
      },
      showNotification: () => {},
    },
  });

  const result = await importData(
    { playlists: [playlist(null)] } as ExportData,
    new Set([DATA_TYPE.PLAYLISTS]),
    new Map(),
    new Map(),
    () => {},
    new AbortController().signal,
  );

  assert.deepEqual(
    result.log.map((e) => e.status),
    ['error'],
  );
});

test('merging leaves the existing playlist description alone', async () => {
  const described: string[] = [];
  Object.assign(globalThis, {
    Spicetify: {
      Platform: {
        PlaylistAPI: {
          add: async () => {},
          getPlaylist: async () => ({ contents: { items: [] } }),
          updateDetails: async (uri: string) => void described.push(uri),
        },
      },
      showNotification: () => {},
    },
  });

  const result = await importData(
    { playlists: [playlist('mine')] } as ExportData,
    new Set([DATA_TYPE.PLAYLISTS]),
    new Map([[0, CONFLICT_RESOLUTION.MERGE]]),
    new Map([['p', 'spotify:playlist:old']]),
    () => {},
    new AbortController().signal,
  );

  assert.deepEqual(described, []);
  assert.deepEqual(
    result.log.map((e) => e.status),
    ['ok'],
  );
});
