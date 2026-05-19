import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface-alt p-6 text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Something went wrong
          </h1>
          <p className="text-text-secondary mb-4 max-w-md">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 min-h-touch bg-primary text-white rounded-card text-sm font-medium hover:bg-primary-hover transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 min-h-touch bg-surface-hover text-stone-700 rounded-card text-sm font-medium hover:bg-stone-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
