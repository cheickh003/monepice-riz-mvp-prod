# Environment Setup Guide - MonEpice&Riz

This guide walks you through setting up all three environments (development, staging, production) for the MonEpice&Riz e-commerce platform.

## Prerequisites

Before starting, ensure you have:

- **Node.js** 20 LTS or higher
- **npm** or **yarn** package manager
- **Git** version control
- Access to the following service accounts:
  - Appwrite Cloud account
  - CinetPay merchant account
  - Sentry monitoring account
  - Google Cloud Console (for Maps API)

## Environment Overview

We use three separate environments:

| Environment | Purpose | Domain | Appwrite Project |
|-------------|---------|--------|------------------|
| Development | Local development | `localhost:3000` | `monepiceriz-dev` |
| Staging | Testing & QA | `staging.monepiceriz.ci` | `monepiceriz-staging` |
| Production | Live application | `monepiceriz.ci` | `monepiceriz-prod` |

## Step-by-Step Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd monepiceriz-mvp

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### 2. Appwrite Configuration

#### Create Appwrite Projects

1. **Sign up/Login** to [Appwrite Cloud](https://cloud.appwrite.io)

2. **Create three projects**:
   ```
   Project Name: MonEpice&Riz Development
   Project ID: monepiceriz-dev
   
   Project Name: MonEpice&Riz Staging  
   Project ID: monepiceriz-staging
   
   Project Name: MonEpice&Riz Production
   Project ID: monepiceriz-prod
   ```

3. **Configure each project**:
   - Go to **Settings** → **General**
   - Note down the **Project ID** and **API Endpoint**
   - Go to **Settings** → **API Keys**
   - Create a **Server API Key** with all permissions

#### Platform Configuration

For each project, add the following platforms:

**Development:**
```
Platform: Web
Name: MonEpice&Riz Dev
Hostname: localhost
```

**Staging:**
```
Platform: Web  
Name: MonEpice&Riz Staging
Hostname: staging.monepiceriz.ci
```

**Production:**
```
Platform: Web
Name: MonEpice&Riz Production  
Hostname: monepiceriz.ci
```

#### Environment Variables Setup

Update your `.env.local` with Appwrite configuration:

```env
# Development (default)
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT=your-dev-project-id
APPWRITE_API_KEY=your-server-api-key

# For staging/production, use different project IDs
NEXT_PUBLIC_APPWRITE_PROJECT_STAGING=your-staging-project-id
NEXT_PUBLIC_APPWRITE_PROJECT_PRODUCTION=your-prod-project-id
```

### 3. CinetPay Configuration

#### Create CinetPay Accounts

1. **Sandbox Account**:
   - Visit [CinetPay Console](https://console.cinetpay.com)
   - Create a **sandbox merchant account**
   - Complete basic information
   - Note down: API Key, Site ID, Secret Key

2. **Production Account** (for later):
   - Apply for a **production merchant account**
   - Complete KYC (Know Your Customer) requirements:
     - Business registration documents
     - Tax identification
     - Bank account information
     - Identity verification
   - Wait for approval (usually 2-3 business days)

#### Environment Variables

Add CinetPay configuration to `.env.local`:

```env
# Sandbox (development)
CINETPAY_API_KEY=your-sandbox-api-key
CINETPAY_SITE_ID=your-sandbox-site-id
CINETPAY_SECRET_KEY=your-sandbox-secret-key

# Production (when approved)
CINETPAY_PROD_API_KEY=your-production-api-key
CINETPAY_PROD_SITE_ID=your-production-site-id
CINETPAY_PROD_SECRET_KEY=your-production-secret-key

# Webhook URLs (update for each environment)
CINETPAY_NOTIFY_URL=http://localhost:3000/api/webhooks/cinetpay
CINETPAY_RETURN_URL=http://localhost:3000/checkout/confirmation
CINETPAY_CANCEL_URL=http://localhost:3000/checkout/payment
```

### 4. Sentry Configuration

#### Create Sentry Project

1. **Sign up/Login** to [Sentry](https://sentry.io)

2. **Create organization** (if needed):
   - Organization name: `MonEpice&Riz`
   - Slug: `monepiceriz`

3. **Create project**:
   - Platform: `Next.js`
   - Project name: `MonEpice&Riz Web`
   - Alert settings: Set up for your team

4. **Get configuration values**:
   - **DSN**: From project settings
   - **Auth Token**: Create in User Settings → Auth Tokens
   - **Organization**: Your organization slug
   - **Project**: Your project name

#### Environment Variables

Add Sentry configuration to `.env.local`:

```env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ENVIRONMENT=development
```

### 5. Additional Services (Optional)

#### Google Maps API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Enable **Maps JavaScript API** and **Places API**
4. Create credentials (API Key)
5. Restrict the API key to your domains

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

#### SMS Service (SMSPro Africa)

1. Sign up at [SMSPro Africa](https://smspro.africa)
2. Get API credentials

```env
SMSPRO_API_KEY=your-smspro-api-key
SMSPRO_SENDER_ID=MonEpiceRiz
```

#### Email Service (Resend)

1. Sign up at [Resend](https://resend.com)
2. Verify your domain
3. Get API key

```env
RESEND_API_KEY=re_your-api-key
EMAIL_FROM="MonEpice&Riz <noreply@monepiceriz.ci>"
```

### 6. Verification

#### Test Development Environment

```bash
# Start development server
npm run dev

# Open http://localhost:3000
# Check browser console for errors
# Verify Appwrite connection
# Test Sentry error reporting
```

#### Environment Health Check

Create a simple health check endpoint to verify all services:

```bash
# Test API endpoint
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "ok",
  "services": {
    "appwrite": "connected",
    "sentry": "configured",
    "cinetpay": "configured"
  }
}
```

## Environment-Specific Configurations

### Development Environment

```env
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEBUG=true
VERBOSE_LOGGING=true
```

### Staging Environment

```env
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.monepiceriz.ci
NEXT_PUBLIC_APPWRITE_PROJECT=your-staging-project-id
```

### Production Environment

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://monepiceriz.ci
NEXT_PUBLIC_APPWRITE_PROJECT=your-production-project-id
SENTRY_ENVIRONMENT=production
```

## Troubleshooting

### Common Issues

1. **Appwrite Connection Failed**
   - Verify project ID and endpoint
   - Check platform configuration
   - Ensure API key has correct permissions

2. **Sentry Not Capturing Errors**
   - Verify DSN format
   - Check environment variable names
   - Ensure Sentry is initialized properly

3. **Environment Variables Not Loading**
   - Check file name (`.env.local` for Next.js)
   - Verify variable naming (`NEXT_PUBLIC_` prefix for client-side)
   - Restart development server

### Debug Commands

```bash
# Check environment variables
npm run env:check

# Test service connections
npm run health:check

# Validate configuration
npm run config:validate
```

## Security Notes

- **Never commit** `.env.local` or any file containing real credentials
- **Use different credentials** for each environment
- **Rotate secrets** regularly, especially for production
- **Restrict API keys** to specific domains/IPs when possible
- **Monitor** for unauthorized access in service dashboards

## Next Steps

Once your environment is set up:

1. Follow the [Appwrite Setup Guide](./APPWRITE_SETUP.md) for database configuration
2. Review the [CinetPay Setup Guide](./CINETPAY_SETUP.md) for payment integration
3. Configure monitoring with the [Sentry Setup Guide](./SENTRY_SETUP.md)
4. Set up deployment following the [Deployment Guide](../DEPLOYMENT.md)

## Support

If you encounter issues:

1. Check the specific service setup guides in this directory
2. Review error logs in the service dashboards
3. Contact the development team
4. Create an issue in the project repository

---

**Last Updated**: January 2025  
**Next Review**: When adding new services or environments