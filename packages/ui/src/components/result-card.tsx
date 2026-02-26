import React from 'react';
import { cn } from '@shared/lib';
import { Card, CardContent } from './card';
import StatusHeader, { type StatusVariant } from './status-header';

type ResultCardProps = {
  variant: StatusVariant;
  title: string;
  className?: string;
  children?: React.ReactNode;
  actions: React.ReactNode;
};

const ResultCard = ({ variant, title, className, children, actions }: ResultCardProps) => (
  <Card className={cn('animate-fade-in-up border-0 py-5', className)}>
    <CardContent className="flex flex-col gap-5">
      <StatusHeader variant={variant} title={title} />
      {children}
      <div className="flex gap-3">{actions}</div>
    </CardContent>
  </Card>
);

export default ResultCard;
