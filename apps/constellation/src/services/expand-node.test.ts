import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reexpand } from './expand-node';
import { MusicGraph } from '../graph/music-graph';

test('replay reaches a node that only an earlier expansion in the same batch brings back', async () => {
  const release = { uri: 'spotify:album:y', name: 'Y' };
  const track = { uri: 'spotify:track:t', name: 'T', artists: { items: [] } };
  Object.assign(globalThis, {
    Spicetify: {
      GraphQL: {
        Definitions: { queryArtistOverview: 'artist', getAlbum: 'album' },
        Request: async (query: string) =>
          query === 'artist'
            ? {
                data: {
                  artistUnion: {
                    discography: { albums: { items: [{ releases: { items: [release] } }] } },
                  },
                },
              }
            : { data: { albumUnion: { tracksV2: { items: [{ track }] } } } },
      },
    },
  });

  const graph = new MusicGraph();
  graph.addNode({ uri: 'spotify:artist:x', type: 'artist', label: 'X' });
  const expanded = new Set<string>();
  await reexpand(graph, ['spotify:artist:x', 'spotify:album:y', 'spotify:album:gone'], expanded);

  assert.deepEqual([...expanded], ['spotify:artist:x', 'spotify:album:y']);
  assert.ok(graph.node('spotify:track:t'), "the album's own expansion ran");
});

test('replay picks up an expansion that lands on the source while it runs', async () => {
  let landLate: () => void = () => {};
  const inFlight = new Promise<void>((resolve) => (landLate = resolve));
  Object.assign(globalThis, {
    Spicetify: {
      GraphQL: {
        Definitions: { queryArtistOverview: 'artist' },
        Request: async () => ({}),
      },
    },
  });

  const graph = new MusicGraph();
  graph.addNode({ uri: 'spotify:artist:a', type: 'artist', label: 'A' });
  graph.addNode({ uri: 'spotify:artist:b', type: 'artist', label: 'B' });
  const source = new Set(['spotify:artist:a']);
  const expanded = new Set<string>();
  let settles = 0;
  await reexpand(graph, source, expanded, undefined, async () => {
    if (settles++ !== 1) return;
    setTimeout(() => {
      source.add('spotify:artist:b');
      landLate();
    });
    await inFlight;
  });

  assert.deepEqual([...expanded], ['spotify:artist:a', 'spotify:artist:b']);
});
