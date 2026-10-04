import React from 'react';
import { t } from '../i18n';
import { ButtonPrimary } from './button';
import { ResultCard } from './result-card';
import { WarningList } from './warning-banner';

type ErrorCardProps = {
  title: string;
  warnings?: string[];
  onRetry?: () => void;
};

export const ErrorCard = ({ title, warnings = [], onRetry }: ErrorCardProps) => (
  <ResultCard
    variant="error"
    title={title}
    role="alert"
    className="bg-spice-notification-error/10"
    actions={
      onRetry && (
        <ButtonPrimary onClick={onRetry} buttonSize="md">
          {t('tryAgain')}
        </ButtonPrimary>
      )
    }
  >
    <WarningList warnings={warnings} />
  </ResultCard>
);
