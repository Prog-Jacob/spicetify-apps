import React from 'react';
import { TextComponent } from './text-component';

export const WarningList = ({ warnings }: { warnings: string[] }) => (
  <>
    {warnings.map((w, i) => (
      <TextComponent key={i} variant="mesto" semanticColor="textNegative">
        {w}
      </TextComponent>
    ))}
  </>
);

export const WarningBanner = ({ warnings }: { warnings: string[] }) => {
  if (warnings.length === 0) return null;
  return (
    <div
      role="alert"
      className="flex flex-col gap-1.5 rounded-lg bg-spice-notification-error/10 p-3"
    >
      <WarningList warnings={warnings} />
    </div>
  );
};
