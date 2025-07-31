/**
 * Sentry Edge Runtime Configuration for MonEpice&Riz
 * 
 * This file configures Sentry for Edge Runtime functions including middleware
 * and Edge API routes. The Edge Runtime has limitations compared to Node.js,
 * so this configuration is minimal and optimized for the edge environment.
 * 
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 * @see https://nextjs.org/docs/api-reference/edge-runtime
 */

import * as Sentry from "@sentry/nextjs";

// Edge Runtime environment variables (only NEXT_PUBLIC_ vars are available)
const edgeConfig = {
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || 'development',
  release: process.env.SENTRY_RELEASE || '1.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'MonEpice&Riz',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

// Only initialize Sentry in Edge Runtime if DSN is provided
if (edgeConfig.dsn && typeof EdgeRuntime !== 'undefined') {
  Sentry.init({
    // Data Source Name
    dsn: edgeConfig.dsn,

    // Environment
    environment: edgeConfig.environment,

    // Release version
    release: edgeConfig.release,

    // Minimal debug mode for edge
    debug: edgeConfig.nodeEnv === 'development',

    // Minimal integrations for Edge Runtime
    integrations: [
      // Basic HTTP integration with limited functionality
      Sentry.httpIntegration({
        tracing: {
          // Don't trace internal Next.js requests
          ignoreIncomingRequests: (url) => {
            return url.includes('/_next/') || 
                   url.includes('/favicon.ico') ||
                   url.includes('/api/monitoring');
          },
        },
      }),
    ],

    // Lower sample rates for edge functions to manage quota
    tracesSampleRate: edgeConfig.nodeEnv === 'production' ? 0.05 : 0.5,

    // Edge-specific error filtering
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly needed
      if (edgeConfig.nodeEnv === 'development') {
        return null;
      }

      // Filter out expected edge runtime limitations
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error) {
          // Don't report Edge Runtime limitations
          if (error.message.includes('not available in Edge Runtime') ||
              error.message.includes('Dynamic Code Evaluation')) {
            return null;
          }

          // Don't report timeout errors (edge functions have time limits)
          if (error.message.includes('timeout') || 
              error.message.includes('execution time limit')) {
            return null;
          }
        }
      }

      // Minimal data filtering for edge
      if (event.request) {
        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
          delete event.request.headers['x-api-key'];
        }
      }

      return event;
    },

    // Minimal initial scope for edge
    initialScope: {
      tags: {
        component: 'edge',
        environment: edgeConfig.nodeEnv,
        runtime: 'edge',
      },
      contexts: {
        app: {
          name: edgeConfig.appName,
          version: edgeConfig.release,
        },
        runtime: {
          name: 'edge',
          version: 'edge-runtime',
        },
      },
    },

    // Ignore edge-specific errors
    ignoreErrors: [
      // Edge Runtime limitations
      'Dynamic Code Evaluation',
      'not available in Edge Runtime',
      'Node.js APIs are not supported',
      
      // Timeout errors
      'execution time limit',
      'timeout',
      'TimeoutError',
      
      // Network errors in edge
      'NetworkError',
      'fetch failed',
      
      // Expected validation errors
      'ValidationError',
      'Bad Request',
    ],

    // Minimal breadcrumbs for edge
    maxBreadcrumbs: 20,

    // Transport configuration for edge
    transport: Sentry.makeFetchTransport,

    // Don't capture unhandled rejections (limited support in edge)
    captureUnhandledRejections: false,
  });

  // Set edge-specific context
  Sentry.setContext('edge_config', {
    runtime: 'edge',
    environment: edgeConfig.environment,
    app_url: edgeConfig.appUrl,
  });
}

// Export minimal utility functions for edge runtime
export const captureEdgeError = (
  error: Error, 
  context?: { 
    request?: { method?: string; url?: string };
    extra?: Record<string, any>;
  }
) => {
  // Only capture in production or when debugging
  if (edgeConfig.nodeEnv === 'development') {
    console.error('Edge Error:', error, context);
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'edge_error');
    
    if (context?.request) {
      scope.setContext('request', {
        method: context.request.method,
        url: context.request.url,
      });
    }
    
    if (context?.extra) {
      scope.setContext('additional_context', context.extra);
    }
    
    Sentry.captureException(error);
  });
};

export const captureEdgeMessage = (
  message: string, 
  level: 'info' | 'warning' | 'error' = 'info'
) => {
  // Only capture in production
  if (edgeConfig.nodeEnv === 'development') {
    console.log(`[Edge ${level.toUpperCase()}]:`, message);
    return;
  }

  Sentry.captureMessage(message, level);
};

export const addEdgeBreadcrumb = (
  message: string, 
  category: string, 
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    timestamp: Date.now() / 1000,
    level: 'info',
  });
};

export const trackEdgeFunction = (
  functionName: string,
  duration: number,
  success: boolean
) => {
  addEdgeBreadcrumb(
    `Edge function ${functionName} ${success ? 'completed' : 'failed'}`,
    'edge_function',
    {
      function_name: functionName,
      duration_ms: duration,
      success,
    }
  );
};

// Utility to check if we're in Edge Runtime
export const isEdgeRuntime = () => {
  return typeof EdgeRuntime !== 'undefined';
};

// Utility to safely execute code in Edge Runtime
export const safeEdgeExecution = async <T>(
  operation: () => Promise<T>,
  fallback: T,
  operationName: string
): Promise<T> => {
  try {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    
    trackEdgeFunction(operationName, duration, true);
    return result;
  } catch (error) {
    const duration = Date.now();
    trackEdgeFunction(operationName, duration, false);
    
    captureEdgeError(error instanceof Error ? error : new Error(String(error)), {
      extra: { operation_name: operationName }
    });
    
    return fallback;
  }
};