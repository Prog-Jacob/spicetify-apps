import ViewTab from './view-tab';
import NodesTab from './nodes-tab';
import React, { useMemo } from 'react';
import PhysicsTab from './physics-tab';
import ControlDock from './control-dock';
import NodeSearchBox from './node-search-box';
import type { GraphNode } from '../types/graph';
import type { usePhysics } from '../hooks/use-physics';
import type { GraphLenses } from '../hooks/use-graph-lenses';
import type { LibraryGraph } from '../services/library-crawler';
import type { GraphControls } from '../hooks/use-graph-controls';
import type { GraphExplorer } from '../hooks/use-graph-explorer';

type Props = {
  explorer: GraphExplorer;
  library: LibraryGraph;
  controls: GraphControls;
  physics: ReturnType<typeof usePhysics>;
  lenses: GraphLenses;
  filtersActive: boolean;
  onResetFilters: () => void;
  onFocus: (node: GraphNode) => void;
  onRemove: (node: GraphNode) => void;
  onRestore: (uri: string) => void;
};

const GraphDock = ({
  explorer,
  library,
  controls,
  physics,
  lenses,
  filtersActive,
  onResetFilters,
  onFocus,
  onRemove,
  onRestore,
}: Props) => {
  const removed = useMemo(
    () => explorer.hidden.flatMap((uri) => library.graph.node(uri) ?? []),
    [explorer.hidden, library.graph, explorer.revision],
  );
  return (
    <div className="animate-fade-in-up pointer-events-none absolute bottom-14 start-3 top-3 z-10 flex w-[var(--dock-w)] flex-col gap-2 [&>*]:pointer-events-auto">
      <NodeSearchBox nodes={lenses.visibleNodes} onPick={onFocus} />
      <ControlDock
        graph={library.graph}
        progress={explorer.expandProgress}
        onCancelExpandAll={explorer.cancelExpandAll}
        view={
          <ViewTab
            controls={controls}
            library={library}
            timeBounds={lenses.timeBounds}
            since={lenses.effectiveSince}
            visibleNodes={lenses.visibleNodes}
            pinnedCount={Object.keys(explorer.pins).length}
            filtersActive={filtersActive}
            onResetFilters={onResetFilters}
            onExpandAll={() => explorer.expandAll(lenses.visibleNodes)}
            onReleasePins={explorer.releaseAllPins}
            onReload={explorer.reload}
            refreshing={explorer.crawlPhase !== null}
          />
        }
        physics={<PhysicsTab physics={physics} />}
        nodes={
          <NodesTab
            nodes={lenses.liveNodes}
            removed={removed}
            adding={explorer.adding}
            onAdd={explorer.addEntity}
            onAdded={onFocus}
            onRemove={onRemove}
            onRestore={onRestore}
            onSelect={onFocus}
          />
        }
      />
    </div>
  );
};

export default GraphDock;
