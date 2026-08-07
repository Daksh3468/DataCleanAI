import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React render error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/upload';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center space-x-3 text-rose-600">
            <AlertTriangle className="w-8 h-8 shrink-0" />
            <h2 className="text-xl font-bold text-slate-900">Application Error Detected</h2>
          </div>
          <p className="text-sm text-slate-600 font-medium">
            Something unexpected occurred while rendering this page.
          </p>
          {this.state.error && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-rose-700 overflow-x-auto">
              {this.state.error.message}
            </div>
          )}
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center space-x-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Application State</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
