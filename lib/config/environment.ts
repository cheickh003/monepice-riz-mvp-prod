/**
 * Environment Configuration for MonEpice&Riz
 * 
 * This module provides centralized environment variable validation and configuration
 * for all services used in the application. It ensures type safety and provides
 * helpful error messages when required variables are missing or invalid.
 * 
 * Features:
 * - Service-specific validation with custom refinements
 * - Format validation for URLs, API keys, phone numbers
 * - Helpful error messages for troubleshooting
 * - Environment-specific configuration handling
 * 
 * @fileoverview Environment configuration and validation with enhanced validation rules
 */

import { z } from 'zod'

/**
 * Custom Zod validation refinements for service-specific formats
 */

// Appwrite endpoint validation - must be valid Appwrite cloud URL
const appwriteEndpointSchema = z.string().url().refine(
  (url) => {
    return url.includes('appwrite.io') || url.includes('localhost') || url.includes('127.0.0.1');
  },
  {
    message: "Appwrite endpoint must be a valid Appwrite Cloud URL (https://cloud.appwrite.io/v1) or local development endpoint",
  }
);

// Appwrite project ID validation - alphanumeric with dashes/underscores
const appwriteProjectIdSchema = z.string().min(1).refine(
  (id) => /^[a-zA-Z0-9_-]+$/.test(id),
  {
    message: "Appwrite project ID must contain only letters, numbers, dashes, and underscores",
  }
);

// Appwrite API key validation - specific format
const appwriteApiKeySchema = z.string().optional().refine(
  (key) => !key || key.length >= 32,
  {
    message: "Appwrite API key must be at least 32 characters long",
  }
);

// CinetPay API key validation - follows CinetPay format
const cinetpayApiKeySchema = z.string().min(1).refine(
  (key) => {
    // CinetPay API keys typically start with certain prefixes and have specific length
    return key.length >= 16 && /^[A-Za-z0-9_-]+$/.test(key);
  },
  {
    message: "CinetPay API key must be at least 16 characters and contain only alphanumeric characters, dashes, and underscores",
  }
);

// CinetPay Site ID validation - numeric format
const cinetpaySiteIdSchema = z.string().min(1).refine(
  (siteId) => /^\d+$/.test(siteId),
  {
    message: "CinetPay Site ID must be a numeric string (e.g., '123456')",
  }
);

// CinetPay Secret Key validation - secure key format
const cinetpaySecretKeySchema = z.string().min(1).refine(
  (key) => key.length >= 32,
  {
    message: "CinetPay Secret Key must be at least 32 characters long for security",
  }
);

// Sentry DSN validation - specific Sentry format
const sentryDsnSchema = z.string().url().refine(
  (dsn) => {
    const sentryDsnPattern = /^https:\/\/[a-f0-9]+@[a-zA-Z0-9.-]+\.ingest\.sentry\.io\/\d+$/;
    return sentryDsnPattern.test(dsn);
  },
  {
    message: "Sentry DSN must be in the format: https://{key}@{org}.ingest.sentry.io/{project-id}",
  }
);

// Sentry organization slug validation
const sentryOrgSchema = z.string().optional().refine(
  (org) => !org || /^[a-z0-9-]+$/.test(org),
  {
    message: "Sentry organization must contain only lowercase letters, numbers, and dashes",
  }
);

// Sentry auth token validation - specific token format
const sentryAuthTokenSchema = z.string().optional().refine(
  (token) => !token || (token.startsWith('sntrys_') && token.length >= 64),
  {
    message: "Sentry auth token must start with 'sntrys_' and be at least 64 characters long",
  }
);

// Phone number validation for Côte d'Ivoire
const ivoryCoastPhoneSchema = z.string().refine(
  (phone) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check for valid Ivorian phone number formats
    // Format 1: +225XXXXXXXX (10 digits after country code)
    // Format 2: 0XXXXXXXXX (10 digits starting with 0)
    // Format 3: XXXXXXXXXX (10 digits without prefix)
    
    if (cleaned.startsWith('225')) {
      return cleaned.length === 13; // 225 + 10 digits
    } else if (cleaned.startsWith('0')) {
      return cleaned.length === 10; // 0 + 9 digits
    } else {
      return cleaned.length === 10 || cleaned.length === 8; // 10 digits or 8 digits (old format)
    }
  },
  {
    message: "Phone number must be a valid Côte d'Ivoire format: +225XXXXXXXX, 0XXXXXXXXX, or XXXXXXXXXX",
  }
);

