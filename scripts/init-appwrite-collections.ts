/**
 * Appwrite Collections Initialization Script
 * 
 * This script creates all necessary Appwrite database collections based on the PRD schema.
 * It sets up proper attributes, indexes, and permissions for each collection.
 * 
 * Usage: npx tsx scripts/init-appwrite-collections.ts
 */

import { Client, Databases, Permission, Role } from 'appwrite'
import { config } from 'dotenv'

// Load environment variables
config()

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
  .setKey(process.env.APPWRITE_API_KEY!)

const databases = new Databases(client)
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!

interface CollectionConfig {
  name: string
  id: string
  attributes: Array<{
    key: string
    type: 'string' | 'integer' | 'double' | 'boolean' | 'datetime' | 'email' | 'url'
    size?: number
    required?: boolean
    default?: any
    array?: boolean
  }>
  indexes: Array<{
    key: string
    type: 'key' | 'fulltext' | 'unique'
    attributes: string[]
    orders?: string[]
  }>
  permissions?: string[]
}

const collections: CollectionConfig[] = [
  {
    name: 'Stores',
    id: 'stores',
    attributes: [
      { key: 'name', type: 'string', size: 100, required: true },
      { key: 'code', type: 'string', size: 20, required: true },
      { key: 'address', type: 'string', size: 500, required: true },
      { key: 'phone', type: 'string', size: 20, required: true },
      { key: 'email', type: 'email', size: 100, required: false },
      { key: 'latitude', type: 'double', required: false },
      { key: 'longitude', type: 'double', required: false },
      { key: 'openingHours', type: 'string', size: 1000, required: false },
      { key: 'isActive', type: 'boolean', required: true, default: true },
      { key: 'deliveryRadius', type: 'integer', required: true, default: 10 },
    ],
    indexes: [
      { key: 'code', type: 'unique', attributes: ['code'] },
      { key: 'isActive', type: 'key', attributes: ['isActive'] },
    ],
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.team('admins')),
      Permission.update(Role.team('admins')),
      Permission.delete(Role.team('admins')),
    ]
  },
  {
    name: 'Products',
    id: 'products',
    attributes: [
      { key: 'name', type: 'string', size: 200, required: true },
      { key: 'slug', type: 'string', size: 200, required: true },
      { key: 'description', type: 'string', size: 2000, required: false },
      { key: 'shortDescription', type: 'string', size: 500, required: false },
      { key: 'categoryId', type: 'string', size: 255, required: true },
      { key: 'basePrice', type: 'double', required: true },
      { key: 'promoPrice', type: 'double', required: false },
      { key: 'imageUrl', type: 'string', size: 255, required: true },
      { key: 'images', type: 'string', size: 255, array: true, required: false },
      { key: 'unit', type: 'string', size: 50, required: true, default: 'unité' },
      { key: 'weight', type: 'double', required: false },
      { key: 'sku', type: 'string', size: 100, required: false },
      { key: 'legacyId', type: 'string', size: 100, required: false },
      { key: 'isActive', type: 'boolean', required: true, default: true },
      { key: 'isFeatured', type: 'boolean', required: true, default: false },
      { key: 'isSpecialty', type: 'boolean', required: true, default: false },
      { key: 'tags', type: 'string', size: 100, array: true, required: false },
      { key: 'nutrition', type: 'string', size: 1000, required: false },
      { key: 'storage', type: 'string', size: 500, required: false },
      { key: 'origin', type: 'string', size: 200, required: false },
    ],
    indexes: [
      { key: 'slug', type: 'unique', attributes: ['slug'] },
      { key: 'categoryId', type: 'key', attributes: ['categoryId'] },
      { key: 'sku', type: 'unique', attributes: ['sku'] },
      { key: 'legacyId', type: 'unique', attributes: ['legacyId'] },
      { key: 'basePrice', type: 'key', attributes: ['basePrice'] },
      { key: 'isActive', type: 'key', attributes: ['isActive'] },
      { key: 'isFeatured', type: 'key', attributes: ['isFeatured'] },
      { key: 'isSpecialty', type: 'key', attributes: ['isSpecialty'] },
      { key: 'search', type: 'fulltext', attributes: ['name', 'description', 'tags'] },
    ],
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.team('admins')),
      Permission.update(Role.team('admins')),
      Permission.delete(Role.team('admins')),
    ]
  },
  {
    name: 'Categories',
    id: 'categories',
    attributes: [
      { key: 'name', type: 'string', size: 100, required: true },
      { key: 'slug', type: 'string', size: 100, required: true },
      { key: 'description', type: 'string', size: 500, required: false },
      { key: 'imageUrl', type: 'string', size: 255, required: false },
      { key: 'parentId', type: 'string', size: 255, required: false },
      { key: 'displayOrder', type: 'integer', required: true, default: 0 },
      { key: 'isActive', type: 'boolean', required: true, default: true },
      { key: 'isFeatured', type: 'boolean', required: true, default: false },
      { key: 'legacyId', type: 'string', size: 100, required: false },
    ],
    indexes: [
      { key: 'slug', type: 'unique', attributes: ['slug'] },
      { key: 'parentId', type: 'key', attributes: ['parentId'] },
      { key: 'displayOrder', type: 'key', attributes: ['displayOrder'] },
      { key: 'isActive', type: 'key', attributes: ['isActive'] },
      { key: 'isFeatured', type: 'key', attributes: ['isFeatured'] },
      { key: 'legacyId', type: 'unique', attributes: ['legacyId'] },
    ],
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.team('admins')),
      Permission.update(Role.team('admins')),
      Permission.delete(Role.team('admins')),
    ]
  },
  {
    name: 'Customers',
    id: 'customers',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'loyaltyPoints', type: 'integer', required: true, default: 0 },
      { key: 'totalOrders', type: 'integer', required: true, default: 0 },
      { key: 'totalSpent', type: 'double', required: true, default: 0.0 },
      { key: 'tier', type: 'string', size: 20, required: true, default: 'new' },
      { key: 'preferredStore', type: 'string', size: 20, required: false },
      { key: 'lastOrderAt', type: 'datetime', required: false },
      { key: 'marketingConsent', type: 'boolean', required: true, default: false },
      { key: 'dateOfBirth', type: 'datetime', required: false },
    ],
    indexes: [
      { key: 'userId', type: 'unique', attributes: ['userId'] },
      { key: 'tier', type: 'key', attributes: ['tier'] },
      { key: 'preferredStore', type: 'key', attributes: ['preferredStore'] },
      { key: 'totalSpent', type: 'key', attributes: ['totalSpent'] },
      { key: 'lastOrderAt', type: 'key', attributes: ['lastOrderAt'] },
    ],
    permissions: [
      Permission.read(Role.user('USER_ID')),
      Permission.create(Role.user('USER_ID')),
      Permission.update(Role.user('USER_ID')),
      Permission.read(Role.team('admins')),
      Permission.update(Role.team('admins')),
      Permission.delete(Role.team('admins')),
    ]
  },
  {
    name: 'Orders',
    id: 'orders',
    attributes: [
      { key: 'orderNumber', type: 'string', size: 50, required: true },
      { key: 'customerId', type: 'string', size: 255, required: true },
      { key: 'store', type: 'string', size: 50, required: true },
      { key: 'status', type: 'string', size: 50, required: true, default: 'NEW' },
      { key: 'paymentStatus', type: 'string', size: 50, required: true, default: 'PENDING' },
      { key: 'paymentMethod', type: 'string', size: 50, required: false },
      { key: 'subtotal', type: 'double', required: true },
      { key: 'deliveryFee', type: 'double', required: true, default: 0.0 },
      { key: 'total', type: 'double', required: true },
      { key: 'deliveryType', type: 'string', size: 50, required: true },
      { key: 'deliveryAddress', type: 'string', size: 2000, required: false },
      { key: 'scheduledDeliveryAt', type: 'datetime', required: false },
      { key: 'deliveredAt', type: 'datetime', required: false },
      { key: 'cinetpayTransId', type: 'string', size: 100, required: false },
      { key: 'notes', type: 'string', size: 1000, required: false },
      { key: 'cancellationReason', type: 'string', size: 500, required: false },
    ],
    indexes: [
      { key: 'orderNumber', type: 'unique', attributes: ['orderNumber'] },
      { key: 'customerId', type: 'key', attributes: ['customerId'] },
      { key: 'store', type: 'key', attributes: ['store'] },
      { key: 'status', type: 'key', attributes: ['status'] },
      { key: 'paymentStatus', type: 'key', attributes: ['paymentStatus'] },
      { key: 'cinetpayTransId', type: 'unique', attributes: ['cinetpayTransId'] },
      { key: 'scheduledDeliveryAt', type: 'key', attributes: ['scheduledDeliveryAt'] },
    ],
    permissions: [
      Permission.read(Role.user('USER_ID')),
      Permission.create(Role.user('USER_ID')),
      Permission.read(Role.team('admins')),
      Permission.update(Role.team('admins')),
      Permission.delete(Role.team('admins')),
    ]
  },
  {
    name: 'Order Items',
    id: 'order_items',
    attributes: [
      { key: 'orderId', type: 'string', size: 255, required: true },
      { key: 'productId', type: 'string', size: 255, required: true },
      { key: 'productName', type: 'string', size: 200, required: true },
      { key: 'unitPrice', type: 'double', required: true },
      { key: 'quantity', type: 'integer', required: true },
      { key: 'totalPrice', type: 'double', required: true },
      { key: 'unit', type: 'string', size: 50, required: true },
      { key: 'imageUrl', type: 'string', size: 255, required: false },
    ],
    indexes: [
      { key: 'orderId', type: 'key', attributes: ['orderId'] },
      { key: 'productId', type: 'key', attributes: ['productId'] },
    ],
    permissions: [
      Permission.read(Role.user('USER_ID')),
      Permission.create(Role.user('USER_ID')),
      Permission.read(Role.team('admins')),
      Permission.update(Role.team('admins')),
      Permission.delete(Role.team('admins')),
    ]
  },
  {
    name: 'Addresses',
    id: 'addresses',
    attributes: [
      { key: 'customerId', type: 'string', size: 255, required: true },
      { key: 'label', type: 'string', size: 50, required: true },
      { key: 'street', type: 'string', size: 500, required: true },
      { key: 'zone', type: 'string', size: 100, required: true },
      { key: 'building', type: 'string', size: 100, required: false },
      { key: 'apartment', type: 'string', size: 50, required: false },
      { key: 'city', type: 'string', size: 50, required: true, default: 'Abidjan' },
      { key: 'latitude', type: 'double', required: false },
      { key: 'longitude', type: 'double', required: false },
      { key: 'instructions', type: 'string', size: 1000, required: false },
      { key: 'isDefault', type: 'boolean', required: true, default: false },
      { key: 'isActive', type: 'boolean', required: true, default: true },
    ],
    indexes: [
      { key: 'customerId', type: 'key', attributes: ['customerId'] },
      { key: 'zone', type: 'key', attributes: ['zone'] },
      { key: 'isDefault', type: 'key', attributes: ['isDefault'] },
      { key: 'isActive', type: 'key', attributes: ['isActive'] },
    ],
    permissions: [
      Permission.read(Role.user('USER_ID')),
      Permission.create(Role.user('USER_ID')),
      Permission.update(Role.user('USER_ID')),
      Permission.delete(Role.user('USER_ID')),
      Permission.read(Role.team('admins')),
    ]
  },
  {
    name: 'Favorites',
    id: 'favorites', 
    attributes: [
      { key: 'customerId', type: 'string', size: 255, required: true },
      { key: 'productId', type: 'string', size: 255, required: true },
      { key: 'favoritedAt', type: 'datetime', required: true },
    ],
    indexes: [
      { key: 'customerProduct', type: 'unique', attributes: ['customerId', 'productId'] },
      { key: 'customerId', type: 'key', attributes: ['customerId'] },
      { key: 'productId', type: 'key', attributes: ['productId'] },
      { key: 'favoritedAt', type: 'key', attributes: ['favoritedAt'] },
    ],
    permissions: [
      Permission.read(Role.user('USER_ID')),
      Permission.create(Role.user('USER_ID')),
      Permission.delete(Role.user('USER_ID')),
      Permission.read(Role.team('admins')),
    ]
  },
  {
    name: 'Store Inventory',
    id: 'store_inventory',
    attributes: [
      { key: 'store', type: 'string', size: 50, required: true },
      { key: 'productId', type: 'string', size: 255, required: true },
      { key: 'quantityAvailable', type: 'integer', required: true, default: 0 },
      { key: 'quantityReserved', type: 'integer', required: true, default: 0 },
      { key: 'lowStockThreshold', type: 'integer', required: true, default: 10 },
      { key: 'lastRestockedAt', type: 'datetime', required: false },
      { key: 'nextDeliveryAt', type: 'datetime', required: false },
    ],
    indexes: [
      { key: 'storeProduct', type: 'unique', attributes: ['store', 'productId'] },
      { key: 'store', type: 'key', attributes: ['store'] },
      { key: 'productId', type: 'key', attributes: ['productId'] },
      { key: 'quantityAvailable', type: 'key', attributes: ['quantityAvailable'] },
    ],
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.team('admins')),
      Permission.update(Role.team('admins')),
      Permission.delete(Role.team('admins')),
    ]
  },
  {
    name: 'Cart Items',
    id: 'cart_items',
    attributes: [
      { key: 'customerId', type: 'string', size: 255, required: true },
      { key: 'productId', type: 'string', size: 255, required: true },
      { key: 'store', type: 'string', size: 50, required: true },
      { key: 'quantity', type: 'integer', required: true },
      { key: 'addedAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true },
    ],
    indexes: [
      { key: 'customerProduct', type: 'unique', attributes: ['customerId', 'productId', 'store'] },
      { key: 'customerId', type: 'key', attributes: ['customerId'] },
      { key: 'store', type: 'key', attributes: ['store'] },
      { key: 'addedAt', type: 'key', attributes: ['addedAt'] },
    ],
    permissions: [
      Permission.read(Role.user('USER_ID')),
      Permission.create(Role.user('USER_ID')),
      Permission.update(Role.user('USER_ID')),
      Permission.delete(Role.user('USER_ID')),
      Permission.read(Role.team('admins')),
    ]
  },
  {
    name: 'Users',
    id: 'users',
    attributes: [
      { key: 'authUserId', type: 'string', size: 255, required: true },
      { key: 'role', type: 'string', size: 50, required: true, default: 'customer' },
      { key: 'phone', type: 'string', size: 20, required: true },
      { key: 'phoneVerified', type: 'boolean', required: true, default: false },
      { key: 'lastActiveAt', type: 'datetime', required: false },
      { key: 'status', type: 'string', size: 20, required: true, default: 'active' },
    ],
    indexes: [
      { key: 'authUserId', type: 'unique', attributes: ['authUserId'] },
      { key: 'phone', type: 'unique', attributes: ['phone'] },
      { key: 'role', type: 'key', attributes: ['role'] },
      { key: 'status', type: 'key', attributes: ['status'] },
    ],
    permissions: [
      Permission.read(Role.user('USER_ID')),
      Permission.create(Role.any()),
      Permission.update(Role.user('USER_ID')),
      Permission.read(Role.team('admins')),
      Permission.update(Role.team('admins')),
      Permission.delete(Role.team('admins')),
    ]
  },
  {
    name: 'Notifications',
    id: 'notifications',
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'title', type: 'string', size: 200, required: true },
      { key: 'message', type: 'string', size: 1000, required: true },
      { key: 'entityId', type: 'string', size: 255, required: false },
      { key: 'entityType', type: 'string', size: 50, required: false },
      { key: 'isRead', type: 'boolean', required: true, default: false },
      { key: 'isArchived', type: 'boolean', required: true, default: false },
      { key: 'readAt', type: 'datetime', required: false },
      { key: 'priority', type: 'string', size: 20, required: true, default: 'normal' },
    ],
    indexes: [
      { key: 'userId', type: 'key', attributes: ['userId'] },
      { key: 'type', type: 'key', attributes: ['type'] },
      { key: 'isRead', type: 'key', attributes: ['isRead'] },
      { key: 'isArchived', type: 'key', attributes: ['isArchived'] },
      { key: 'priority', type: 'key', attributes: ['priority'] },
      { key: 'entityId', type: 'key', attributes: ['entityId'] },
    ],
    permissions: [
      Permission.read(Role.user('USER_ID')),
      Permission.create(Role.team('admins')),
      Permission.update(Role.user('USER_ID')),
      Permission.delete(Role.user('USER_ID')),
      Permission.read(Role.team('admins')),
      Permission.update(Role.team('admins')),
    ]
  }
]

