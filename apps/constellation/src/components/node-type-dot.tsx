import React from 'react';
import { cn } from '@shared/lib';
import type { NodeType } from '../types';
import { graphPalette } from '../graph/theme';

type Props = { type: NodeType; dim?: boolean; className?: string };

const NodeTypeDot = ({ type, dim, className }: Props) => {
  const palette = graphPalette();
  return (
    <span
      className={cn('inline-block h-2.5 w-2.5 shrink-0 rounded-full', className)}
      style={{ backgroundColor: palette.color[type], opacity: dim ? 0.35 : 1 }}
    />
  );
};

export default NodeTypeDot;