// Email validation with domain restrictions for business emails
const businessEmailSchema = z.string().email().refine(
  (email) => {
    const domain = email.split('@')[1];
    // Allow common business domains and the project domain
    const allowedDomains = ['monepiceriz.ci', 'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com'];
    const businessDomainPattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    return allowedDomains.includes(domain) || businessDomainPattern.test(domain);
  },
  {
    message: "Email must be from a valid business domain or common email provider",
  }
);

// Google Maps API key validation
const googleMapsApiKeySchema = z.string().optional().refine(
  (key) => !key || (key.startsWith('AIza') && key.length === 39),
  {
    message: "Google Maps API key must start with 'AIza' and be exactly 39 characters long",
  }
);

// Redis URL validation with connection string format
const redisUrlSchema = z.string().optional().refine(
  (url) => !url || url.startsWith('redis://') || url.startsWith('rediss://'),
  {
    message: "Redis URL must start with 'redis://' or 'rediss://' (for SSL)",
  }
);

// Encryption key validation - secure length
const encryptionKeySchema = z.string().optional().refine(
  (key) => !key || key.length >= 32,
  {
    message: "Encryption key must be at least 32 characters long for security",
  }
);

// JWT secret validation - secure format
const jwtSecretSchema = z.string().optional().refine(
  (secret) => !secret || secret.length >= 32,
  {
    message: "JWT secret must be at least 32 characters long for security",
  }
);

// URL validation with HTTPS requirement for production
const secureUrlSchema = (isProduction: boolean) => z.string().url().refine(
  (url) => {
    if (isProduction) {
      return url.startsWith('https://');
    }
    return url.startsWith('http://') || url.startsWith('https://');
  },
  {
    message: isProduction 
      ? "URLs must use HTTPS in production environment"
      : "URL must be a valid HTTP or HTTPS URL",
  }
);

/**
 * Environment validation schema using Zod with enhanced service-specific validation
 * This ensures all required environment variables are present and in the correct format
 */