async function createCollection(config: CollectionConfig) {
  try {
    console.log(`Creating collection: ${config.name}`)
    
    // Check if collection already exists
    try {
      await databases.getCollection(databaseId, config.id)
      console.log(`✓ Collection ${config.name} already exists`)
      return config.id
    } catch (error) {
      // Collection doesn't exist, continue with creation
    }

    // Create collection
    const collection = await databases.createCollection(
      databaseId,
      config.id,
      config.name,
      config.permissions
    )

    console.log(`✓ Created collection: ${config.name}`)

    // Create attributes
    for (const attr of config.attributes) {
      try {
        switch (attr.type) {
          case 'string':
            await databases.createStringAttribute(
              databaseId,
              config.id,
              attr.key,
              attr.size || 255,
              attr.required || false,
              attr.default,
              attr.array || false
            )
            break
          case 'integer':
            await databases.createIntegerAttribute(
              databaseId,
              config.id,
              attr.key,
              attr.required || false,
              null,
              null,
              attr.default,
              attr.array || false
            )
            break
          case 'double':
            await databases.createFloatAttribute(
              databaseId,
              config.id,
              attr.key,
              attr.required || false,
              null,
              null,
              attr.default,
              attr.array || false
            )
            break
          case 'boolean':
            await databases.createBooleanAttribute(
              databaseId,
              config.id,
              attr.key,
              attr.required || false,
              attr.default,
              attr.array || false
            )
            break
          case 'datetime':
            await databases.createDatetimeAttribute(
              databaseId,
              config.id,
              attr.key,
              attr.required || false,
              attr.default,
              attr.array || false
            )
            break
          case 'email':
            await databases.createEmailAttribute(
              databaseId,
              config.id,
              attr.key,
              attr.required || false,
              attr.default,
              attr.array || false
            )
            break
          case 'url':
            await databases.createUrlAttribute(
              databaseId,
              config.id,
              attr.key,
              attr.required || false,
              attr.default,
              attr.array || false
            )
            break
        }
        
        console.log(`  ✓ Created ${attr.type} attribute: ${attr.key}`)
        
        // Wait a bit between attribute creations
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`  ✓ Attribute ${attr.key} already exists`)
        } else {
          console.error(`  ✗ Error creating attribute ${attr.key}:`, error.message)
        }
      }
    }

    // Wait for attributes to be ready
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Create indexes
    for (const index of config.indexes) {
      try {
        await databases.createIndex(
          databaseId,
          config.id,
          index.key,
          index.type,
          index.attributes,
          index.orders
        )
        console.log(`  ✓ Created ${index.type} index: ${index.key}`)
        
        // Wait between index creations
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`  ✓ Index ${index.key} already exists`)
        } else {
          console.error(`  ✗ Error creating index ${index.key}:`, error.message)
        }
      }
    }

    console.log(`✅ Collection ${config.name} setup complete\n`)
    return config.id
  } catch (error: any) {
    console.error(`❌ Error creating collection ${config.name}:`, error.message)
    throw error
  }
}

async function main() {
  console.log('🚀 Starting Appwrite collections initialization...\n')
  
  // Validate environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_APPWRITE_ENDPOINT',
    'NEXT_PUBLIC_APPWRITE_PROJECT',
    'NEXT_PUBLIC_APPWRITE_DATABASE_ID',
    'APPWRITE_API_KEY'
  ]
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`)
      process.exit(1)
    }
  }

  try {
    const createdCollections: string[] = []
    
    // Create all collections
    for (const config of collections) {
      const collectionId = await createCollection(config)
      createdCollections.push(collectionId)
    }

    console.log('🎉 All collections created successfully!')
    console.log('\nCreated collections:')
    createdCollections.forEach(id => console.log(`  - ${id}`))
    
    console.log('\n📝 Update your lib/appwrite.ts with these collection IDs')
    console.log('✅ Collections initialization complete!')
    
  } catch (error) {
    console.error('❌ Failed to initialize collections:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}