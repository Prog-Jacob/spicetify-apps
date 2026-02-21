import React from 'react';
import { Progress } from '@ui/components/ui/progress';
import { Card, CardContent } from '@ui/components/ui/card';
import type { ProgressInfo } from '@shared/types/platform';

const { TextComponent, ButtonTertiary } = Spicetify.ReactComponent;

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
            {progress.label}
          </TextComponent>
          {progress.total > 0 && (
            <TextComponent variant="minuet" semanticColor="textSubdued">
              {progress.current} / {progress.total}
            </TextComponent>
          )}
        </div>

        <Progress
          value={percent}
          aria-label={progress.label}
          indicatorClassName="bg-gradient-to-r from-spice-button via-spice-button-active to-spice-button bg-[length:200%_100%] animate-shimmer"
        />

        <ButtonTertiary onClick={onCancel} buttonSize="sm">
          Cancel
        </ButtonTertiary>
      </CardContent>
    </Card>
  );
};

export default ProgressCard;
