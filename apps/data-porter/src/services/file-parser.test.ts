import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SOURCE_FORMAT } from '../constants';
import { parseImportText } from './file-parser';

const lib = { tracks: [], albums: [], artists: [], shows: [] };

test('rejects non-JSON', () => {
  assert.throws(() => parseImportText('not json', 'f.json'), /not valid JSON/);
});

test('rejects JSON that is not an object', () => {
  assert.throws(() => parseImportText('[1,2]', 'f.json'), /JSON object/);
  assert.throws(() => parseImportText('"str"', 'f.json'), /JSON object/);
});

test('rejects unrecognized shapes', () => {
  assert.throws(() => parseImportText('{"foo":1}', 'f.json'), /not a recognized format/);
});

test('rejects invalid playlists array', () => {
  assert.throws(
    () => parseImportText(JSON.stringify({ playlists: [{ noName: true }] }), 'f.json'),
    /invalid playlists/,
  );
});

test('drops null/garbage entries inside playlist items', () => {
  const parsed = parseImportText(
    JSON.stringify({ playlists: [{ name: 'Mix', items: [null, { track: null }, 'junk'] }] }),
    'f.json',
  );
  assert.deepEqual(parsed.data.playlists?.[0].items, [{ track: null }]);
});

test('parses a Data Porter export wrapper', () => {
  const parsed = parseImportText(
    JSON.stringify({
      playlists: [{ name: 'Mix', items: [] }],
      library: {
        ...lib,
        tracks: [{ name: 'Song', artist: 'Artist', album: 'Album', uri: 'spotify:track:x' }],
      },
    }),
    'f.json',
  );
  assert.equal(parsed.sourceFormat, SOURCE_FORMAT.OUR_EXPORT);
  assert.equal(parsed.data.playlists?.length, 1);
  assert.deepEqual(parsed.data.library?.tracks[0], {
    name: 'Song',
    artist: 'Artist',
    album: 'Album',
    uri: 'spotify:track:x',
  });
});

test('parses Spotify official YourLibrary.json shape with field aliases', () => {
  const parsed = parseImportText(
    JSON.stringify({
      ...lib,
      tracks: [{ artist: 'Artist', album: 'Album', track: 'Song', uri: 'spotify:track:x' }],
      albums: [{ artist: 'Artist', album: 'Album', uri: 'spotify:album:y' }],
    }),
    'YourLibrary.json',
  );
  assert.equal(parsed.sourceFormat, SOURCE_FORMAT.SPOTIFY_OFFICIAL);
  // the official export stores the track title under `track`
  assert.equal(parsed.data.library?.tracks[0].name, 'Song');
  assert.equal(parsed.data.library?.albums[0].album, 'Album');
});

test('normalizes playlist-item style aliases (trackName/trackUri)', () => {
  const parsed = parseImportText(
    JSON.stringify({
      library: {
        ...lib,
        tracks: [{ trackName: 'Song', artistName: 'Artist', albumName: 'Album', trackUri: 'u' }],
      },
    }),
    'f.json',
  );
  assert.deepEqual(parsed.data.library?.tracks[0], {
    name: 'Song',
    artist: 'Artist',
    album: 'Album',
    uri: 'u',
  });
});
