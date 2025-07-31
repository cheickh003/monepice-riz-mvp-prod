/**
 * Sentry Client-Side Configuration for MonEpice&Riz
 * 
 * This file configures Sentry for browser error tracking and performance monitoring.
 * It runs in the browser environment and captures client-side errors, performance
 * data, and user interactions.
 * 
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from "@sentry/nextjs";
import { env } from "@/lib/config/environment";

// Only initialize Sentry if DSN is provided and not in test environment
if (env.sentry.dsn && typeof window !== 'undefined') {
  Sentry.init({
    // Data Source Name - unique identifier for this project in Sentry
    dsn: env.sentry.dsn,

    // Environment (development, staging, production)
    environment: env.sentry.environment,

    // Release version for tracking deployments
    release: env.sentry.release,

    // Debug mode - enables verbose logging in development
    debug: env.app.nodeEnv === 'development',

    // Integrations for enhanced error tracking and performance monitoring
    integrations: [
      // Browser profiling for performance insights
      Sentry.browserProfilingIntegration(),
      
      // HTTP request tracing
      Sentry.browserTracingIntegration({
        // Trace navigation between pages
        routingInstrumentation: Sentry.nextRouterInstrumentation,
        
        // Don't trace requests to these URLs
        tracingUrlPattern: /^(?!.*\/(api\/monitoring|_next\/static|favicon\.ico)).*$/,
        
        // Custom trace propagation targets
        tracePropagationTargets: [
          'localhost',
          env.app.url,
          /^https:\/\/[^/]*\.vercel\.app/,
        ],
      }),

      // Session replay for debugging user interactions (production only)
      ...(env.app.nodeEnv === 'production' ? [
        Sentry.replayIntegration({
          // Capture session replays for errors
          maskAllText: true,
          blockAllMedia: true,
          // Sample rate for error sessions
          sessionSampleRate: 0.1,
          // Sample rate for normal sessions
          errorSampleRate: 1.0,
        })
      ] : []),

      // Feedback integration for user reports
      Sentry.feedbackIntegration({
        colorScheme: 'light',
        showBranding: false,
        triggerLabel: 'Signaler un problème',
        formTitle: 'Signaler un problème',
        submitButtonLabel: 'Envoyer',
        messageLabel: 'Décrivez le problème',
        nameLabel: 'Nom (optionnel)',
        emailLabel: 'Email (optionnel)',
        isRequiredLabel: '(obligatoire)',
        successMessageText: 'Merci pour votre signalement !',
      }),
    ],

    // Performance monitoring sample rates
    tracesSampleRate: env.app.nodeEnv === 'production' ? 0.1 : 1.0,
    
    // Profiling sample rate (subset of traced transactions)
    profilesSampleRate: env.app.nodeEnv === 'production' ? 0.05 : 0.5,

    // Replays sample rate (only in production)
    replaysSessionSampleRate: env.app.nodeEnv === 'production' ? 0.1 : 0,
    replaysOnErrorSampleRate: env.app.nodeEnv === 'production' ? 1.0 : 0,

    // Custom error filtering
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly enabled
      if (env.app.nodeEnv === 'development' && !env.development.debug) {
        return null;
      }

      // Filter out network errors that are not actionable
      if (event.exception) {
        const error = hint.originalException;
        if (error instanceof Error) {
          // Don't report network timeout errors
          if (error.message.includes('Network request failed') || 
              error.message.includes('fetch')) {
            return null;
          }
          
          // Don't report script loading errors from browser extensions
          if (error.message.includes('Script error') && 
              event.exception.values?.[0]?.stacktrace?.frames?.length === 0) {
            return null;
          }
        }
      }

      // Remove sensitive data from breadcrumbs and context
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
            // Remove sensitive headers and data
            if (breadcrumb.data) {
              delete breadcrumb.data.authorization;
              delete breadcrumb.data['x-api-key'];
              // Truncate long response bodies
              if (breadcrumb.data.response_body_size && breadcrumb.data.response_body_size > 1000) {
                breadcrumb.data.response_body = '[Truncated]';
              }
            }
          }
          return breadcrumb;
        });
      }

      // Remove sensitive form data
      if (event.request?.data && typeof event.request.data === 'object') {
        const sensitiveFields = ['password', 'token', 'api_key', 'apiKey', 'secret'];
        for (const field of sensitiveFields) {
          if (event.request.data[field]) {
            event.request.data[field] = '[Filtered]';
          }
        }
      }

      return event;
    },

    // Set user context for better error attribution
    initialScope: {
      tags: {
        component: 'client',
        environment: env.app.nodeEnv,
      },
      contexts: {
        app: {
          name: env.app.name,
          version: env.sentry.release,
        },
        browser: {
          // Will be automatically populated by Sentry
        },
      },
    },

    // Ignore certain errors that are not actionable
    ignoreErrors: [
      // Browser extension errors
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded',
      'Script Error',
      
      // Network errors that are expected
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      
      // User cancelled actions
      'AbortError',
      'The user aborted a request',
      
      // Third-party script errors
      /^Error: Loading chunk \d+ failed/,
      /^Error: Loading CSS chunk \d+ failed/,
      
      // Ad blocker and extension related
      'Blocked a frame with origin',
      'SecurityError: Blocked a frame',
    ],

    // Don't capture console logs as breadcrumbs in production
    maxBreadcrumbs: env.app.nodeEnv === 'production' ? 50 : 100,

    // Transport options
    transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),
    
    // Capture unhandled promise rejections
    captureUnhandledRejections: true,
  });

  // Set additional context on initialization
  Sentry.setContext('store', {
    available_stores: ['COCODY', 'KOUMASSI'],
    default_store: env.store.defaultStore,
    delivery_radius: env.store.deliveryRadiusKm,
  });

  // Custom tags for filtering in Sentry
  Sentry.setTag('feature.payments', env.features.enablePayments);
  Sentry.setTag('feature.sms', env.features.enableSms);
  Sentry.setTag('feature.email', env.features.enableEmail);
}

// Export utility functions for use throughout the app
export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('error_context', context);
    }
    Sentry.captureException(error);
  });
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};

export const setUserContext = (user: {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
}) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
    // Don't send sensitive data like phone numbers
  });
};

export const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    timestamp: Date.now() / 1000,
  });
};

export const startTransaction = (name: string, op: string) => {
  return Sentry.startTransaction({
    name,
    op,
  });
};