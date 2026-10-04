import React from 'react';
import { cn } from '@shared/lib';

type ArtworkProps = {
  src?: string;
  size: number;
  shape?: 'square' | 'circle';
  fallback?: React.ReactNode;
  className?: string;
};

export const Artwork = ({ src, size, shape = 'square', fallback, className }: ArtworkProps) => (
  <span
    className={cn(
      'flex shrink-0 items-center justify-center overflow-hidden bg-spice-highlight/40 text-spice-subtext',
      shape === 'circle' ? 'rounded-full' : 'rounded-md',
      className,
    )}
    style={{ width: size, height: size }}
  >
    {src ? (
      <img
        src={src}
        alt=""
        loading="lazy"
        width={size}
        height={size}
        className="size-full object-cover"
      />
    ) : (
      fallback
    )}
  </span>
);
