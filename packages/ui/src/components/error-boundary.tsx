import React from 'react';
import ErrorCard from './error-card';

type ErrorBoundaryProps = {
  scope: string;
  title: string;
  children: React.ReactNode;
};

type ErrorBoundaryState = { hasError: boolean; error: unknown };

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error(`[${this.props.scope}] Uncaught render error:`, error, info.componentStack);
  }

  render() {
    const { hasError, error } = this.state;
    if (!hasError) return this.props.children;
    return (
      <ErrorCard
        title={this.props.title}
        warnings={[error instanceof Error ? error.message : String(error)]}
        onRetry={() => this.setState({ hasError: false, error: null })}
      />
    );
  }
}

export default ErrorBoundary;
