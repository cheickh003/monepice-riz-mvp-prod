/**
 * Store Selection Error Boundary
 * 
 * Provides graceful fallbacks when geolocation or store selection services fail.
 * Ensures users can still browse and purchase products even with location errors.
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StoreCode } from '@/lib/types';
import { STORES, DEFAULT_STORE } from '@/lib/config/stores';

interface Props {
  children: ReactNode;
  fallbackStore?: StoreCode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
  retryCount: number;
}

class StoreSelectionErrorBoundary extends Component<Props, State> {
  private maxRetries = 2;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `store-error-${Date.now()}`;
    return {
      hasError: true,
      error,
      errorId,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Store Selection Error:', error);
    console.error('Error Info:', errorInfo);

    // Report to error tracking service
    this.props.onError?.(error, errorInfo);

    // Log store-specific error details
    this.logStoreError(error, errorInfo);
  }

  private logStoreError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      context: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        localStorage: this.getStorageDebugInfo()
      }
    };

    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Replace with your error reporting service
      console.error('Store Selection Error Report:', errorData);
    }
  };

  private getStorageDebugInfo = () => {
    try {
      return {
        storeSelection: localStorage.getItem('store-selection-storage'),
        hasGeolocation: 'geolocation' in navigator,
        permissions: navigator.permissions ? 'supported' : 'unsupported'
      };
    } catch {
      return { storageAccess: 'blocked' };
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorId: '',
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  private handleFallbackMode = () => {
    // Set fallback store and continue
    const fallbackStore = this.props.fallbackStore || DEFAULT_STORE;
    
    try {
      localStorage.setItem('store-selection-storage', JSON.stringify({
        state: {
          selectedStore: fallbackStore,
          userLocation: null,
          locationPermission: 'denied',
          lastUpdated: Date.now()
        }
      }));
    } catch (error) {
      console.warn('Could not save fallback store to localStorage:', error);
    }

    this.setState({
      hasError: false,
      error: null,
      errorId: '',
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <StoreSelectionErrorFallback
          error={this.state.error}
          errorId={this.state.errorId}
          retryCount={this.state.retryCount}
          maxRetries={this.maxRetries}
          fallbackStore={this.props.fallbackStore || DEFAULT_STORE}
          onRetry={this.handleRetry}
          onUseFallback={this.handleFallbackMode}
        />
      );
    }

    return this.props.children;
  }
}

interface FallbackProps {
  error: Error | null;
  errorId: string;
  retryCount: number;
  maxRetries: number;
  fallbackStore: StoreCode;
  onRetry: () => void;
  onUseFallback: () => void;
}

function StoreSelectionErrorFallback({
  error,
  errorId,
  retryCount,
  maxRetries,
  fallbackStore,
  onRetry,
  onUseFallback
}: FallbackProps) {
  const fallbackStoreInfo = STORES[fallbackStore];
  const canRetry = retryCount < maxRetries;

  const getErrorMessage = () => {
    if (error?.message.includes('geolocation')) {
      return 'Impossible d\'accéder à votre localisation';
    }
    if (error?.message.includes('network') || error?.message.includes('fetch')) {
      return 'Problème de connexion réseau';
    }
    return 'Erreur lors de la sélection du magasin';
  };

  const getErrorSuggestion = () => {
    if (error?.message.includes('geolocation')) {
      return 'Vérifiez les permissions de localisation dans votre navigateur';
    }
    return 'Vérifiez votre connexion internet et réessayez';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        {/* Error Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>

        {/* Error Details */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {getErrorMessage()}
          </h2>
          <p className="text-gray-600 mb-4">
            {getErrorSuggestion()}
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left bg-gray-100 p-3 rounded text-xs">
              <summary className="cursor-pointer">Détails techniques</summary>
              <pre className="mt-2 overflow-auto">
                {error?.message}
                {'\n'}
                ID: {errorId}
                {'\n'}
                Tentatives: {retryCount}/{maxRetries}
              </pre>
            </details>
          )}
        </div>

        {/* Fallback Option */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">
            Continuer avec le magasin par défaut
          </h3>
          <div className="text-sm text-blue-800">
            <p className="font-medium">{fallbackStoreInfo.name}</p>
            <p>{fallbackStoreInfo.location.address}</p>
            <p>{fallbackStoreInfo.phone}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onUseFallback}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continuer avec {fallbackStore === 'COCODY' ? 'Cocody' : 'Koumassi'}
          </button>

          {canRetry && (
            <button
              onClick={onRetry}
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Réessayer ({maxRetries - retryCount} tentative{maxRetries - retryCount > 1 ? 's' : ''} restante{maxRetries - retryCount > 1 ? 's' : ''})
            </button>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-full text-gray-500 py-2 px-4 text-sm hover:text-gray-700 transition-colors"
          >
            Recharger la page
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Vous pourrez changer de magasin plus tard dans les paramètres
          </p>
        </div>
      </div>
    </div>
  );
}

export default StoreSelectionErrorBoundary;