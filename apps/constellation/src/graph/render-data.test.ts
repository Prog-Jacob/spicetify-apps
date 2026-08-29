import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MusicGraph } from './music-graph';
import { projectNodes, type RenderNode } from './render-data';

const node = (uri: string, label = uri) => ({ uri, type: 'artist', label }) as const;

test('render nodes keep their identity across reprojections, and die with their graph node', () => {
  const g = new MusicGraph();
  ['a', 'b'].forEach((u) => g.addNode(node(u)));
  const cache = new Map<string, RenderNode>();

  const [first] = projectNodes(g, cache);
  first.x = 42;
  assert.equal(cache.size, 2);
  assert.equal(projectNodes(g, cache)[0], first, 'same object, so the layout survives');

  g.removeNode('a');
  assert.deepEqual(
    projectNodes(g, cache).map((n) => n.uri),
    ['b'],
  );
  assert.deepEqual([...cache.keys()], ['b'], 'no entry outlives its node');
});

test('a renamed node re-derives the text drawn on the canvas', () => {
  const g = new MusicGraph();
  g.addNode(node('a', 'Original'));
  const cache = new Map<string, RenderNode>();
  projectNodes(g, cache);

  g.removeNode('a');
  g.addNode(node('a', 'A Very Long Replacement Name Indeed'));
  const [renamed] = projectNodes(g, cache);
  assert.equal(renamed.monogram, 'A');
  assert.ok(renamed.shortLabel.endsWith('…'), 'long labels are truncated for the canvas');
});