const createEnvironmentSchema = () => {
  // We need to determine if we're in production for URL validation
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production';
  const isProduction = nodeEnv === 'production';

  return z.object({
    // Application settings
    app: z.object({
      name: z.string().default('MonEpice&Riz'),
      url: secureUrlSchema(isProduction),
      nodeEnv: z.enum(['development', 'staging', 'production']).default('development'),
    }),

    // Appwrite configuration with enhanced validation
    appwrite: z.object({
      endpoint: appwriteEndpointSchema,
      projectId: appwriteProjectIdSchema,
      databaseId: z.string().optional(),
      storageId: z.string().optional(),
      apiKey: appwriteApiKeySchema, // Server-side only
    }),

    // CinetPay configuration with format validation
    cinetpay: z.object({
      apiKey: cinetpayApiKeySchema,
      siteId: cinetpaySiteIdSchema,
      secretKey: cinetpaySecretKeySchema,
      notifyUrl: secureUrlSchema(isProduction),
      returnUrl: secureUrlSchema(isProduction),
      cancelUrl: secureUrlSchema(isProduction),
      // Production credentials (optional for development, required for production)
      prodApiKey: isProduction ? cinetpayApiKeySchema : z.string().optional(),
      prodSiteId: isProduction ? cinetpaySiteIdSchema : z.string().optional(),
      prodSecretKey: isProduction ? cinetpaySecretKeySchema : z.string().optional(),
    }),

    // Sentry configuration with DSN format validation
    sentry: z.object({
      dsn: sentryDsnSchema,
      org: sentryOrgSchema,
      project: z.string().optional().refine(
        (project) => !project || /^[a-z0-9-]+$/.test(project),
        {
          message: "Sentry project name must contain only lowercase letters, numbers, and dashes",
        }
      ),
      authToken: sentryAuthTokenSchema,
      environment: z.string().default('development'),
      release: z.string().default('1.0.0').refine(
        (release) => /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(release),
        {
          message: "Release version must follow semantic versioning (e.g., '1.0.0' or '1.0.0-beta.1')",
        }
      ),
    }),

    // SMS service configuration with API key validation
    sms: z.object({
      smsproApiKey: z.string().optional().refine(
        (key) => !key || key.length >= 16,
        {
          message: "SMSPro API key must be at least 16 characters long",
        }
      ),
      smsproSenderId: z.string().default('MonEpiceRiz').refine(
        (senderId) => senderId.length <= 11 && /^[A-Za-z0-9]+$/.test(senderId),
        {
          message: "SMS Sender ID must be alphanumeric and max 11 characters",
        }
      ),
      smsproApiUrl: z.string().url().default('https://api.smspro.africa/v1'),
      // Fallback service
      africasTalkingApiKey: z.string().optional().refine(
        (key) => !key || key.length >= 20,
        {
          message: "Africa's Talking API key must be at least 20 characters long",
        }
      ),
      africasTalkingUsername: z.string().optional().refine(
        (username) => !username || /^[a-zA-Z0-9_-]+$/.test(username),
        {
          message: "Africa's Talking username must contain only letters, numbers, dashes, and underscores",
        }
      ),
    }),

    // Email service configuration with validation
    email: z.object({
      resendApiKey: z.string().optional().refine(
        (key) => !key || (key.startsWith('re_') && key.length >= 32),
        {
          message: "Resend API key must start with 're_' and be at least 32 characters long",
        }
      ),
      emailFrom: businessEmailSchema.default('noreply@monepiceriz.ci'),
      // Alternative service
      sendgridApiKey: z.string().optional().refine(
        (key) => !key || (key.startsWith('SG.') && key.length >= 32),
        {
          message: "SendGrid API key must start with 'SG.' and be at least 32 characters long",
        }
      ),
    }),

    // Google Maps configuration with API key validation
    maps: z.object({
      apiKey: googleMapsApiKeySchema,
    }),

    // Redis configuration with connection validation
    redis: z.object({
      url: redisUrlSchema,
      token: z.string().optional().refine(
        (token) => !token || token.length >= 16,
        {
          message: "Redis token must be at least 16 characters long",
        }
      ),
    }),

    // Analytics configuration with key validation
    analytics: z.object({
      vercelAnalyticsId: z.string().optional().refine(
        (id) => !id || /^[a-zA-Z0-9-_]+$/.test(id),
        {
          message: "Vercel Analytics ID must contain only letters, numbers, dashes, and underscores",
        }
      ),
      posthogKey: z.string().optional().refine(
        (key) => !key || (key.startsWith('phc_') && key.length >= 32),
        {
          message: "PostHog key must start with 'phc_' and be at least 32 characters long",
        }
      ),
      posthogHost: z.string().url().default('https://app.posthog.com'),
    }),

    // Security configuration with enhanced validation
    security: z.object({
      encryptionKey: encryptionKeySchema,
      nextauthSecret: z.string().optional().refine(
        (secret) => !secret || secret.length >= 32,
        {
          message: "NextAuth secret must be at least 32 characters long for security",
        }
      ),
      nextauthUrl: z.string().url().optional(),
      jwtSecret: jwtSecretSchema,
    }),

    // Feature flags with validation
    features: z.object({
      enableSms: z.boolean().default(true),
      enableEmail: z.boolean().default(true),
      enableAnalytics: z.boolean().default(true),
      enablePayments: z.boolean().default(true),
      maintenanceMode: z.boolean().default(false),
    }),

    // Store configuration with phone number validation
    store: z.object({
      defaultStore: z.enum(['COCODY', 'KOUMASSI']).default('COCODY'),
      deliveryRadiusKm: z.number().min(1).max(50).default(15).refine(
        (radius) => radius > 0,
        {
          message: "Delivery radius must be a positive number",
        }
      ),
      minOrderAmount: z.number().min(500).default(2000).refine(
        (amount) => amount >= 500,
        {
          message: "Minimum order amount must be at least 500 FCFA",
        }
      ),
      cododYPhone: ivoryCoastPhoneSchema.default('0161888888'),
      koumassIPhone: ivoryCoastPhoneSchema.default('0172089090'),
    }),

    // Development settings with reasonable limits
    development: z.object({
      rateLimitMax: z.number().min(1).max(10000).default(100),
      rateLimitWindow: z.number().min(1000).max(3600000).default(60000), // 1 second to 1 hour
      debug: z.boolean().default(false),
      verboseLogging: z.boolean().default(false),
    }),
  });
};

