import React from 'react';
import { t } from '../i18n';
import TextComponent from './text';
import ResultCard from './result-card';
import { ButtonPrimary } from './button';

type ErrorCardProps = {
  title: string;
  warnings?: string[];
  onRetry?: () => void;
};

const ErrorCard = ({ title, warnings, onRetry }: ErrorCardProps) => (
  <ResultCard
    variant="error"
    title={title}
    className="bg-spice-notification-error/10"
    actions={
      onRetry ? (
        <ButtonPrimary onClick={onRetry} buttonSize="md">
          {t('tryAgain')}
        </ButtonPrimary>
      ) : null
    }
  >
    {warnings?.map((w, i) => (
      <TextComponent key={i} variant="mesto" semanticColor="textNegative">
        {w}
      </TextComponent>
    ))}
  </ResultCard>
);

export default ErrorCard;
