/**
 * Product Availability Error Boundary
 * 
 * Provides graceful fallbacks when inventory services fail.
 * Ensures users can still browse and purchase products even with availability errors.
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Product, StoreCode } from '@/lib/types';

interface Props {
  children: ReactNode;
  product?: Product;
  selectedStore?: StoreCode | null;
  fallbackMode?: 'hide' | 'legacy' | 'optimistic';
  onError?: (error: Error, errorInfo: ErrorInfo, context?: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
  retryCount: number;
  fallbackActive: boolean;
}

class ProductAvailabilityErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
      retryCount: 0,
      fallbackActive: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `availability-error-${Date.now()}`;
    return {
      hasError: true,
      error,
      errorId,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Product Availability Error:', error);
    console.error('Error Info:', errorInfo);

    // Report to error tracking service
    this.props.onError?.(error, errorInfo, {
      product: this.props.product,
      selectedStore: this.props.selectedStore,
      timestamp: new Date().toISOString()
    });

    // Log availability-specific error details
    this.logAvailabilityError(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private logAvailabilityError = (error: Error, errorInfo: ErrorInfo) => {
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
        productId: this.props.product?.$id || this.props.product?.id,
        productName: this.props.product?.name,
        selectedStore: this.props.selectedStore,
        userAgent: navigator.userAgent,
        url: window.location.href,
        networkStatus: navigator.onLine ? 'online' : 'offline'
      }
    };

    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Replace with your error reporting service
      console.error('Availability Error Report:', errorData);
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        retryCount: prevState.retryCount + 1
      }));

      // Exponential backoff retry
      const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000);
      
      this.retryTimeout = setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorId: '',
          fallbackActive: false
        });
      }, delay);
    }
  };

  private handleFallbackMode = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: '',
      fallbackActive: true,
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      const fallbackMode = this.props.fallbackMode || 'legacy';

      switch (fallbackMode) {
        case 'hide':
          return null;
        
        case 'optimistic':
          return (
            <ProductAvailabilityOptimisticFallback
              product={this.props.product}
              selectedStore={this.props.selectedStore}
              error={this.state.error}
              onRetry={this.handleRetry}
              canRetry={this.state.retryCount < this.maxRetries}
            />
          );
        
        case 'legacy':
        default:
          return (
            <ProductAvailabilityLegacyFallback
              product={this.props.product}
              selectedStore={this.props.selectedStore}
              error={this.state.error}
              errorId={this.state.errorId}
              retryCount={this.state.retryCount}
              maxRetries={this.maxRetries}
              onRetry={this.handleRetry}
              onUseFallback={this.handleFallbackMode}
            />
          );
      }
    }

    // Inject fallback context if fallback mode is active
    if (this.state.fallbackActive) {
      return (
        <div data-availability-fallback="true">
          {this.props.children}
        </div>
      );
    }

    return this.props.children;
  }
}

// Optimistic Fallback - assumes product is available
interface OptimisticFallbackProps {
  product?: Product;
  selectedStore?: StoreCode | null;
  error: Error | null;
  onRetry: () => void;
  canRetry: boolean;
}

function ProductAvailabilityOptimisticFallback({
  product,
  selectedStore,
  error,
  onRetry,
  canRetry
}: OptimisticFallbackProps) {
  return (
    <div className="relative">
      {/* Warning Banner */}
      <div className="absolute top-0 left-0 right-0 bg-yellow-100 border border-yellow-300 rounded-t-lg p-2 z-10">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center text-yellow-800">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Disponibilité non vérifiée
          </div>
          {canRetry && (
            <button
              onClick={onRetry}
              className="text-yellow-700 hover:text-yellow-900 underline"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
      
      {/* Product content with optimistic availability */}
      <div className="pt-8">
        {React.cloneElement(
          React.Children.only(React.Children.toArray(this.props.children)[0]) as React.ReactElement,
          {
            // Override availability props with optimistic values
            availability: {
              productId: product?.$id || product?.id,
              store: selectedStore,
              isAvailable: true,
              quantity: 10,
              isLowStock: false,
              lastUpdated: new Date().toISOString()
            },
            availabilityLoading: false,
            showAvailabilityWarning: true
          }
        )}
      </div>
    </div>
  );
}

// Legacy Fallback - shows error state and recovery options
interface LegacyFallbackProps {
  product?: Product;
  selectedStore?: StoreCode | null;
  error: Error | null;
  errorId: string;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
  onUseFallback: () => void;
}

function ProductAvailabilityLegacyFallback({
  product,
  selectedStore,
  error,
  errorId,
  retryCount,
  maxRetries,
  onRetry,
  onUseFallback
}: LegacyFallbackProps) {
  const canRetry = retryCount < maxRetries;

  const getErrorMessage = () => {
    if (error?.message.includes('network') || error?.message.includes('fetch')) {
      return 'Problème de connexion';
    }
    if (error?.message.includes('timeout')) {
      return 'Délai de réponse dépassé';
    }
    if (error?.message.includes('404')) {
      return 'Produit introuvable';
    }
    return 'Erreur de disponibilité';
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      {/* Error Message */}
      <div className="flex items-start space-x-3 mb-4">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">
            {getErrorMessage()}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            Impossible de vérifier la disponibilité de ce produit
            {selectedStore && ` à ${selectedStore === 'COCODY' ? 'Cocody' : 'Koumassi'}`}
          </p>
        </div>
      </div>

      {/* Product Info (if available) */}
      {product && (
        <div className="bg-white rounded border p-3 mb-4">
          <h5 className="font-medium text-gray-900 text-sm">{product.name}</h5>
          <p className="text-sm text-gray-600">
            Prix: {product.basePrice?.toLocaleString('fr-FR') || product.price?.toLocaleString('fr-FR')} F
          </p>
        </div>
      )}

      {/* Recovery Actions */}
      <div className="space-y-2">
        {canRetry && (
          <button
            onClick={onRetry}
            className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Réessayer la vérification ({maxRetries - retryCount} tentative{maxRetries - retryCount > 1 ? 's' : ''} restante{maxRetries - retryCount > 1 ? 's' : ''})
          </button>
        )}

        <button
          onClick={onUseFallback}
          className="w-full border border-gray-300 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-50 transition-colors"
        >
          Continuer sans vérification
        </button>

        {/* Contact Support */}
        <div className="text-center pt-2">
          <button className="text-xs text-gray-500 hover:text-gray-700">
            Signaler le problème
          </button>
        </div>
      </div>

      {/* Debug Info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer text-gray-500">Détails techniques</summary>
          <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify({
              error: error?.message,
              errorId,
              productId: product?.$id || product?.id,
              selectedStore,
              retryCount,
              timestamp: new Date().toISOString()
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

export default ProductAvailabilityErrorBoundary;