# Appwrite Setup Guide - MonEpice&Riz

This guide provides detailed instructions for setting up Appwrite as the backend service for MonEpice&Riz, including authentication, database collections, and storage configuration.

## Overview

Appwrite serves as our Backend-as-a-Service (BaaS) providing:
- User authentication and session management
- Database collections for products, orders, customers
- File storage for product images and documents
- Real-time capabilities for live updates
- Server-side functions for business logic

## Prerequisites

- Appwrite Cloud account ([cloud.appwrite.io](https://cloud.appwrite.io))
- Basic understanding of NoSQL databases
- Admin access to create projects and configure settings

## Project Creation

### 1. Create Projects

Create three separate projects for different environments:

#### Development Project
```
Project Name: MonEpice&Riz Development
Project ID: monepiceriz-dev
Region: Europe (closest to Côte d'Ivoire)
```

#### Staging Project
```
Project Name: MonEpice&Riz Staging
Project ID: monepiceriz-staging
Region: Europe
```

#### Production Project
```
Project Name: MonEpice&Riz Production
Project ID: monepiceriz-prod
Region: Europe
```

### 2. Platform Configuration

For each project, configure the web platform:

1. Go to **Settings** → **Platforms**
2. Click **Add Platform** → **Web**
3. Configure based on environment:

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

## Authentication Setup

### 1. Configure Authentication Methods

Go to **Auth** → **Settings** in each project:

#### Email/Password Authentication
```
Status: Enabled
Password Policy:
  - Minimum length: 8 characters
  - Require uppercase: Yes
  - Require lowercase: Yes
  - Require numbers: Yes
  - Require symbols: No
  - Password history: 3 passwords
```

#### Phone Authentication (Future)
```
Status: Disabled (enable when ready)
Provider: Twilio/MessageBird
Region: Africa/Côte d'Ivoire
```

#### OAuth Providers (Optional)
```
Google OAuth: Enabled (for convenience)
  - Client ID: [from Google Console]
  - Client Secret: [from Google Console]
  - Redirect URI: https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/[project-id]
```

### 2. Security Settings

Configure security policies:

```
Session Length: 7 days
Password Recovery: Enabled
Email Verification: Enabled (production only)
Guest Sessions: Disabled
Max Sessions: 3 per user
```

### 3. Email Templates

Customize email templates for Côte d'Ivoire context:

**Welcome Email:**
```
Subject: Bienvenue chez MonEpice&Riz ! 🛒
Content: Personalized welcome message in French
```

**Password Recovery:**
```
Subject: Réinitialisation de votre mot de passe - MonEpice&Riz
Content: Password reset instructions in French
```

## Database Configuration

### 1. Create Database

1. Go to **Databases** → **Create Database**
2. Database ID: `monepiceriz-main`
3. Name: `MonEpice&Riz Main Database`

### 2. Create Collections

Create the following collections with their schemas:

#### Users Collection
```json
{
  "$id": "users",
  "name": "Users",
  "attributes": [
    {
      "key": "authUserId",
      "type": "string",
      "size": 255,
      "required": true,
      "array": false
    },
    {
      "key": "role",
      "type": "string",
      "size": 50,
      "required": true,
      "default": "customer",
      "array": false
    },
    {
      "key": "phone",
      "type": "string",
      "size": 20,
      "required": true,
      "array": false
    },
    {
      "key": "phoneVerified",
      "type": "boolean",
      "required": true,
      "default": false,
      "array": false
    }
  ],
  "indexes": [
    {
      "key": "authUserId",
      "type": "unique",
      "attributes": ["authUserId"]
    },
    {
      "key": "phone",
      "type": "unique", 
      "attributes": ["phone"]
    }
  ]
}
```

#### Categories Collection
```json
{
  "$id": "categories",
  "name": "Categories",
  "attributes": [
    {
      "key": "name",
      "type": "string",
      "size": 100,
      "required": true,
      "array": false
    },
    {
      "key": "slug",
      "type": "string",
      "size": 100,
      "required": true,
      "array": false
    },
    {
      "key": "description",
      "type": "string",
      "size": 500,
      "required": false,
      "array": false
    },
    {
      "key": "imageUrl",
      "type": "string",
      "size": 255,
      "required": false,
      "array": false
    },
    {
      "key": "isActive",
      "type": "boolean",
      "required": true,
      "default": true,
      "array": false
    },
    {
      "key": "displayOrder",
      "type": "integer",
      "required": true,
      "default": 0,
      "array": false
    }
  ],
  "indexes": [
    {
      "key": "slug",
      "type": "unique",
      "attributes": ["slug"]
    },
    {
      "key": "displayOrder",
      "type": "key",
      "attributes": ["displayOrder"]
    }
  ]
}
```

#### Products Collection
```json
{
  "$id": "products", 
  "name": "Products",
  "attributes": [
    {
      "key": "name",
      "type": "string",
      "size": 200,
      "required": true,
      "array": false
    },
    {
      "key": "slug",
      "type": "string", 
      "size": 200,
      "required": true,
      "array": false
    },
    {
      "key": "description",
      "type": "string",
      "size": 2000,
      "required": false,
      "array": false
    },
    {
      "key": "categoryId",
      "type": "string",
      "size": 255,
      "required": true,
      "array": false
    },
    {
      "key": "basePrice",
      "type": "double",
      "required": true,
      "array": false
    },
    {
      "key": "promoPrice",
      "type": "double",
      "required": false,
      "array": false
    },
    {
      "key": "imageUrl",
      "type": "string",
      "size": 255,
      "required": true,
      "array": false
    },
    {
      "key": "images",
      "type": "string",
      "size": 255,
      "required": false,
      "array": true
    },
    {
      "key": "unit",
      "type": "string",
      "size": 50,
      "required": true,
      "default": "unité",
      "array": false
    },
    {
      "key": "isActive",
      "type": "boolean",
      "required": true,
      "default": true,
      "array": false
    },
    {
      "key": "isFeatured",
      "type": "boolean",
      "required": true,
      "default": false,
      "array": false
    },
    {
      "key": "isSpecialty",
      "type": "boolean",
      "required": true,
      "default": false,
      "array": false
    },
    {
      "key": "tags",
      "type": "string",
      "size": 100,
      "required": false,
      "array": true
    }
  ],
  "indexes": [
    {
      "key": "slug",
      "type": "unique",
      "attributes": ["slug"]
    },
    {
      "key": "categoryId",
      "type": "key",
      "attributes": ["categoryId"]
    },
    {
      "key": "isActive",
      "type": "key", 
      "attributes": ["isActive"]
    },
    {
      "key": "isFeatured",
      "type": "key",
      "attributes": ["isFeatured"]
    },
    {
      "key": "isSpecialty", 
      "type": "key",
      "attributes": ["isSpecialty"]
    },
    {
      "key": "basePrice",
      "type": "key",
      "attributes": ["basePrice"]
    }
  ]
}
```

#### Store Inventory Collection
```json
{
  "$id": "store_inventory",
  "name": "Store Inventory",
  "attributes": [
    {
      "key": "store",
      "type": "string",
      "size": 50,
      "required": true,
      "array": false
    },
    {
      "key": "productId",
      "type": "string",
      "size": 255,
      "required": true,
      "array": false
    },
    {
      "key": "quantityAvailable",
      "type": "integer",
      "required": true,
      "default": 0,
      "array": false
    },
    {
      "key": "quantityReserved",
      "type": "integer",
      "required": true,
      "default": 0,
      "array": false
    },
    {
      "key": "lowStockThreshold",
      "type": "integer",
      "required": true,
      "default": 10,
      "array": false
    }
  ],
  "indexes": [
    {
      "key": "storeProduct",
      "type": "unique",
      "attributes": ["store", "productId"]
    },
    {
      "key": "productId",
      "type": "key",
      "attributes": ["productId"]
    },
    {
      "key": "store",
      "type": "key",
      "attributes": ["store"]
    }
  ]
}
```

#### Orders Collection
```json
{
  "$id": "orders",
  "name": "Orders",
  "attributes": [
    {
      "key": "orderNumber", 
      "type": "string",
      "size": 50,
      "required": true,
      "array": false
    },
    {
      "key": "customerId",
      "type": "string",
      "size": 255,
      "required": true,
      "array": false
    },
    {
      "key": "store",
      "type": "string",
      "size": 50,
      "required": true,
      "array": false
    },
    {
      "key": "status",
      "type": "string",
      "size": 50,
      "required": true,
      "default": "NEW",
      "array": false
    },
    {
      "key": "paymentStatus",
      "type": "string",
      "size": 50,
      "required": true,
      "default": "PENDING",
      "array": false
    },
    {
      "key": "paymentMethod",
      "type": "string",
      "size": 50,
      "required": false,
      "array": false
    },
    {
      "key": "subtotal",
      "type": "double",
      "required": true,
      "array": false
    },
    {
      "key": "deliveryFee",
      "type": "double",
      "required": true,
      "default": 0,
      "array": false
    },
    {
      "key": "total",
      "type": "double",
      "required": true,
      "array": false
    },
    {
      "key": "deliveryType",
      "type": "string",
      "size": 50,
      "required": true,
      "array": false
    },
    {
      "key": "deliveryAddress",
      "type": "string",
      "size": 2000,
      "required": false,
      "array": false
    },
    {
      "key": "cinetpayTransId",
      "type": "string",
      "size": 100,
      "required": false,
      "array": false
    }
  ],
  "indexes": [
    {
      "key": "orderNumber",
      "type": "unique",
      "attributes": ["orderNumber"]
    },
    {
      "key": "customerId",
      "type": "key",
      "attributes": ["customerId"]
    },
    {
      "key": "status",
      "type": "key",
      "attributes": ["status"]
    },
    {
      "key": "store",
      "type": "key",
      "attributes": ["store"]
    },
    {
      "key": "cinetpayTransId",
      "type": "unique",
      "attributes": ["cinetpayTransId"]
    }
  ]
}
```

### 3. Configure Permissions

Set up proper permissions for each collection:

#### Read Permissions
- **Categories**: Any (public catalog)
- **Products**: Any (public catalog)  
- **Store Inventory**: Any (stock visibility)
- **Orders**: Users (own orders only)
- **Users**: Users (own profile only)

#### Write Permissions
- **Categories**: Admins only
- **Products**: Admins only
- **Store Inventory**: Admins and Staff
- **Orders**: Users (create only), Admins (all operations)
- **Users**: Users (own profile only)

## Storage Configuration

### 1. Create Storage Buckets

Create the following storage buckets:

#### Product Images Bucket
```
Bucket ID: product_images
Name: Product Images
File Size Limit: 5MB
Allowed File Extensions: jpg, jpeg, png, webp
Encryption: Enabled
Antivirus: Enabled
```

#### User Avatars Bucket  
```
Bucket ID: user_avatars
Name: User Avatars
File Size Limit: 2MB
Allowed File Extensions: jpg, jpeg, png
Encryption: Enabled
Antivirus: Enabled
```

#### Documents Bucket
```
Bucket ID: documents
Name: Documents  
File Size Limit: 10MB
Allowed File Extensions: pdf, doc, docx
Encryption: Enabled
Antivirus: Enabled
```

### 2. Configure Storage Permissions

Set appropriate read/write permissions for each bucket based on user roles.

## Regional Configuration

### Côte d'Ivoire Specific Settings

1. **Timezone**: Configure to GMT (UTC+0) for Côte d'Ivoire
2. **Currency**: Set default to XOF (CFA Franc)
3. **Language**: Primary French (fr), Secondary English (en)
4. **Phone Format**: Configure for Ivorian phone numbers (+225)

## Seed Data

### 1. Sample Categories

Create initial product categories:

```javascript
// Categories to create
const categories = [
  {
    name: 'Escargots & Crabes',
    slug: 'escargots-crabes',
    description: 'Nos spécialités de la mer de San Pedro',
    isActive: true,
    displayOrder: 1
  },
  {
    name: 'Fruits & Légumes', 
    slug: 'fruits-legumes',
    description: 'Produits frais du marché',
    isActive: true,
    displayOrder: 2
  },
  {
    name: 'Épicerie',
    slug: 'epicerie',
    description: 'Produits d\'épicerie générale',
    isActive: true,
    displayOrder: 3
  }
];
```

### 2. Sample Products

Add featured products for each store:

```javascript
// Featured products
const products = [
  {
    name: 'Escargots de San Pedro - Premium',
    slug: 'escargots-san-pedro-premium',
    description: 'Escargots frais de qualité supérieure',
    basePrice: 2500,
    unit: 'kg',
    isActive: true,
    isFeatured: true,
    isSpecialty: true,
    tags: ['escargots', 'premium', 'san-pedro']
  },
  {
    name: 'Crabes vivants',
    slug: 'crabes-vivants',
    description: 'Crabes frais vivants de nos côtes',
    basePrice: 3000,
    unit: 'kg', 
    isActive: true,
    isFeatured: true,
    isSpecialty: true,
    tags: ['crabes', 'frais', 'vivants']
  }
];
```

## Testing & Validation

### 1. Connection Test

Test Appwrite connection from your application:

```javascript
// Test script
import { Client, Account } from 'appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('your-project-id');

const account = new Account(client);

// Test connection
account.get().then((response) => {
  console.log('Appwrite connected successfully:', response);
}).catch((error) => {
  console.error('Appwrite connection failed:', error);
});
```

### 2. Database Queries

Test database operations:

```javascript
// Test database queries
import { Databases, Query } from 'appwrite';

const databases = new Databases(client);

// Test category retrieval
databases.listDocuments(
  'monepiceriz-main',
  'categories',
  [Query.equal('isActive', true)]
).then((response) => {
  console.log('Categories retrieved:', response);
});
```

## Monitoring & Maintenance

### 1. Usage Monitoring

Monitor the following metrics:
- Database queries per day
- Storage usage
- Authentication requests
- Function executions

### 2. Backup Strategy

- Appwrite Cloud provides automatic backups
- Set up additional data export for critical collections
- Regular testing of data recovery procedures

### 3. Security Monitoring

- Review access logs regularly
- Monitor for unusual authentication patterns
- Keep API keys rotated and secure

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify platform hostname configuration
   - Check for trailing slashes in URLs

2. **Permission Denied**
   - Review collection permissions
   - Ensure proper user authentication

3. **Query Limits**
   - Optimize queries with proper indexes
   - Implement pagination for large datasets

### Support Resources

- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite Discord Community](https://discord.gg/GSeTUeA)
- [Appwrite GitHub Issues](https://github.com/appwrite/appwrite/issues)

---

**Last Updated**: January 2025  
**Next Review**: When updating database schema or adding new collections