/**
 * Extract environment variables from process.env
 */
const extractEnvironmentVariables = () => {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production'
  
  return {
    app: {
      name: process.env.NEXT_PUBLIC_APP_NAME,
      url: process.env.NEXT_PUBLIC_APP_URL,
      nodeEnv,
    },
    appwrite: {
      endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
      projectId: getProjectIdForEnvironment(nodeEnv),
      databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      storageId: process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID,
      apiKey: process.env.APPWRITE_API_KEY,
    },
    cinetpay: {
      apiKey: process.env.CINETPAY_API_KEY,
      siteId: process.env.CINETPAY_SITE_ID,
      secretKey: process.env.CINETPAY_SECRET_KEY,
      notifyUrl: process.env.CINETPAY_NOTIFY_URL,
      returnUrl: process.env.CINETPAY_RETURN_URL,
      cancelUrl: process.env.CINETPAY_CANCEL_URL,
      prodApiKey: process.env.CINETPAY_PROD_API_KEY,
      prodSiteId: process.env.CINETPAY_PROD_SITE_ID,
      prodSecretKey: process.env.CINETPAY_PROD_SECRET_KEY,
    },
    sentry: {
      dsn: process.env.SENTRY_DSN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      environment: process.env.SENTRY_ENVIRONMENT,
      release: process.env.SENTRY_RELEASE,
    },
    sms: {
      smsproApiKey: process.env.SMSPRO_API_KEY,
      smsproSenderId: process.env.SMSPRO_SENDER_ID,
      smsproApiUrl: process.env.SMSPRO_API_URL,
      africasTalkingApiKey: process.env.AFRICASTALKING_API_KEY,
      africasTalkingUsername: process.env.AFRICASTALKING_USERNAME,
    },
    email: {
      resendApiKey: process.env.RESEND_API_KEY,
      emailFrom: process.env.EMAIL_FROM,
      sendgridApiKey: process.env.SENDGRID_API_KEY,
    },
    maps: {
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
    redis: {
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    },
    analytics: {
      vercelAnalyticsId: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID,
      posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    },
    security: {
      encryptionKey: process.env.ENCRYPTION_KEY,
      nextauthSecret: process.env.NEXTAUTH_SECRET,
      nextauthUrl: process.env.NEXTAUTH_URL,
      jwtSecret: process.env.JWT_SECRET,
    },
    features: {
      enableSms: process.env.ENABLE_SMS === 'true',
      enableEmail: process.env.ENABLE_EMAIL === 'true',
      enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
      enablePayments: process.env.ENABLE_PAYMENTS === 'true',
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
    },
    store: {
      defaultStore: process.env.DEFAULT_STORE as 'COCODY' | 'KOUMASSI',
      deliveryRadiusKm: parseInt(process.env.DELIVERY_RADIUS_KM || '15'),
      minOrderAmount: parseInt(process.env.MIN_ORDER_AMOUNT || '2000'),
      cododYPhone: process.env.STORE_COCODY_PHONE,
      koumassIPhone: process.env.STORE_KOUMASSI_PHONE,
    },
    development: {
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
      debug: process.env.DEBUG === 'true',
      verboseLogging: process.env.VERBOSE_LOGGING === 'true',
    },
  }
}

/**
 * Get the appropriate Appwrite project ID based on environment
 */
function getProjectIdForEnvironment(nodeEnv: string): string | undefined {
  switch (nodeEnv) {
    case 'production':
      return process.env.NEXT_PUBLIC_APPWRITE_PROJECT_PRODUCTION || process.env.NEXT_PUBLIC_APPWRITE_PROJECT
    case 'staging':
      return process.env.NEXT_PUBLIC_APPWRITE_PROJECT_STAGING || process.env.NEXT_PUBLIC_APPWRITE_PROJECT
    default:
      return process.env.NEXT_PUBLIC_APPWRITE_PROJECT
  }
}

/**
 * Validate and parse environment variables with enhanced error reporting
 */
function validateEnvironment() {
  try {
    const rawEnv = extractEnvironmentVariables()
    const environmentSchema = createEnvironmentSchema()
    return environmentSchema.parse(rawEnv)
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Group errors by service for better readability
      const errorsByService: Record<string, string[]> = {}
      
      error.errors.forEach(err => {
        const serviceName = err.path[0] as string
        const fieldPath = err.path.slice(1).join('.')
        const fullPath = err.path.join('.')
        
        if (!errorsByService[serviceName]) {
          errorsByService[serviceName] = []
        }
        
        // Add helpful context for common errors
        let message = err.message
        
        // Add suggestions for common issues
        if (err.code === 'invalid_string' && fullPath.includes('url')) {
          message += ' (Ensure URL includes protocol: http:// or https://)'
        } else if (err.code === 'too_small' && fullPath.includes('apiKey')) {
          message += ' (Check the API key in your service dashboard)'
        } else if (err.code === 'invalid_enum_value') {
          message += ` (Valid options: ${(err as any).options?.join(', ') || 'check documentation'})`
        }
        
        errorsByService[serviceName].push(`    • ${fieldPath || serviceName}: ${message}`)
      })

      // Build formatted error message by service
      const serviceErrors = Object.entries(errorsByService)
        .map(([service, errors]) => {
          const serviceNames: Record<string, string> = {
            app: 'Application Settings',
            appwrite: 'Appwrite Configuration',
            cinetpay: 'CinetPay Payment Gateway',
            sentry: 'Sentry Monitoring',
            sms: 'SMS Service',
            email: 'Email Service',
            maps: 'Google Maps',
            redis: 'Redis Cache',
            analytics: 'Analytics Services',
            security: 'Security Configuration',
            features: 'Feature Flags',
            store: 'Store Configuration',
            development: 'Development Settings'
          }
          
          return `  🔧 ${serviceNames[service] || service}:\n${errors.join('\n')}`
        })
        .join('\n\n')

      // Provide specific guidance based on environment
      const nodeEnv = process.env.NODE_ENV || 'development'
      let environmentGuidance = ''
      
      if (nodeEnv === 'production') {
        environmentGuidance = '⚠️  Production environment detected - all security-related variables are required.\n'
      } else if (nodeEnv === 'staging') {
        environmentGuidance = '🧪 Staging environment detected - ensure production-like configuration.\n'
      } else {
        environmentGuidance = '🛠️  Development environment detected - some services are optional.\n'
      }

      throw new Error(
        `❌ Environment Configuration Validation Failed\n\n` +
        environmentGuidance +
        `\n${serviceErrors}\n\n` +
        '📋 Steps to resolve:\n' +
        '  1. Check your .env.local file exists and is properly formatted\n' +
        '  2. Verify all required variables are set with correct values\n' +
        '  3. Ensure API keys and secrets match the expected format\n' +
        '  4. For production, verify all security-related variables are set\n\n' +
        '📄 References:\n' +
        '  • Environment template: .env.example\n' +
        '  • Setup guide: docs/setup/ENVIRONMENT_SETUP.md\n' +
        '  • Service-specific guides: docs/setup/\n\n' +
        `Current environment: ${nodeEnv}`
      )
    }
    throw error
  }
}

