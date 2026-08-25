import React from 'react';
import { TextComponent, ButtonPrimary } from '@ui/components';

type Props = {
  title: string;
  subtitle?: string;
  pulse?: boolean;
  action?: { label: string; onClick: () => void };
};

const Motif = ({ pulse }: { pulse?: boolean }) => (
  <svg
    viewBox="0 0 120 90"
    className={`h-20 w-28 text-spice-button ${pulse ? 'animate-pulse' : ''}`}
    fill="none"
    aria-hidden
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

const GraphPlaceholder = ({ title, subtitle, pulse, action }: Props) => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-8 text-center">
    <Motif pulse={pulse} />
    <div className="flex max-w-sm flex-col gap-2">
      <TextComponent variant="alto" weight="bold">
        {title}
      </TextComponent>
      {subtitle && (
        <TextComponent variant="mesto" semanticColor="textSubdued">
          {subtitle}
        </TextComponent>
      )}
    </div>
    {action && (
      <ButtonPrimary buttonSize="sm" onClick={action.onClick}>
        {action.label}
      </ButtonPrimary>
    )}
  </div>
);

export default GraphPlaceholder;
