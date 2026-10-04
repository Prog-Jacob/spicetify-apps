import React from 'react';
import { cn } from '@shared/lib';
import { Card, CardContent } from './card';
import { StatusHeader, type StatusVariant } from './status-header';

type ResultCardProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  variant: StatusVariant;
  title: string;
  actions: React.ReactNode;
};

export const ResultCard = ({
  variant,
  title,
  className,
  children,
  actions,
  ...rest
}: ResultCardProps) => (
  <Card className={cn('animate-fade-in-up border-0 py-5', className)} {...rest}>
    <CardContent className="flex flex-col gap-5">
      <StatusHeader variant={variant} title={title} />
      {children}
      <div className="flex flex-wrap gap-3">{actions}</div>
    </CardContent>
  </Card>
);
