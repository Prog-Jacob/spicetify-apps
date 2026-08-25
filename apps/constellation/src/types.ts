import type { NODE_TYPE, EDGE_TYPE } from './constants';

export type NodeType = (typeof NODE_TYPE)[keyof typeof NODE_TYPE];
export type EdgeType = (typeof EDGE_TYPE)[keyof typeof EDGE_TYPE];

export type GraphNode = {
  uri: string;
  type: NodeType;
  label: string;
  addedAt?: number;
};

export type GraphEdge = {
  source: string;
  target: string;
  type: EdgeType;
};
