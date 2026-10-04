import React from 'react';
import { cn } from '@shared/lib';

const ConstellationArt = ({ pulse }: { pulse?: boolean }) => (
  <svg
    viewBox="0 0 120 90"
    className={cn('h-20 w-28 text-spice-button', pulse && 'animate-pulse')}
    fill="none"
  >
    <path
      d="M60 46 L26 22 M60 46 L98 20 M60 46 L34 74 M60 46 L92 68 M60 46 L60 12"
      stroke="currentColor"
      strokeOpacity="0.35"
      strokeWidth="1.5"
    />
    <circle cx="60" cy="46" r="7" fill="currentColor" />
    <circle cx="26" cy="22" r="4" fill="currentColor" fillOpacity="0.8" />
    <circle cx="98" cy="20" r="3.5" fill="currentColor" fillOpacity="0.7" />
    <circle cx="34" cy="74" r="3.5" fill="currentColor" fillOpacity="0.7" />
    <circle cx="92" cy="68" r="4" fill="currentColor" fillOpacity="0.8" />
    <circle cx="60" cy="12" r="3" fill="currentColor" fillOpacity="0.6" />
  </svg>
);

export default ConstellationArt;
