import React from 'react';
import ErrorCard from './error-card';
import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from 'react-error-boundary';

type ErrorBoundaryProps = {
  scope: string;
  title: string;
  children: React.ReactNode;
};

const ErrorBoundary = ({ scope, title, children }: ErrorBoundaryProps) => (
  <ReactErrorBoundary
    onError={(error, info) =>
      console.error(`[${scope}] Uncaught render error:`, error, info.componentStack)
    }
    fallbackRender={({ error, resetErrorBoundary }: FallbackProps) => (
      <ErrorCard
        title={title}
        warnings={[error instanceof Error ? error.message : String(error)]}
        onRetry={resetErrorBoundary}
      />
    )}
  >
    {children}
  </ReactErrorBoundary>
);

export default ErrorBoundary;
