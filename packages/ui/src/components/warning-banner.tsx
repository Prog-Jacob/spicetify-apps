import React from 'react';
import TextComponent from './text';

type WarningBannerProps = { warnings: string[] };

const WarningBanner = ({ warnings }: WarningBannerProps) => {
  if (warnings.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-spice-notification-error/10 p-3">
      {warnings.map((w, i) => (
        <TextComponent key={i} variant="minuet" semanticColor="textNegative">
          {w}
        </TextComponent>
      ))}
    </div>
  );
};

export default WarningBanner;
