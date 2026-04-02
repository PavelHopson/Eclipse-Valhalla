/**
 * Eclipse Valhalla — Error Boundary
 *
 * Catches rendering errors. Prevents white screen of death.
 */

import React, { Component, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, info.componentStack);
    // TODO: Send to error tracking service
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#8B000010] border border-[#8B000030] flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-[#FF4444]" />
          </div>
          <h2 className="text-lg font-bold text-[#E8E8F0] mb-1">
            {this.props.fallbackTitle || 'Something broke.'}
          </h2>
          <p className="text-xs text-[#55556A] max-w-sm mb-4">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-[#1F1F2B] border border-[#2A2A3C] rounded-xl text-sm text-[#8888A0] hover:text-[#E8E8F0] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
