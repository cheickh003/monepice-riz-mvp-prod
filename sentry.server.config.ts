/**
 * Sentry Server-Side Configuration for MonEpice&Riz
 * 
 * This file configures Sentry for server-side error tracking in API routes,
 * Server Components, and server-side rendering. It captures server errors,
 * API performance, and database connection issues.
 * 
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/config/environment";

// Only initialize Sentry if DSN is provided and we're on the server
if (env.sentry.dsn && typeof window === 'undefined') {
  Sentry.init({
    // Data Source Name
    dsn: env.sentry.dsn,

    // Environment
    environment: env.sentry.environment,

    // Release version
    release: env.sentry.release,

    // Debug mode for development
    debug: env.app.nodeEnv === 'development',

    // Server-specific integrations
    integrations: [
      // HTTP request tracing for API routes
      Sentry.httpIntegration({
        tracing: {
          // Don't trace health check endpoints
          ignoreIncomingRequests: (url) => {
            return url.includes('/api/health') || 
                   url.includes('/api/monitoring') ||
                   url.includes('/_next/') ||
                   url.includes('/favicon.ico');
          },
          // Don't trace outgoing requests to these services in development
          ignoreOutgoingRequests: (url) => {
            if (env.app.nodeEnv === 'development') {
              return url.includes('localhost') || url.includes('127.0.0.1');
            }
            return false;
          },
        },
      }),

      // Node.js profiling
      Sentry.nodeProfilingIntegration(),

      // Capture console errors and warnings
      Sentry.consoleIntegration({
        levels: ['error', 'warn'],
      }),

      // Enhanced context for Node.js
      Sentry.contextLinesIntegration(),
    ],

    // Performance monitoring sample rates
    tracesSampleRate: env.app.nodeEnv === 'production' ? 0.1 : 1.0,
    
    // Profiling sample rate
    profilesSampleRate: env.app.nodeEnv === 'production' ? 0.05 : 0.5,

    // Custom error filtering for server-side
    beforeSend(event, hint) {
      // Don't send events in development unless debugging is enabled
      if (env.app.nodeEnv === 'development' && !env.development.debug) {
        return null;
      }

      // Filter out expected API errors
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error) {
          // Don't report validation errors (4xx status codes)
          if (error.message.includes('400') || 
              error.message.includes('401') || 
              error.message.includes('403') || 
              error.message.includes('404')) {
            return null;
          }

          // Don't report rate limiting errors
          if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
            return null;
          }

          // Don't report client disconnections
          if (error.message.includes('ECONNRESET') || 
              error.message.includes('Client disconnected')) {
            return null;
          }
        }
      }

      // Remove sensitive data from request context
      if (event.request) {
        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
          delete event.request.headers['x-api-key'];
          delete event.request.headers['x-appwrite-key'];
        }

        // Remove sensitive query parameters
        if (event.request.query_string) {
          const sensitiveParams = ['token', 'api_key', 'secret', 'password'];
          for (const param of sensitiveParams) {
            event.request.query_string = event.request.query_string.replace(
              new RegExp(`${param}=[^&]*`, 'gi'),
              `${param}=[Filtered]`
            );
          }
        }

        // Remove sensitive form data
        if (event.request.data && typeof event.request.data === 'object') {
          const sensitiveFields = ['password', 'token', 'api_key', 'apiKey', 'secret', 'phone'];
          for (const field of sensitiveFields) {
            if (event.request.data[field]) {
              event.request.data[field] = '[Filtered]';
            }
          }
        }
      }

      // Add server context
      if (event.contexts) {
        event.contexts.server = {
          name: 'monepiceriz-api',
          version: env.sentry.release,
          node_version: process.version,
        };
      }

      return event;
    },

    // Set initial scope with server context
    initialScope: {
      tags: {
        component: 'server',
        environment: env.app.nodeEnv,
        node_version: process.version,
      },
      contexts: {
        app: {
          name: env.app.name,
          version: env.sentry.release,
        },
        runtime: {
          name: 'node',
          version: process.version,
        },
        os: {
          name: process.platform,
          version: process.version,
        },
      },
    },

    // Ignore certain server-side errors
    ignoreErrors: [
      // Expected validation errors
      'ValidationError',
      'ZodError',
      
      // Network timeouts
      'ETIMEDOUT',
      'ECONNRESET',
      'ENOTFOUND',
      'EHOSTUNREACH',
      
      // Client disconnections
      'Error: aborted',
      'ClientClosedError',
      
      // Rate limiting
      'TooManyRequestsError',
      
      // File system errors in development
      'ENOENT',
      'EMFILE',
      
      // Next.js specific errors that are handled
      'NEXT_NOT_FOUND',
      'NEXT_REDIRECT',
    ],

    // Breadcrumb configuration
    maxBreadcrumbs: 100,

    // Capture unhandled exceptions and rejections
    captureUnhandledRejections: true,
    captureUnhandledException: true,

    // Server request sampling
    beforeSendTransaction(event) {
      // Don't sample health check and monitoring endpoints
      if (event.transaction?.includes('/api/health') || 
          event.transaction?.includes('/api/monitoring')) {
        return null;
      }
      return event;
    },

    // Enhanced release health tracking
    autoSessionTracking: true,
    
    // Enable request data capture
    sendDefaultPii: false, // We handle PII filtering manually
  });

  // Set server-specific context
  Sentry.setContext('server_config', {
    stores: {
      cocody_phone: env.store.cododYPhone,
      koumassi_phone: env.store.koumassIPhone,
    },
    features: {
      payments_enabled: env.features.enablePayments,
      sms_enabled: env.features.enableSms,
      email_enabled: env.features.enableEmail,
      maintenance_mode: env.features.maintenanceMode,
    },
    limits: {
      delivery_radius_km: env.store.deliveryRadiusKm,
      min_order_amount: env.store.minOrderAmount,
      rate_limit_max: env.development.rateLimitMax,
    },
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    Sentry.captureException(error);
    // Don't exit the process in development
    if (env.app.nodeEnv === 'production') {
      process.exit(1);
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    Sentry.captureException(new Error(`Unhandled Rejection: ${reason}`));
  });
}

// Export utility functions for server-side use
export const captureAPIError = (
  error: Error, 
  request: { method?: string; url?: string; body?: any },
  context?: Record<string, any>
) => {
  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'api_error');
    scope.setContext('request', {
      method: request.method,
      url: request.url,
      // Don't include body in production for security
      ...(env.app.nodeEnv !== 'production' && { body: request.body }),
    });
    
    if (context) {
      scope.setContext('additional_context', context);
    }
    
    Sentry.captureException(error);
  });
};

export const captureServerMessage = (
  message: string, 
  level: 'info' | 'warning' | 'error' = 'info',
  extra?: Record<string, any>
) => {
  Sentry.withScope((scope) => {
    if (extra) {
      scope.setExtra('details', extra);
    }
    Sentry.captureMessage(message, level);
  });
};

export const trackDatabaseOperation = (
  operation: string,
  collection: string,
  duration: number,
  success: boolean
) => {
  Sentry.addBreadcrumb({
    category: 'database',
    message: `${operation} on ${collection}`,
    level: success ? 'info' : 'error',
    data: {
      operation,
      collection,
      duration_ms: duration,
      success,
    },
  });
};

export const trackExternalAPICall = (
  service: string,
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number
) => {
  Sentry.addBreadcrumb({
    category: 'http',
    message: `${method} ${service}${endpoint}`,
    level: statusCode >= 400 ? 'error' : 'info',
    data: {
      service,
      endpoint,
      method,
      duration_ms: duration,
      status_code: statusCode,
    },
  });
};

export const startServerTransaction = (name: string, op: string, data?: Record<string, any>) => {
  const transaction = Sentry.startTransaction({
    name,
    op,
    data,
  });
  
  return transaction;
};