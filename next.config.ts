import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Experimental features for Next.js 15
  experimental: {
    // Enable Server Components debugging in development
    serverComponentsExternalPackages: ['appwrite', 'node-appwrite'],
  },

  // Image configuration for Appwrite Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cloud.appwrite.io',
        port: '',
        pathname: '/v1/storage/buckets/*/files/*/view',
      },
      // Add patterns for other image sources if needed
      {
        protocol: 'https',
        hostname: '**.appwrite.global',
        port: '',
        pathname: '/v1/storage/buckets/*/files/*/view',
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=self',
          },
        ],
      },
    ];
  },

  // Environment-specific redirects
  async redirects() {
    // Redirect maintenance mode if enabled
    if (process.env.MAINTENANCE_MODE === 'true') {
      return [
        {
          source: '/((?!maintenance|api|_next|static).*)',
          destination: '/maintenance',
          permanent: false,
        },
      ];
    }
    return [];
  },

  // Webpack configuration for better builds
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size in production
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        appwrite: {
          name: 'appwrite',
          chunks: 'all',
          test: /[\\/]node_modules[\\/](appwrite|node-appwrite)[\\/]/,
        },
        sentry: {
          name: 'sentry',
          chunks: 'all',
          test: /[\\/]node_modules[\\/]@sentry[\\/]/,
        },
      };
    }

    return config;
  },

  // TypeScript configuration
  typescript: {
    // Disable type checking during builds for faster CI/CD
    // Type checking should be done separately in the pipeline
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  // ESLint configuration
  eslint: {
    // Only run ESLint on these directories
    dirs: ['pages', 'components', 'lib', 'app'],
    // Don't fail builds on ESLint errors in production
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  // Enable source maps in production for better debugging
  productionBrowserSourceMaps: true,

  // API routes configuration
  async rewrites() {
    return [
      // Proxy API routes for better organization
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ];
  },

  // Environment variables to expose to the client
  env: {
    CUSTOM_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
  },
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only upload source maps in production
  silent: process.env.NODE_ENV !== 'development',
  
  // Upload source maps during build
  widenClientFileUpload: true,
  
  // Automatically tree-shake Sentry logger statements
  hideSourceMaps: true,
  
  // Disable source map upload in development
  disableLogger: process.env.NODE_ENV === 'development',
  
  // Route browser requests to Sentry through a Next.js rewrite
  tunnelRoute: "/monitoring",
  
  // Hides source maps from generated client bundles
  hideSourceMaps: true,
  
  // Automatically tree-shake Sentry logger statements
  disableLogger: true,
  
  // Enable automatic Instrumentation.js creation
  automaticVercelMonitors: true,
};

// Only wrap with Sentry in production or when SENTRY_DSN is provided
const shouldUseSentry = process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test';

export default shouldUseSentry 
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
