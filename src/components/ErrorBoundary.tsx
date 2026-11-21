import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  isFirestorePermissionError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
    isFirestorePermissionError: false,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let message = error.message || 'An unexpected application error occurred.';
    let isPerm = false;

    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed === 'object' && typeof parsed.error === 'string') {
        isPerm = parsed.error.toLowerCase().includes('permission') || parsed.error.toLowerCase().includes('insufficient');
        message = isPerm
          ? `Firestore permission denied while accessing "${parsed.path || 'database'}". Make sure you are signed in with an authorized account and that firestore.rules are deployed to your mastro-tickets Firebase project.`
          : parsed.error;
      }
    } catch {
      isPerm = message.toLowerCase().includes('permission-denied') || message.toLowerCase().includes('insufficient permissions');
    }

    return {
      hasError: true,
      errorMessage: message,
      isFirestorePermissionError: isPerm,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, errorMessage: '', isFirestorePermissionError: false });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, errorMessage: '', isFirestorePermissionError: false });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white border border-[#E2E8F0] rounded-2xl shadow-lg p-6 sm:p-8 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#0B1F3A]">
                  {this.state.isFirestorePermissionError
                    ? 'Database Access Permission Required'
                    : 'Something Went Wrong'}
                </h1>
                <p className="text-sm text-[#475569] mt-1 leading-relaxed">
                  {this.state.errorMessage}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#123B67] hover:bg-[#1D5288] text-white text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#F5F7FA] text-[#0B1F3A] border border-[#E2E8F0] text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
              >
                <Home className="w-4 h-4" />
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
