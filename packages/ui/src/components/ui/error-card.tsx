import React from 'react';
import { t } from '../../i18n';
import { ResultCard } from './result-card';

const { TextComponent, ButtonPrimary } = Spicetify.ReactComponent;

type ErrorCardProps = {
  title: string;
  warnings?: string[];
  onRetry: () => void;
};

const ErrorCard = ({ title, warnings, onRetry }: ErrorCardProps) => (
  <ResultCard
    variant="error"
    title={title}
    className="bg-spice-notification-error/10"
    actions={
      <ButtonPrimary onClick={onRetry} buttonSize="md">
        {t('tryAgain')}
      </ButtonPrimary>
    }
  >
    {warnings?.map((w) => (
      <TextComponent key={w} variant="mesto" semanticColor="textNegative">
        {w}
      </TextComponent>
    ))}
  </ResultCard>
);

export { ErrorCard };
