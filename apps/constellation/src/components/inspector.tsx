import { t } from '../i18n';
import React, { useMemo } from 'react';
import type { NodeType } from '../types';
import { NODE_TYPE } from '../constants';
import { readGraphPalette } from '../graph/theme';
import { canExpand } from '../services/expand-node';
import type { RenderNode } from '../graph/render-data';
import type { MusicGraph } from '../graph/music-graph';
import { TextComponent, ButtonSecondary } from '@ui/components';

const PLAYABLE = new Set<NodeType>([
  NODE_TYPE.TRACK,
  NODE_TYPE.ARTIST,
  NODE_TYPE.ALBUM,
  NODE_TYPE.PLAYLIST,
]);

type Props = {
  node: RenderNode | null;
  graph: MusicGraph;
  expanded: Set<string>;
  expandingUri: string | null;
  onExpand: (node: RenderNode) => void;
};

const TypeDot = ({ color }: { color: string }) => (
  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
);

const Inspector = ({ node, graph, expanded, expandingUri, onExpand }: Props) => {
  const palette = useMemo(readGraphPalette, []);
  const neighbors = useMemo(() => (node ? graph.neighbors(node.uri) : []), [graph, node]);

  return (
    <aside className="flex h-full w-72 flex-col gap-3 overflow-y-auto border-l border-spice-button/30 bg-spice-card/60 p-4 backdrop-blur">
      {!node ? (
        <TextComponent variant="mesto" semanticColor="textSubdued">
          {t('inspector.empty', { count: graph.size })}
        </TextComponent>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <TypeDot color={palette.color[node.type]} />
            <TextComponent variant="mesto" semanticColor="textSubdued">
              {t(`type.${node.type}`)}
            </TextComponent>
          </div>
          <TextComponent variant="alto">{node.label}</TextComponent>

          <div className="flex flex-wrap gap-2">
            {PLAYABLE.has(node.type) && (
              <ButtonSecondary buttonSize="sm" onClick={() => Spicetify.Player.playUri(node.uri)}>
                {t('inspector.play')}
              </ButtonSecondary>
            )}
            {canExpand(node.type) && !expanded.has(node.uri) && (
              <ButtonSecondary
                buttonSize="sm"
                disabled={expandingUri === node.uri}
                onClick={() => onExpand(node)}
              >
                {expandingUri === node.uri ? t('inspector.expanding') : t('inspector.expand')}
              </ButtonSecondary>
            )}
          </div>

          <TextComponent variant="mesto" semanticColor="textSubdued" className="mt-1">
            {t('inspector.connections', { count: neighbors.length })}
          </TextComponent>
          <ul className="flex flex-col gap-1.5">
            {neighbors.map((n) => (
              <li key={n.uri} className="flex items-center gap-2 truncate">
                <TypeDot color={palette.color[n.type]} />
                <span className="truncate text-sm text-spice-text">{n.label}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
};

export default Inspector;
