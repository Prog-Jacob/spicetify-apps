import React from 'react';
import { t } from '../i18n';
import { Progress } from './progress';
import { ButtonTertiary } from './button';
import { Card, CardContent } from './card';
import { TextComponent } from './text-component';
import type { ProgressInfo } from '@shared/types';

type ProgressCardProps = {
  progress: ProgressInfo;
  onCancel: () => void;
};

/** A zero `total` means "not yet known": the bar is indeterminate and the counter hidden. */
export const ProgressCard = ({ progress, onCancel }: ProgressCardProps) => {
  const known = progress.total > 0;
  const percent = known ? Math.round((progress.current / progress.total) * 100) : undefined;

  return (
    <Card className="animate-fade-in-up border-0 py-5">
      <CardContent className="flex flex-col gap-3">
        <div role="status" className="flex items-center justify-between gap-3">
          <TextComponent variant="mesto" weight="bold" className="truncate">
            {t('progress.label', { label: progress.label })}
          </TextComponent>
          {known && (
            <TextComponent variant="minuet" semanticColor="textSubdued" className="tabular-nums">
              {t('progress.counter', { current: progress.current, total: progress.total })}
            </TextComponent>
          )}
        </div>

        <Progress
          value={percent}
          aria-label={progress.label}
          indicatorClassName="bg-gradient-to-r from-spice-button via-spice-button-active to-spice-button bg-[length:200%_100%] animate-shimmer rtl:[animation-direction:reverse]"
        />

        <ButtonTertiary onClick={onCancel} buttonSize="sm" className="self-start">
          {t('cancel')}
        </ButtonTertiary>
      </CardContent>
    </Card>
  );
};
