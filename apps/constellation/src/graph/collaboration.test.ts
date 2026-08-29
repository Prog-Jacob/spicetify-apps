import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MusicGraph } from './music-graph';
import { deriveCollaborations } from './collaboration';
import { detectCommunities } from './community-detection';

test('co-credited artists are linked once; a solo track links nobody', () => {
  const g = new MusicGraph();
  g.addNode({ uri: 't', type: 'track', label: 'Duet' });
  g.addNode({ uri: 'solo', type: 'track', label: 'Solo' });
  ['a1', 'a2'].forEach((u) => g.addNode({ uri: u, type: 'artist', label: u }));
  g.addEdge('t', 'a1', 'performed_by');
  g.addEdge('t', 'a2', 'performed_by');
  g.addEdge('solo', 'a1', 'performed_by');

  const collab = deriveCollaborations(g);
  assert.equal(collab.length, 1);
  assert.deepEqual([collab[0].source, collab[0].target].sort(), ['a1', 'a2']);
  assert.equal(collab[0].type, 'collaborated');
});

test('community detection separates disconnected clusters', () => {
  const g = new MusicGraph();
  ['a', 'b', 'c', 'x', 'y', 'z'].forEach((u) => g.addNode({ uri: u, type: 'artist', label: u }));
  for (const [s, d] of [
    ['a', 'b'],
    ['b', 'c'],
    ['a', 'c'],
    ['x', 'y'],
    ['y', 'z'],
    ['x', 'z'],
  ])
    g.addEdge(s, d, 'saved');

  const community = detectCommunities(g);
  assert.equal(community.get('a'), community.get('c'));
  assert.equal(community.get('x'), community.get('z'));
  assert.notEqual(community.get('a'), community.get('x'));
});
