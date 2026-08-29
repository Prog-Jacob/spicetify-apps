import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArtistOverview, parseAlbumTracks } from './graphql-enrichment';

test('parseArtistOverview reads related artists and flattens nested discography releases', () => {
  const enrichment = parseArtistOverview({
    data: {
      artistUnion: {
        relatedContent: {
          relatedArtists: {
            items: [
              { uri: 'spotify:artist:r1', profile: { name: 'Related One' } },
              { profile: { name: 'no uri' } }, // dropped
            ],
          },
        },
        discography: {
          albums: {
            items: [
              { releases: { items: [{ uri: 'spotify:album:a1', name: 'Album One' }] } },
              { releases: { items: [{ uri: 'spotify:album:a2', name: 'Album Two' }] } },
            ],
          },
        },
      },
    },
  });
  assert.deepEqual(
    enrichment.related.map((r) => r.uri),
    ['spotify:artist:r1'],
  );
  assert.deepEqual(
    enrichment.albums.map((a) => a.uri),
    ['spotify:album:a1', 'spotify:album:a2'],
  );
});

test('parseAlbumTracks reads per-track artists from the tracksV2 shape', () => {
  const { tracks } = parseAlbumTracks({
    data: {
      albumUnion: {
        tracksV2: {
          items: [
            {
              track: {
                uri: 'spotify:track:t1',
                name: 'Song',
                artists: { items: [{ uri: 'spotify:artist:a1', profile: { name: 'Artist' } }] },
              },
            },
            { track: { name: 'no uri' } }, // dropped
          ],
        },
      },
    },
  });
  assert.equal(tracks[0].uri, 'spotify:track:t1');
  assert.deepEqual(
    tracks[0].artists.map((a) => a.uri),
    ['spotify:artist:a1'],
  );
});

test('an unexpected payload yields empty lists rather than throwing', () => {
  assert.deepEqual(parseArtistOverview({}), { related: [], albums: [] });
  assert.deepEqual(parseArtistOverview({ data: { artistUnion: {} } }), { related: [], albums: [] });
  assert.deepEqual(parseAlbumTracks({}), { tracks: [] });
});
