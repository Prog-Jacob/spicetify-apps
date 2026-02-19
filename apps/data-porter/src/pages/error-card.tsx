import React from 'react';
import StatusHeader from './status-header';
import { Card, CardContent } from '@ui/components/ui/card';

const { TextComponent, ButtonPrimary } = Spicetify.ReactComponent;

type ErrorCardProps = {
  title: string;
  warnings?: string[];
  onRetry: () => void;
};

const ErrorCard = ({ title, warnings, onRetry }: ErrorCardProps) => (
  <Card className="animate-fade-in-up border-0 bg-spice-notification-error/10 py-5">
    <CardContent className="flex flex-col gap-4">
      <StatusHeader variant="error" title={title} />
      {warnings?.map((w) => (
        <TextComponent key={w} variant="mesto" semanticColor="textNegative">
          {w}
        </TextComponent>
      ))}
      <ButtonPrimary onClick={onRetry} buttonSize="md">
        Try Again
      </ButtonPrimary>
    </CardContent>
  </Card>
);

export default ErrorCard;
