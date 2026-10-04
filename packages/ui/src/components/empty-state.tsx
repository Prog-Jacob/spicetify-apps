import React from 'react';
import { cn } from '@shared/lib';
import { ButtonPrimary } from './button';
import { TextComponent } from './text-component';

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  art?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  className?: string;
};

export const EmptyState = ({ title, subtitle, art, action, className }: EmptyStateProps) => (
  <div
    role="status"
    className={cn(
      'flex h-full w-full flex-col items-center justify-center gap-4 px-8 text-center',
      className,
    )}
  >
    {art && <div aria-hidden>{art}</div>}
    <div className="flex max-w-sm flex-col gap-2">
      <TextComponent as="h2" variant="alto" weight="bold">
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
