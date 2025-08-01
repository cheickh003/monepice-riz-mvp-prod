/**
 * Appwrite Collection Configuration for MonEpice&Riz
 * 
 * This file defines all database collections used in the application.
 * Each collection includes its ID, name, and schema definition for
 * documentation and type safety purposes.
 * 
 * @fileoverview Database collection definitions and schemas
 */

/**
 * Collection identifiers used throughout the application
 * These should match the actual collection IDs in your Appwrite database
 */
export const COLLECTION_IDS = {
  // User-related collections
  users: 'users',
  customers: 'customers',
  addresses: 'addresses',
  
  // Product-related collections
  products: 'products',
  categories: 'categories',
  storeInventory: 'store_inventory',
  
  // Store-related collections
  stores: 'stores',
  
  // Order-related collections
  orders: 'orders',
  orderItems: 'order_items',
  
  // Shopping-related collections
  cartItems: 'cart_items',
  favorites: 'favorites',
  
  // System collections
  notifications: 'notifications',
} as const

/**
 * Collection schema definitions for documentation and validation
 * These describe the expected structure of documents in each collection
 */
export const COLLECTION_SCHEMAS = {
  /**
   * Users Collection Schema
   * Extends Appwrite's built-in user model with additional fields
   */
  users: {
    collectionId: COLLECTION_IDS.users,
    name: 'Users',
    description: 'Extended user profiles with business-specific information',
    attributes: {
      /** Reference to Appwrite auth user ID */
      authUserId: { type: 'string', required: true, size: 255 },
      
      /** User role in the system */
      role: { type: 'string', required: true, default: 'customer', size: 50 },
      
      /** Phone number in Côte d'Ivoire format (+225XXXXXXXX) */
      phone: { type: 'string', required: true, size: 20 },
      
      /** Phone verification status */
      phoneVerified: { type: 'boolean', required: true, default: false },
      
      /** Last activity timestamp */
      lastActiveAt: { type: 'string', required: false, size: 30 },
      
      /** Account status */
      status: { type: 'string', required: true, default: 'active', size: 20 },
    },
    indexes: [
      { key: 'authUserId', type: 'unique', attributes: ['authUserId'] },
      { key: 'phone', type: 'unique', attributes: ['phone'] },
      { key: 'role', type: 'key', attributes: ['role'] },
      { key: 'status', type: 'key', attributes: ['status'] },
    ],
  },

  /**
   * Customers Collection Schema
   * Detailed customer profiles for e-commerce functionality
   */
  customers: {
    collectionId: COLLECTION_IDS.customers,
    name: 'Customers',
    description: 'Customer profiles with loyalty and order history',
    attributes: {
      /** Reference to user ID */
      userId: { type: 'string', required: true, size: 255 },
      
      /** Loyalty points balance */
      loyaltyPoints: { type: 'integer', required: true, default: 0 },
      
      /** Total number of completed orders */
      totalOrders: { type: 'integer', required: true, default: 0 },
      
      /** Total amount spent (in FCFA) */
      totalSpent: { type: 'double', required: true, default: 0.0 },
      
      /** Customer tier based on activity */
      tier: { type: 'string', required: true, default: 'new', size: 20 },
      
      /** Preferred store location */
      preferredStore: { type: 'string', required: false, size: 20 },
      
      /** Last order timestamp */
      lastOrderAt: { type: 'string', required: false, size: 30 },
      
      /** Marketing consent */
      marketingConsent: { type: 'boolean', required: true, default: false },
      
      /** Date of birth for age-based promotions */
      dateOfBirth: { type: 'string', required: false, size: 30 },
    },
    indexes: [
      { key: 'userId', type: 'unique', attributes: ['userId'] },
      { key: 'tier', type: 'key', attributes: ['tier'] },
      { key: 'preferredStore', type: 'key', attributes: ['preferredStore'] },
      { key: 'totalSpent', type: 'key', attributes: ['totalSpent'] },
      { key: 'lastOrderAt', type: 'key', attributes: ['lastOrderAt'] },
    ],
  },

  /**
   * Addresses Collection Schema
   * Customer delivery addresses
   */
  addresses: {
    collectionId: COLLECTION_IDS.addresses,
    name: 'Addresses',
    description: 'Customer delivery addresses for orders',
    attributes: {
      /** Customer ID this address belongs to */
      customerId: { type: 'string', required: true, size: 255 },
      
      /** Address label (Home, Work, etc.) */
      label: { type: 'string', required: true, size: 50 },
      
      /** Street address */
      street: { type: 'string', required: true, size: 500 },
      
      /** Zone/district in Abidjan */
      zone: { type: 'string', required: true, size: 100 },
      
      /** Building name or number */
      building: { type: 'string', required: false, size: 100 },
      
      /** Apartment/unit number */
      apartment: { type: 'string', required: false, size: 50 },
      
      /** City (default: Abidjan) */
      city: { type: 'string', required: true, default: 'Abidjan', size: 50 },
      
      /** GPS latitude */
      latitude: { type: 'double', required: false },
      
      /** GPS longitude */
      longitude: { type: 'double', required: false },
      
      /** Delivery instructions */
      instructions: { type: 'string', required: false, size: 1000 },
      
      /** Is this the default address */
      isDefault: { type: 'boolean', required: true, default: false },
      
      /** Is address currently active */
      isActive: { type: 'boolean', required: true, default: true },
    },
    indexes: [
      { key: 'customerId', type: 'key', attributes: ['customerId'] },
      { key: 'zone', type: 'key', attributes: ['zone'] },
      { key: 'isDefault', type: 'key', attributes: ['isDefault'] },
      { key: 'isActive', type: 'key', attributes: ['isActive'] },
    ],
  },

  /**
   * Stores Collection Schema
   * Physical store locations
   */
  stores: {
    collectionId: COLLECTION_IDS.stores,
    name: 'Stores',
    description: 'Physical store locations and information',
    attributes: {
      /** Store name */
      name: { type: 'string', required: true, size: 100 },
      
      /** Store code (COCODY, KOUMASSI) */
      code: { type: 'string', required: true, size: 20 },
      
      /** Store address */
      address: { type: 'string', required: true, size: 500 },
      
      /** Store phone number */
      phone: { type: 'string', required: true, size: 20 },
      
      /** Store email */
      email: { type: 'string', required: false, size: 100 },
      
      /** GPS latitude */
      latitude: { type: 'double', required: false },
      
      /** GPS longitude */
      longitude: { type: 'double', required: false },
      
      /** Opening hours (JSON string) */
      openingHours: { type: 'string', required: false, size: 1000 },
      
      /** Is store active */
      isActive: { type: 'boolean', required: true, default: true },
      
      /** Delivery radius in km */
      deliveryRadius: { type: 'integer', required: true, default: 10 },
    },
    indexes: [
      { key: 'code', type: 'unique', attributes: ['code'] },
      { key: 'isActive', type: 'key', attributes: ['isActive'] },
    ],
  },

  /**
   * Categories Collection Schema
   * Product categories for the e-commerce catalog
   */
  categories: {
    collectionId: COLLECTION_IDS.categories,
    name: 'Categories',
    description: 'Product categories for organizing the catalog',
    attributes: {
      /** Category name */
      name: { type: 'string', required: true, size: 100 },
      
      /** URL-friendly slug */
      slug: { type: 'string', required: true, size: 100 },
      
      /** Category description */
      description: { type: 'string', required: false, size: 500 },
      
      /** Category image URL */
      imageUrl: { type: 'string', required: false, size: 255 },
      
      /** Parent category ID for hierarchy */
      parentId: { type: 'string', required: false, size: 255 },
      
      /** Display order for sorting */
      displayOrder: { type: 'integer', required: true, default: 0 },
      
      /** Is category active/visible */
      isActive: { type: 'boolean', required: true, default: true },
      
      /** Is featured category */
      isFeatured: { type: 'boolean', required: true, default: false },
      
      /** Legacy ID for migration */
      legacyId: { type: 'string', required: false, size: 100 },
    },
    indexes: [
      { key: 'slug', type: 'unique', attributes: ['slug'] },
      { key: 'parentId', type: 'key', attributes: ['parentId'] },
      { key: 'displayOrder', type: 'key', attributes: ['displayOrder'] },
      { key: 'isActive', type: 'key', attributes: ['isActive'] },
      { key: 'isFeatured', type: 'key', attributes: ['isFeatured'] },
      { key: 'legacyId', type: 'unique', attributes: ['legacyId'] },
    ],
  },

  /**
   * Products Collection Schema
   * Product catalog with detailed information
   */
  products: {
    collectionId: COLLECTION_IDS.products,
    name: 'Products',
    description: 'Product catalog with pricing and details',
    attributes: {
      /** Product name */
      name: { type: 'string', required: true, size: 200 },
      
      /** URL-friendly slug */
      slug: { type: 'string', required: true, size: 200 },
      
      /** Product description */
      description: { type: 'string', required: false, size: 2000 },
      
      /** Short description for listings */
      shortDescription: { type: 'string', required: false, size: 500 },
      
      /** Category ID */
      categoryId: { type: 'string', required: true, size: 255 },
      
      /** Base price in FCFA */
      basePrice: { type: 'double', required: true },
      
      /** Promotional price (if any) */
      promoPrice: { type: 'double', required: false },
      
      /** Main product image URL */
      imageUrl: { type: 'string', required: true, size: 255 },
      
      /** Additional image URLs (array) */
      images: { type: 'string', required: false, size: 255, array: true },
      
      /** Unit of measurement (kg, pièce, etc.) */
      unit: { type: 'string', required: true, default: 'unité', size: 50 },
      
      /** Weight in grams (for shipping calculations) */
      weight: { type: 'double', required: false },
      
      /** SKU/reference code */
      sku: { type: 'string', required: false, size: 100 },
      
      /** Legacy ID for migration */
      legacyId: { type: 'string', required: false, size: 100 },
      
      /** Is product active/available */
      isActive: { type: 'boolean', required: true, default: true },
      
      /** Is featured product */
      isFeatured: { type: 'boolean', required: true, default: false },
      
      /** Is specialty product (escargots, crabes) */
      isSpecialty: { type: 'boolean', required: true, default: false },
      
      /** Product tags for search */
      tags: { type: 'string', required: false, size: 100, array: true },
      
      /** Nutritional information */
      nutrition: { type: 'string', required: false, size: 1000 },
      
      /** Storage instructions */
      storage: { type: 'string', required: false, size: 500 },
      
      /** Origin information */
      origin: { type: 'string', required: false, size: 200 },
    },
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
  },

  /**
   * Store Inventory Collection Schema
   * Track product availability by store location
   */
  storeInventory: {
    collectionId: COLLECTION_IDS.storeInventory,
    name: 'Store Inventory',
    description: 'Product inventory levels by store location',
    attributes: {
      /** Store location code */
      store: { type: 'string', required: true, size: 50 },
      
      /** Product ID */
      productId: { type: 'string', required: true, size: 255 },
      
      /** Available quantity */
      quantityAvailable: { type: 'integer', required: true, default: 0 },
      
      /** Reserved quantity (in active carts) */
      quantityReserved: { type: 'integer', required: true, default: 0 },
      
      /** Low stock alert threshold */
      lowStockThreshold: { type: 'integer', required: true, default: 10 },
      
      /** Last restocked date */
      lastRestockedAt: { type: 'string', required: false, size: 30 },
      
      /** Next expected delivery */
      nextDeliveryAt: { type: 'string', required: false, size: 30 },
    },
    indexes: [
      { key: 'storeProduct', type: 'unique', attributes: ['store', 'productId'] },
      { key: 'store', type: 'key', attributes: ['store'] },
      { key: 'productId', type: 'key', attributes: ['productId'] },
      { key: 'quantityAvailable', type: 'key', attributes: ['quantityAvailable'] },
    ],
  },

  /**
   * Orders Collection Schema
   * Customer orders with status tracking
   */
  orders: {
    collectionId: COLLECTION_IDS.orders,
    name: 'Orders',
    description: 'Customer orders with delivery and payment information',
    attributes: {
      /** Unique order number for customer reference */
      orderNumber: { type: 'string', required: true, size: 50 },
      
      /** Customer ID */
      customerId: { type: 'string', required: true, size: 255 },
      
      /** Store location */
      store: { type: 'string', required: true, size: 50 },
      
      /** Order status */
      status: { type: 'string', required: true, default: 'NEW', size: 50 },
      
      /** Payment status */
      paymentStatus: { type: 'string', required: true, default: 'PENDING', size: 50 },
      
      /** Payment method used */
      paymentMethod: { type: 'string', required: false, size: 50 },
      
      /** Subtotal (before fees) */
      subtotal: { type: 'double', required: true },
      
      /** Delivery fee */
      deliveryFee: { type: 'double', required: true, default: 0.0 },
      
      /** Total amount */
      total: { type: 'double', required: true },
      
      /** Delivery type (home, pickup) */
      deliveryType: { type: 'string', required: true, size: 50 },
      
      /** Delivery address (JSON string) */
      deliveryAddress: { type: 'string', required: false, size: 2000 },
      
      /** Scheduled delivery date */
      scheduledDeliveryAt: { type: 'string', required: false, size: 30 },
      
      /** Actual delivery date */
      deliveredAt: { type: 'string', required: false, size: 30 },
      
      /** CinetPay transaction ID */
      cinetpayTransId: { type: 'string', required: false, size: 100 },
      
      /** Order notes */
      notes: { type: 'string', required: false, size: 1000 },
      
      /** Cancellation reason */
      cancellationReason: { type: 'string', required: false, size: 500 },
    },
    indexes: [
      { key: 'orderNumber', type: 'unique', attributes: ['orderNumber'] },
      { key: 'customerId', type: 'key', attributes: ['customerId'] },
      { key: 'store', type: 'key', attributes: ['store'] },
      { key: 'status', type: 'key', attributes: ['status'] },
      { key: 'paymentStatus', type: 'key', attributes: ['paymentStatus'] },
      { key: 'cinetpayTransId', type: 'unique', attributes: ['cinetpayTransId'] },
      { key: 'scheduledDeliveryAt', type: 'key', attributes: ['scheduledDeliveryAt'] },
    ],
  },

  /**
   * Order Items Collection Schema
   * Individual items within an order
   */
  orderItems: {
    collectionId: COLLECTION_IDS.orderItems,
    name: 'Order Items',
    description: 'Individual products within customer orders',
    attributes: {
      /** Order ID this item belongs to */
      orderId: { type: 'string', required: true, size: 255 },
      
      /** Product ID */
      productId: { type: 'string', required: true, size: 255 },
      
      /** Product name (snapshot) */
      productName: { type: 'string', required: true, size: 200 },
      
      /** Unit price at time of order */
      unitPrice: { type: 'double', required: true },
      
      /** Quantity ordered */
      quantity: { type: 'integer', required: true },
      
      /** Total price for this item */
      totalPrice: { type: 'double', required: true },
      
      /** Product unit (snapshot) */
      unit: { type: 'string', required: true, size: 50 },
      
      /** Product image URL (snapshot) */
      imageUrl: { type: 'string', required: false, size: 255 },
    },
    indexes: [
      { key: 'orderId', type: 'key', attributes: ['orderId'] },
      { key: 'productId', type: 'key', attributes: ['productId'] },
    ],
  },

  /**
   * Cart Items Collection Schema
   * Persistent shopping cart items
   */
  cartItems: {
    collectionId: COLLECTION_IDS.cartItems,
    name: 'Cart Items',
    description: 'Shopping cart items for registered users',
    attributes: {
      /** Customer ID */
      customerId: { type: 'string', required: true, size: 255 },
      
      /** Product ID */
      productId: { type: 'string', required: true, size: 255 },
      
      /** Store location */
      store: { type: 'string', required: true, size: 50 },
      
      /** Quantity in cart */
      quantity: { type: 'integer', required: true },
      
      /** When item was added */
      addedAt: { type: 'string', required: true, size: 30 },
      
      /** When item was last updated */
      updatedAt: { type: 'string', required: true, size: 30 },
    },
    indexes: [
      { key: 'customerProduct', type: 'unique', attributes: ['customerId', 'productId', 'store'] },
      { key: 'customerId', type: 'key', attributes: ['customerId'] },
      { key: 'store', type: 'key', attributes: ['store'] },
      { key: 'addedAt', type: 'key', attributes: ['addedAt'] },
    ],
  },

  /**
   * Favorites Collection Schema
   * Customer favorite products
   */
  favorites: {
    collectionId: COLLECTION_IDS.favorites,
    name: 'Favorites',
    description: 'Customer favorite products for quick access',
    attributes: {
      /** Customer ID */
      customerId: { type: 'string', required: true, size: 255 },
      
      /** Product ID */
      productId: { type: 'string', required: true, size: 255 },
      
      /** When product was favorited */
      favoritedAt: { type: 'string', required: true, size: 30 },
    },
    indexes: [
      { key: 'customerProduct', type: 'unique', attributes: ['customerId', 'productId'] },
      { key: 'customerId', type: 'key', attributes: ['customerId'] },
      { key: 'productId', type: 'key', attributes: ['productId'] },
      { key: 'favoritedAt', type: 'key', attributes: ['favoritedAt'] },
    ],
  },

  /**
   * Notifications Collection Schema
   * System notifications for users
   */
  notifications: {
    collectionId: COLLECTION_IDS.notifications,
    name: 'Notifications',
    description: 'System notifications and alerts for users',
    attributes: {
      /** User ID */
      userId: { type: 'string', required: true, size: 255 },
      
      /** Notification type */
      type: { type: 'string', required: true, size: 50 },
      
      /** Notification title */
      title: { type: 'string', required: true, size: 200 },
      
      /** Notification message */
      message: { type: 'string', required: true, size: 1000 },
      
      /** Related entity ID (order, product, etc.) */
      entityId: { type: 'string', required: false, size: 255 },
      
      /** Related entity type */
      entityType: { type: 'string', required: false, size: 50 },
      
      /** Is notification read */
      isRead: { type: 'boolean', required: true, default: false },
      
      /** Is notification archived */
      isArchived: { type: 'boolean', required: true, default: false },
      
      /** When notification was read */
      readAt: { type: 'string', required: false, size: 30 },
      
      /** Notification priority */
      priority: { type: 'string', required: true, default: 'normal', size: 20 },
    },
    indexes: [
      { key: 'userId', type: 'key', attributes: ['userId'] },
      { key: 'type', type: 'key', attributes: ['type'] },
      { key: 'isRead', type: 'key', attributes: ['isRead'] },
      { key: 'isArchived', type: 'key', attributes: ['isArchived'] },
      { key: 'priority', type: 'key', attributes: ['priority'] },
      { key: 'entityId', type: 'key', attributes: ['entityId'] },
    ],
  },
} as const

/**
 * Export types for TypeScript usage
 */
export type CollectionId = keyof typeof COLLECTION_IDS
export type CollectionSchema = typeof COLLECTION_SCHEMAS[CollectionId]

/**
 * Helper function to get collection ID by name
 */
export const getCollectionId = (collection: CollectionId): string => {
  return COLLECTION_IDS[collection]
}

/**
 * Helper function to get collection schema
 */
export const getCollectionSchema = (collection: CollectionId): CollectionSchema => {
  return COLLECTION_SCHEMAS[collection]
}

/**
 * All collection IDs as an array for iteration
 */
export const ALL_COLLECTION_IDS = Object.values(COLLECTION_IDS)

/**
 * Collection names mapped to their IDs for reverse lookup
 */
export const COLLECTION_NAMES = Object.fromEntries(
  Object.entries(COLLECTION_IDS).map(([key, value]) => [value, key])
) as Record<string, CollectionId>