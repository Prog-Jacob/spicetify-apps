import React from 'react';
import { ErrorCard } from './error-card';
import { errorMessage } from '@shared/lib';

type ErrorBoundaryProps = {
  title: string;
  /** Replaces the state that crashed before Try Again re-renders it. */
  onReset?: () => void;
  children: React.ReactNode;
};

type ErrorBoundaryState = { hasError: boolean; error: unknown };

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error(`[${__APP_NAME__}] Uncaught render error:`, error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <ErrorCard
        title={this.props.title}
        warnings={[errorMessage(this.state.error)]}
        onRetry={() => {
          this.props.onReset?.();
          this.setState({ hasError: false, error: null });
        }}
      />
    );
  }
}
