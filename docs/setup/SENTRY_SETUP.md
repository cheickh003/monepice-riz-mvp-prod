# Sentry Setup Guide - MonEpice&Riz

This guide provides comprehensive instructions for setting up Sentry error monitoring and performance tracking for the MonEpice&Riz e-commerce platform.

## Overview

Sentry provides:
- **Error Monitoring**: Automatic error capture and alerting
- **Performance Monitoring**: Transaction tracing and performance insights
- **Release Health**: Deploy tracking and regression detection
- **User Feedback**: In-app error reporting from users
- **Integrations**: Slack, email, and other notification channels

## Prerequisites

- Sentry account ([sentry.io](https://sentry.io))
- Admin access to create organizations and projects
- Basic understanding of error monitoring concepts

## Account Setup

### 1. Create Sentry Organization

1. **Sign up/Login** to [Sentry](https://sentry.io)

2. **Create Organization**:
   ```
   Organization Name: MonEpice&Riz
   Organization Slug: monepiceriz
   Team: MonEpice&Riz Development Team
   ```

3. **Invite Team Members**:
   - Add developers with appropriate roles
   - Configure notification preferences
   - Set up on-call schedules if needed

### 2. Create Project

1. **Select Platform**: Next.js
2. **Project Configuration**:
   ```
   Project Name: MonEpice&Riz Web
   Team: Default
   Alert Rules: Default (can customize later)
   ```

3. **Note Project Details**:
   - **DSN**: Data Source Name for error reporting
   - **Project ID**: Unique identifier
   - **Organization Slug**: For API access

## Installation & Configuration

### 1. Install Sentry SDK

The Sentry SDK is already included in package.json. If not installed:

```bash
npm install --save @sentry/nextjs
npm install --save-dev @sentry/cli
```

### 2. Environment Variables

Configure Sentry environment variables:

**.env.local (Development)**
```env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=monepiceriz
SENTRY_PROJECT=monepiceriz-web
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=1.0.0-dev
```

**.env.production**
```env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=monepiceriz
SENTRY_PROJECT=monepiceriz-web
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
```

### 3. Create Auth Token

1. **Go to Settings** → **Auth Tokens** in Sentry
2. **Create New Token**:
   ```
   Name: MonEpice&Riz CI/CD
   Organization: monepiceriz
   Scopes: 
     - project:read
     - project:releases
     - org:read
   ```

## Configuration Files

### 1. Sentry Configuration

The project already includes three Sentry configuration files:
- `sentry.client.config.ts` - Browser error tracking
- `sentry.server.config.ts` - Server-side error tracking  
- `sentry.edge.config.ts` - Edge runtime monitoring

### 2. Next.js Integration

The `next.config.ts` file is already configured with Sentry webpack plugin integration for:
- Automatic source map upload
- Release creation
- Error boundary setup

### 3. Source Maps

Ensure source maps are uploaded for better error debugging:

```javascript
// In next.config.ts (already configured)
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: process.env.NODE_ENV !== 'development',
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
};
```

## Error Monitoring Setup

### 1. Client-Side Error Tracking

Configured in `sentry.client.config.ts`:

```typescript
// Key features already configured:
- Browser error capture
- Performance monitoring
- Session replay (production only)
- User feedback integration
- Custom error filtering
- Breadcrumb collection
```

### 2. Server-Side Error Tracking

Configured in `sentry.server.config.ts`:

```typescript
// Key features already configured:
- API route error capture
- Database error monitoring
- External service error tracking
- Custom transaction tracking
- Sensitive data filtering
```

### 3. Custom Error Capture

Use the utility functions provided:

```javascript
import { captureError, captureMessage } from '@/sentry.client.config';

// Capture custom errors
captureError(new Error('Payment processing failed'), {
  order_id: 'ORDER_123',
  payment_method: 'mobile_money',
  amount: 2500
});

// Capture custom messages
captureMessage('User completed checkout', 'info');
```

## Performance Monitoring

### 1. Transaction Tracking

Automatic tracking is configured for:
- **Page Loads**: Next.js page navigation
- **API Routes**: Server-side request processing
- **Database Operations**: Appwrite queries
- **External APIs**: CinetPay, SMS services

### 2. Custom Performance Tracking

```javascript
import { startTransaction } from '@/sentry.client.config';

// Track custom operations
const transaction = startTransaction('payment_processing', 'payment');
try {
  await processPayment();
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('internal_error');
  throw error;
} finally {
  transaction.finish();
}
```

### 3. Web Vitals Integration

Automatically tracks Core Web Vitals:
- **LCP**: Largest Contentful Paint
- **FID**: First Input Delay  
- **CLS**: Cumulative Layout Shift
- **TTFB**: Time to First Byte

## Alerting Configuration

### 1. Error Alerts

Configure alerts for critical errors:

#### High Priority Alerts
```yaml
Alert Name: Payment Processing Errors
Conditions:
  - Error rate > 5% in 5 minutes
  - Tags: component:payment
Actions:
  - Email: dev-team@monepiceriz.ci
  - Slack: #critical-alerts
  - SMS: On-call engineer
```

#### Medium Priority Alerts
```yaml
Alert Name: API Error Rate Spike
Conditions:
  - Error rate > 10% in 15 minutes
  - Environment: production
Actions:
  - Email: dev-team@monepiceriz.ci
  - Slack: #dev-alerts
```

### 2. Performance Alerts

```yaml
Alert Name: Slow Page Load Times
Conditions:
  - P95 page load time > 3 seconds
  - Duration: 10 minutes
Actions:
  - Email: dev-team@monepiceriz.ci
  - Slack: #performance-alerts
```

### 3. Custom Business Logic Alerts

```yaml
Alert Name: Order Processing Failures
Conditions:
  - Custom metric: failed_orders > 10 in 1 hour
  - Environment: production
Actions:
  - Email: business-team@monepiceriz.ci
  - SMS: Store manager
```

## Release Tracking

### 1. Automatic Release Creation

Configured in CI/CD pipeline:

```bash
# In deployment script
sentry-cli releases new $RELEASE_VERSION
sentry-cli releases files $RELEASE_VERSION upload-sourcemaps ./dist
sentry-cli releases finalize $RELEASE_VERSION
sentry-cli releases deploys $RELEASE_VERSION new -e $ENVIRONMENT
```

### 2. Release Health Monitoring

Track deployment health:
- **Crash-free Sessions**: Target > 99.5%
- **Error Rate**: Monitor spikes after deployments
- **Performance Regression**: Compare before/after metrics

### 3. Deploy Notifications

```javascript
// Custom deploy notification
async function notifyDeploy(version, environment) {
  await captureMessage(`Deployed version ${version} to ${environment}`, 'info');
  
  // Add deploy context
  Sentry.setContext('deploy', {
    version,
    environment,
    timestamp: new Date().toISOString()
  });
}
```

## User Context & Tags

### 1. User Context

Set user context for better error attribution:

```javascript
import { setUserContext } from '@/sentry.client.config';

// Set user context after login
setUserContext({
  id: user.id,
  email: user.email,
  name: user.name,
  // Don't include sensitive data like phone numbers
});
```

### 2. Custom Tags

Add business-specific tags:

```javascript
// Set custom tags
Sentry.setTag('store_location', 'COCODY');
Sentry.setTag('user_type', 'premium_customer');
Sentry.setTag('payment_method', 'mobile_money');
Sentry.setTag('order_type', 'delivery');
```

### 3. Custom Context

```javascript
// Add business context
Sentry.setContext('business', {
  store: 'COCODY',
  delivery_zone: 'Zone 1',
  customer_tier: 'VIP',
  order_value: 15000
});
```

## Integration Setup

### 1. Slack Integration

1. **Add Slack Integration** in Sentry project settings
2. **Configure Channels**:
   ```
   #critical-alerts: High priority errors
   #dev-alerts: General development issues
   #performance: Performance degradation
   #deploys: Deployment notifications
   ```

### 2. Email Notifications

Configure email templates for different alert types:

```yaml
Critical Errors:
  Subject: "[CRITICAL] MonEpice&Riz Production Error"
  Recipients: 
    - dev-team@monepiceriz.ci
    - cto@monepiceriz.ci

Performance Issues:
  Subject: "[PERFORMANCE] MonEpice&Riz Slow Response"
  Recipients:
    - dev-team@monepiceriz.ci
```

### 3. Custom Webhooks

Set up webhooks for external systems:

```javascript
// Custom webhook for business metrics
webhook_url: 'https://monepiceriz.ci/api/webhooks/sentry'
events: ['error.created', 'alert.triggered']
```

## Data Privacy & Security

### 1. Sensitive Data Filtering

Configure data scrubbing (already implemented):

```javascript
// Sensitive fields automatically filtered:
- password
- api_key
- token
- secret
- phone (partially masked)
- email (domain preserved)
- credit card numbers
```

### 2. IP Address Handling

```javascript
// IP anonymization configured
beforeSend(event) {
  // IP addresses are automatically anonymized
  // Only country/city level data is preserved
  return event;
}
```

### 3. GDPR Compliance

- **Data Retention**: 90 days for errors, 30 days for performance
- **User Data**: Minimal user data collection
- **Right to be Forgotten**: Data deletion on request

## Monitoring Best Practices

### 1. Error Grouping

Configure intelligent error grouping:
- **Custom Fingerprinting**: Group related errors
- **Stack Trace Grouping**: Similar stack traces grouped
- **Message Patterns**: Pattern-based grouping

### 2. Noise Reduction

Filter out non-actionable errors:

```javascript
// Already configured filters:
- Browser extension errors
- Network timeout errors (development)
- Validation errors (4xx status codes)
- Rate limiting errors
- Expected business logic errors
```

### 3. Performance Sampling

```javascript
// Sampling rates configured:
Development: 100% (all transactions tracked)
Staging: 50% (moderate sampling)
Production: 10% (lightweight monitoring)
```

## Testing Procedures

### 1. Error Capture Testing

Test error capture in different environments:

```javascript
// Test error capture
function testSentryError() {
  try {
    throw new Error('Test error for Sentry');
  } catch (error) {
    captureError(error, { test: true });
  }
}

// Test performance tracking
function testPerformanceTracking() {
  const transaction = startTransaction('test_operation', 'test');
  setTimeout(() => {
    transaction.finish();
  }, 1000);
}
```

### 2. Alert Testing

Verify alert configurations:
- Trigger test errors
- Verify notification delivery
- Check alert escalation
- Test alert resolution

### 3. Dashboard Validation

Confirm dashboard metrics:
- Error rate calculations
- Performance metrics accuracy
- Release tracking functionality
- User session data

## Troubleshooting

### 1. Common Issues

**Sentry Not Capturing Errors**:
- Verify DSN configuration
- Check browser console for Sentry errors
- Validate environment variables
- Ensure Sentry is initialized

**Source Maps Not Working**:
- Verify auth token permissions
- Check source map upload in CI/CD
- Validate file paths in webpack config
- Ensure proper build configuration

**Performance Data Missing**:
- Check sampling rates
- Verify transaction naming
- Ensure performance monitoring enabled
- Validate trace propagation

### 2. Debug Mode

Enable debug mode for troubleshooting:

```javascript
// Add to Sentry config
debug: true,
logLevel: 'debug'
```

### 3. Sentry CLI Testing

Test CLI functionality:

```bash
# Test authentication
sentry-cli info

# Test project access
sentry-cli projects list

# Test source map upload
sentry-cli sourcemaps validate --project monepiceriz-web
```

## Maintenance & Optimization

### 1. Regular Review Tasks

**Weekly**:
- Review error trends
- Check alert effectiveness
- Monitor performance metrics
- Update alert thresholds

**Monthly**:
- Analyze error patterns
- Review release health
- Optimize sampling rates
- Update team access

**Quarterly**:
- Security audit
- Cost optimization
- Integration review
- Team training

### 2. Performance Optimization

- **Sampling Rate Tuning**: Adjust based on traffic
- **Error Filtering**: Refine noise reduction
- **Alert Tuning**: Reduce false positives
- **Data Retention**: Optimize storage costs

### 3. Team Training

Regular training on:
- Error investigation techniques
- Performance analysis
- Alert response procedures
- Custom instrumentation

---

**Last Updated**: January 2025  
**Next Review**: When updating monitoring requirements or adding new features