/**
 * Validate specific service configuration
 * Useful for debugging individual services
 */
export const validateServiceConfig = (serviceName: keyof Environment) => {
  try {
    const rawEnv = extractEnvironmentVariables()
    const environmentSchema = createEnvironmentSchema()
    const fullConfig = environmentSchema.parse(rawEnv)
    return { success: true, config: fullConfig[serviceName] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const serviceErrors = error.errors.filter(err => err.path[0] === serviceName)
      return { 
        success: false, 
        errors: serviceErrors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }
    }
    return { success: false, error: error.message }
  }
}

/**
 * Exported environment configuration
 * This is the single source of truth for all environment-dependent settings
 */
export const env = validateEnvironment()

/**
 * Type definitions for the environment configuration
 */
export type Environment = typeof env
export type NodeEnvironment = Environment['app']['nodeEnv']

/**
 * Helper functions for environment checks
 */
export const isDevelopment = () => env.app.nodeEnv === 'development'
export const isStaging = () => env.app.nodeEnv === 'staging'
export const isProduction = () => env.app.nodeEnv === 'production'
export const isServer = () => typeof window === 'undefined'
export const isClient = () => typeof window !== 'undefined'

/**
 * Get the appropriate CinetPay configuration based on environment
 */
export const getCinetPayConfig = () => {
  const isProductionEnv = isProduction()
  
  return {
    apiKey: isProductionEnv ? (env.cinetpay.prodApiKey || env.cinetpay.apiKey) : env.cinetpay.apiKey,
    siteId: isProductionEnv ? (env.cinetpay.prodSiteId || env.cinetpay.siteId) : env.cinetpay.siteId,
    secretKey: isProductionEnv ? (env.cinetpay.prodSecretKey || env.cinetpay.secretKey) : env.cinetpay.secretKey,
    notifyUrl: env.cinetpay.notifyUrl,
    returnUrl: env.cinetpay.returnUrl,
    cancelUrl: env.cinetpay.cancelUrl,
    isProduction: isProductionEnv,
  }
}

