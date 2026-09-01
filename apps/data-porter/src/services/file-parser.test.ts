import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SOURCE_FORMAT } from '../constants';
import { parseImportText } from './file-parser';

const lib = { tracks: [], albums: [], artists: [], shows: [] };

test('rejects malformed, unrecognized, and invalid shapes', () => {
  const cases: [string, RegExp][] = [
    ['not json', /not valid JSON/],
    ['[1,2]', /JSON object/],
    ['"str"', /JSON object/],
    ['{"foo":1}', /not a recognized format/],
    [JSON.stringify({ playlists: [{ noName: true }] }), /invalid playlists/],
    [JSON.stringify({ tracks: [], albums: [], artists: [] }), /invalid library/], // no `shows`
  ];
  for (const [text, re] of cases) assert.throws(() => parseImportText(text, 'f.json'), re);
});

test('drops null/garbage entries inside playlist items', () => {
  const parsed = parseImportText(
    JSON.stringify({ playlists: [{ name: 'Mix', items: [null, { track: null }, 'junk'] }] }),
    'f.json',
  );
  assert.deepEqual(parsed.data.playlists?.[0].items, [{ track: null }]);
});

test('normalizes library field aliases and tags the source format', () => {
  const cases: {
    json: Record<string, unknown>;
    fileName: string;
    format: string;
    track: Record<string, string>;
    album?: Record<string, string>;
  }[] = [
    {
      json: {
        playlists: [{ name: 'Mix', items: [] }],
        library: {
          ...lib,
          tracks: [{ name: 'Song', artist: 'Artist', album: 'Album', uri: 'spotify:track:x' }],
        },
      },
      fileName: 'f.json',
      format: SOURCE_FORMAT.OUR_EXPORT,
      track: { name: 'Song', artist: 'Artist', album: 'Album', uri: 'spotify:track:x' },
    },
    {
      // Spotify's official export stores the title under `track` and aliases album under `name`.
      json: {
        ...lib,
        tracks: [{ artist: 'Artist', album: 'Album', track: 'Song', uri: 'spotify:track:x' }],
        albums: [{ artist: 'Artist', name: 'Album', uri: 'spotify:album:y' }],
      },
      fileName: 'YourLibrary.json',
      format: SOURCE_FORMAT.SPOTIFY_OFFICIAL,
      track: { name: 'Song', artist: 'Artist', album: 'Album', uri: 'spotify:track:x' },
      album: { artist: 'Artist', album: 'Album', uri: 'spotify:album:y' },
    },
    {
      json: {
        library: {
          ...lib,
          tracks: [{ trackName: 'Song', artistName: 'Artist', albumName: 'Album', trackUri: 'u' }],
        },
      },
      fileName: 'f.json',
      format: SOURCE_FORMAT.OUR_EXPORT,
      track: { name: 'Song', artist: 'Artist', album: 'Album', uri: 'u' },
    },
  ];

  for (const { json, fileName, format, track, album } of cases) {
    const parsed = parseImportText(JSON.stringify(json), fileName);
    assert.equal(parsed.sourceFormat, format, fileName);
    assert.deepEqual(parsed.data.library?.tracks[0], track);
    if (album) assert.deepEqual(parsed.data.library?.albums[0], album);
  }
});
