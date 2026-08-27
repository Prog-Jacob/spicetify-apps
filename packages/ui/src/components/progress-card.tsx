import React from 'react';
import { t } from '../i18n';
import Progress from './progress';
import TextComponent from './text';
import { ButtonTertiary } from './button';
import { Card, CardContent } from './card';
import type { ProgressInfo } from '@shared/types';

type ProgressCardProps = {
  progress: ProgressInfo;
  onCancel: () => void;
};

const ProgressCard = ({ progress, onCancel }: ProgressCardProps) => {
  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <Card className="animate-fade-in-up border-0 py-5">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <TextComponent variant="mesto" weight="bold">
            {progress.label}...
          </TextComponent>
          {progress.total > 0 && (
            <TextComponent variant="minuet" semanticColor="textSubdued">
              {t('progress.counter', { current: progress.current, total: progress.total })}
            </TextComponent>
          )}
        </div>

        <Progress
          value={percent}
          aria-label={progress.label}
          indicatorClassName="bg-gradient-to-r from-spice-button via-spice-button-active to-spice-button bg-[length:200%_100%] animate-shimmer rtl:[animation-direction:reverse]"
        />

        <ButtonTertiary onClick={onCancel} buttonSize="sm">
          {t('cancel')}
        </ButtonTertiary>
      </CardContent>
    </Card>
  );
};

export default ProgressCard;