/**
 * Runtime environment validation
 * Call this function during application startup to ensure all required variables are present
 */
export const validateRequiredEnvironmentVariables = () => {
  const required = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_APPWRITE_ENDPOINT',
    'NEXT_PUBLIC_APPWRITE_PROJECT',
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missing.map(key => `  • ${key}`).join('\n')}\n\n` +
      '📋 Please check your .env.local file.\n' +
      '📄 See .env.example for reference.'
    )
  }
}

/**
 * Environment-specific logging
 */
export const createLogger = (context: string) => ({
  debug: (...args: any[]) => {
    if (env.development.debug || env.development.verboseLogging) {
      console.debug(`[${context}]`, ...args)
    }
  },
  info: (...args: any[]) => {
    console.info(`[${context}]`, ...args)
  },
  warn: (...args: any[]) => {
    console.warn(`[${context}]`, ...args)
  },
  error: (...args: any[]) => {
    console.error(`[${context}]`, ...args)
  },
})

/**
 * Utility functions for environment validation testing and debugging
 */

/**
 * Test environment variable formats without throwing errors
 * Useful for development and debugging
 */
export const testEnvironmentVariables = () => {
  const results: Record<string, { valid: boolean; errors?: string[] }> = {}
  
  const services = [
    'app', 'appwrite', 'cinetpay', 'sentry', 'sms', 
    'email', 'maps', 'redis', 'analytics', 'security', 
    'features', 'store', 'development'
  ] as const
  
  services.forEach(service => {
    const result = validateServiceConfig(service)
    results[service] = {
      valid: result.success,
      errors: result.success ? undefined : result.errors?.map(e => e.message)
    }
  })
  
  return results
}

/**
 * Generate example environment variables based on current schema validation
 * Useful for creating .env.example or troubleshooting configurations
 */
export const generateExampleEnvVars = () => {
  const examples = {
    // Application
    'NEXT_PUBLIC_APP_NAME': 'MonEpice&Riz',
    'NEXT_PUBLIC_APP_URL': 'https://monepiceriz.ci',
    'NODE_ENV': 'production',
    
    // Appwrite
    'NEXT_PUBLIC_APPWRITE_ENDPOINT': 'https://cloud.appwrite.io/v1',
    'NEXT_PUBLIC_APPWRITE_PROJECT': 'monepiceriz-prod-abc123',
    'APPWRITE_API_KEY': 'your-server-api-key-32-chars-min',
    
    // CinetPay
    'CINETPAY_API_KEY': 'your-cinetpay-api-key-16-chars-min',
    'CINETPAY_SITE_ID': '123456',
    'CINETPAY_SECRET_KEY': 'your-secret-key-must-be-32-chars-min',
    'CINETPAY_NOTIFY_URL': 'https://monepiceriz.ci/api/webhooks/cinetpay',
    'CINETPAY_RETURN_URL': 'https://monepiceriz.ci/checkout/success',
    'CINETPAY_CANCEL_URL': 'https://monepiceriz.ci/checkout/cancel',
    
    // Sentry
    'SENTRY_DSN': 'https://abc123@org.ingest.sentry.io/123456',
    'SENTRY_ORG': 'monepiceriz',
    'SENTRY_PROJECT': 'monepiceriz-web',
    'SENTRY_AUTH_TOKEN': 'sntrys_your-64-char-auth-token-here',
    'SENTRY_ENVIRONMENT': 'production',
    
    // Store phones (Côte d'Ivoire format)
    'STORE_COCODY_PHONE': '+2250161888888',
    'STORE_KOUMASSI_PHONE': '+2250172089090',
    
    // Optional services
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY': 'AIzaSyC4L8FakeExampleKey1234567890abcdef',
    'RESEND_API_KEY': 're_ExampleResendAPIKey1234567890abcdef',
    'SMSPRO_API_KEY': 'smspro-api-key-example',
    
    // Security (production only)
    'ENCRYPTION_KEY': 'your-32-character-encryption-key',
    'JWT_SECRET': 'your-32-character-jwt-secret-key',
  }
  
  return examples
}

/**
 * Display current environment configuration summary (without sensitive data)
 * Useful for debugging and monitoring
 */
export const getEnvironmentSummary = () => {
  try {
    const summary = {
      environment: env.app.nodeEnv,
      appUrl: env.app.url,
      timestamp: new Date().toISOString(),
      services: {
        appwrite: {
          configured: !!env.appwrite.endpoint && !!env.appwrite.projectId,
          endpoint: env.appwrite.endpoint,
          projectId: env.appwrite.projectId,
          hasServerKey: !!env.appwrite.apiKey,
        },
        cinetpay: {
          configured: !!env.cinetpay.apiKey && !!env.cinetpay.siteId,
          hasProductionKeys: !!env.cinetpay.prodApiKey,
          webhooksConfigured: !!env.cinetpay.notifyUrl,
        },
        sentry: {
          configured: !!env.sentry.dsn,
          environment: env.sentry.environment,
          org: env.sentry.org,
          project: env.sentry.project,
          hasAuthToken: !!env.sentry.authToken,
        },
        features: env.features,
        stores: {
          default: env.store.defaultStore,
          deliveryRadius: env.store.deliveryRadiusKm,
          minOrder: env.store.minOrderAmount,
          phonesConfigured: {
            cocody: !!env.store.cododYPhone,
            koumassi: !!env.store.koumassIPhone,
          }
        },
        optional: {
          sms: !!env.sms.smsproApiKey || !!env.sms.africasTalkingApiKey,
          email: !!env.email.resendApiKey || !!env.email.sendgridApiKey,
          maps: !!env.maps.apiKey,
          redis: !!env.redis.url,
          analytics: !!env.analytics.vercelAnalyticsId || !!env.analytics.posthogKey,
        }
      }
    }
    
    return { success: true, summary }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Validate specific environment variable format
 * Useful for testing individual variables during development
 */
export const validateSingleVariable = (
  serviceName: string, 
  fieldName: string, 
  value: string
): { valid: boolean; error?: string; suggestions?: string[] } => {
  const suggestions: string[] = []
  
  try {
    // Create a test environment with only the variable we want to test
    const testEnv = {
      [serviceName]: {
        [fieldName]: value
      }
    }
    
    // Create schema and validate just this field
    const schema = createEnvironmentSchema()
    const serviceSchema = schema.shape[serviceName as keyof typeof schema.shape]
    
    if (serviceSchema && typeof serviceSchema === 'object' && 'shape' in serviceSchema) {
      const fieldSchema = (serviceSchema as any).shape[fieldName]
      if (fieldSchema) {
        fieldSchema.parse(value)
        return { valid: true }
      }
    }
    
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors[0]?.message || 'Invalid format'
      
      // Add specific suggestions based on the service and field
      if (serviceName === 'appwrite' && fieldName === 'endpoint') {
        suggestions.push('Use https://cloud.appwrite.io/v1 for Appwrite Cloud')
        suggestions.push('For self-hosted: https://your-domain.com/v1')
      } else if (serviceName === 'cinetpay' && fieldName === 'siteId') {
        suggestions.push('Site ID should be numeric (e.g., "123456")')
        suggestions.push('Find it in your CinetPay dashboard under API settings')
      } else if (serviceName === 'sentry' && fieldName === 'dsn') {
        suggestions.push('Format: https://key@org.ingest.sentry.io/project-id')
        suggestions.push('Find it in your Sentry project settings under DSN')
      } else if (fieldName.includes('phone')) {
        suggestions.push('Use Côte d\'Ivoire format: +225XXXXXXXX')
        suggestions.push('Or local format: 0XXXXXXXXX')
      } else if (fieldName.includes('url')) {
        suggestions.push('Include protocol: https:// or http://')
        suggestions.push('Ensure URL is accessible from the application')
      }
      
      return { 
        valid: false, 
        error: errorMessage,
        suggestions: suggestions.length > 0 ? suggestions : undefined
      }
    }
    
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Unknown validation error' 
    }
  }
}

/**
 * Health check for all configured services
 * Returns which services are properly configured
 */
export const performEnvironmentHealthCheck = () => {
  const healthCheck = {
    overall: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    timestamp: new Date().toISOString(),
    environment: env.app.nodeEnv,
    services: {} as Record<string, {
      status: 'ok' | 'warning' | 'error',
      message: string,
      details?: string[]
    }>
  }
  
  let errorCount = 0
  let warningCount = 0
  
  // Check core services
  if (env.appwrite.endpoint && env.appwrite.projectId) {
    healthCheck.services.appwrite = {
      status: env.appwrite.apiKey ? 'ok' : 'warning',
      message: env.appwrite.apiKey 
        ? 'Appwrite fully configured' 
        : 'Appwrite configured but missing server API key',
      details: env.appwrite.apiKey ? undefined : ['Server API key recommended for full functionality']
    }
    if (!env.appwrite.apiKey) warningCount++
  } else {
    healthCheck.services.appwrite = {
      status: 'error',
      message: 'Appwrite not properly configured',
      details: [
        !env.appwrite.endpoint && 'Missing endpoint',
        !env.appwrite.projectId && 'Missing project ID'
      ].filter(Boolean) as string[]
    }
    errorCount++
  }
  
  // Check CinetPay
  if (env.cinetpay.apiKey && env.cinetpay.siteId && env.cinetpay.secretKey) {
    const hasProductionKeys = isProduction() && env.cinetpay.prodApiKey
    healthCheck.services.cinetpay = {
      status: (isProduction() && !hasProductionKeys) ? 'warning' : 'ok',
      message: isProduction() && !hasProductionKeys 
        ? 'CinetPay configured but using sandbox keys in production'
        : 'CinetPay properly configured',
      details: (isProduction() && !hasProductionKeys) 
        ? ['Production environment should use production CinetPay keys']
        : undefined
    }
    if (isProduction() && !hasProductionKeys) warningCount++
  } else {
    healthCheck.services.cinetpay = {
      status: 'error',
      message: 'CinetPay not properly configured',
      details: [
        !env.cinetpay.apiKey && 'Missing API key',
        !env.cinetpay.siteId && 'Missing site ID',
        !env.cinetpay.secretKey && 'Missing secret key'
      ].filter(Boolean) as string[]
    }
    errorCount++
  }
  
  // Check Sentry
  if (env.sentry.dsn) {
    healthCheck.services.sentry = {
      status: 'ok',
      message: 'Sentry monitoring configured'
    }
  } else {
    healthCheck.services.sentry = {
      status: 'warning',
      message: 'Sentry not configured - monitoring disabled',
      details: ['Error tracking and performance monitoring will not be available']
    }
    warningCount++
  }
  
  // Determine overall health
  if (errorCount > 0) {
    healthCheck.overall = 'unhealthy'
  } else if (warningCount > 0) {
    healthCheck.overall = 'degraded'
  } else {
    healthCheck.overall = 'healthy'
  }
  
  return healthCheck
}

// Validate environment on module load (only in Node.js environment)
if (isServer()) {
  validateRequiredEnvironmentVariables()
}