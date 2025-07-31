/**
 * Appwrite Storage Configuration for MonEpice&Riz
 * 
 * This file defines all storage buckets used in the application
 * for file uploads, image management, and document storage.
 * 
 * @fileoverview Storage bucket definitions and configurations
 */

/**
 * Storage bucket identifiers used throughout the application
 * These should match the actual bucket IDs in your Appwrite storage
 */
export const BUCKET_IDS = {
  /** Product images and catalogs */
  productImages: 'product_images',
  
  /** User profile avatars */
  userAvatars: 'user_avatars',
  
  /** Business documents and receipts */
  documents: 'documents',
  
  /** Category images and icons */
  categoryImages: 'category_images',
  
  /** Marketing and promotional materials */
  marketing: 'marketing',
  
  /** System assets and logos */
  system: 'system',
} as const

/**
 * Storage bucket configuration schemas
 * Define permissions, file types, and size limits for each bucket
 */
export const BUCKET_CONFIGS = {
  /**
   * Product Images Bucket Configuration
   * For product photos, galleries, and catalog images
   */
  productImages: {
    bucketId: BUCKET_IDS.productImages,
    name: 'Product Images',
    description: 'Product photos and catalog images',
    permissions: {
      read: ['any'], // Public read access for product display
      create: ['role:admin', 'role:staff'], // Only admin/staff can upload
      update: ['role:admin', 'role:staff'],
      delete: ['role:admin'],
    },
    settings: {
      fileSizeLimit: 5 * 1024 * 1024, // 5MB max file size
      allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
      enableEncryption: false, // Images are public
      enableAntivirus: true,
      enableImageOptimization: true,
    },
    transformations: {
      // Image optimization presets
      thumbnail: { width: 300, height: 300, quality: 80 },
      medium: { width: 600, height: 600, quality: 85 },
      large: { width: 1200, height: 1200, quality: 90 },
      hero: { width: 1920, height: 1080, quality: 95 },
    },
  },

  /**
   * User Avatars Bucket Configuration
   * For customer and staff profile pictures
   */
  userAvatars: {
    bucketId: BUCKET_IDS.userAvatars,
    name: 'User Avatars',
    description: 'User profile pictures and avatars',
    permissions: {
      read: ['role:admin', 'role:staff', 'users'], // Users can see their own and others' avatars
      create: ['users'], // Users can upload their own avatars
      update: ['users'], // Users can update their own avatars
      delete: ['users', 'role:admin'],
    },
    settings: {
      fileSizeLimit: 2 * 1024 * 1024, // 2MB max file size
      allowedFileExtensions: ['jpg', 'jpeg', 'png'],
      enableEncryption: true, // User data should be encrypted
      enableAntivirus: true,
      enableImageOptimization: true,
    },
    transformations: {
      avatar: { width: 150, height: 150, quality: 85 },
      profile: { width: 300, height: 300, quality: 90 },
    },
  },

  /**
   * Documents Bucket Configuration
   * For receipts, invoices, and business documents
   */
  documents: {
    bucketId: BUCKET_IDS.documents,
    name: 'Documents',
    description: 'Business documents, receipts, and legal files',
    permissions: {
      read: ['role:admin', 'role:staff', 'users'], // Restricted access
      create: ['role:admin', 'role:staff', 'users'],
      update: ['role:admin', 'role:staff'],
      delete: ['role:admin'],
    },
    settings: {
      fileSizeLimit: 10 * 1024 * 1024, // 10MB max file size
      allowedFileExtensions: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
      enableEncryption: true, // Documents should be encrypted
      enableAntivirus: true,
      enableImageOptimization: false, // Not needed for documents
    },
    transformations: {
      preview: { width: 400, height: 600, quality: 75 }, // For PDF previews
    },
  },

  /**
   * Category Images Bucket Configuration
   * For category icons, banners, and promotional images
   */
  categoryImages: {
    bucketId: BUCKET_IDS.categoryImages,
    name: 'Category Images',
    description: 'Category icons, banners, and promotional materials',
    permissions: {
      read: ['any'], // Public read access for category display
      create: ['role:admin', 'role:staff'],
      update: ['role:admin', 'role:staff'],
      delete: ['role:admin'],
    },
    settings: {
      fileSizeLimit: 3 * 1024 * 1024, // 3MB max file size
      allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
      enableEncryption: false, // Public images
      enableAntivirus: true,
      enableImageOptimization: true,
    },
    transformations: {
      icon: { width: 64, height: 64, quality: 80 },
      card: { width: 300, height: 200, quality: 85 },
      banner: { width: 800, height: 400, quality: 90 },
    },
  },

  /**
   * Marketing Bucket Configuration
   * For promotional materials, banners, and marketing assets
   */
  marketing: {
    bucketId: BUCKET_IDS.marketing,
    name: 'Marketing Materials',
    description: 'Promotional banners, ads, and marketing content',
    permissions: {
      read: ['any'], // Public read access for marketing display
      create: ['role:admin', 'role:staff'],
      update: ['role:admin', 'role:staff'],
      delete: ['role:admin'],
    },
    settings: {
      fileSizeLimit: 8 * 1024 * 1024, // 8MB max file size
      allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      enableEncryption: false, // Public marketing materials
      enableAntivirus: true,
      enableImageOptimization: true,
    },
    transformations: {
      mobile: { width: 375, height: 200, quality: 80 },
      tablet: { width: 768, height: 400, quality: 85 },
      desktop: { width: 1200, height: 600, quality: 90 },
      hero: { width: 1920, height: 800, quality: 95 },
    },
  },

  /**
   * System Assets Bucket Configuration
   * For logos, icons, and system-level assets
   */
  system: {
    bucketId: BUCKET_IDS.system,
    name: 'System Assets',
    description: 'Application logos, icons, and system assets',
    permissions: {
      read: ['any'], // Public read access for system display
      create: ['role:admin'],
      update: ['role:admin'],
      delete: ['role:admin'],
    },
    settings: {
      fileSizeLimit: 2 * 1024 * 1024, // 2MB max file size
      allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp', 'svg', 'ico'],
      enableEncryption: false, // Public system assets
      enableAntivirus: true,
      enableImageOptimization: true,
    },
    transformations: {
      favicon: { width: 32, height: 32, quality: 100 },
      logo: { width: 200, height: 200, quality: 95 },
      ogImage: { width: 1200, height: 630, quality: 90 },
    },
  },
} as const

/**
 * File type validation mappings
 * MIME types allowed for each file extension
 */
export const ALLOWED_MIME_TYPES = {
  // Images
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  
  // Documents
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const

/**
 * Storage paths and URL templates
 * Consistent URL patterns for different asset types
 */
export const STORAGE_PATHS = {
  /**
   * Product image paths
   */
  products: {
    main: (productId: string) => `products/${productId}/main`,
    gallery: (productId: string, index: number) => `products/${productId}/gallery/${index}`,
    thumbnail: (productId: string) => `products/${productId}/thumbnail`,
  },
  
  /**
   * User avatar paths
   */
  users: {
    avatar: (userId: string) => `users/${userId}/avatar`,
    profile: (userId: string) => `users/${userId}/profile`,
  },
  
  /**
   * Category image paths
   */
  categories: {
    icon: (categoryId: string) => `categories/${categoryId}/icon`,
    banner: (categoryId: string) => `categories/${categoryId}/banner`,
    card: (categoryId: string) => `categories/${categoryId}/card`,
  },
  
  /**
   * Marketing material paths
   */
  marketing: {
    banner: (campaignId: string) => `marketing/banners/${campaignId}`,
    promotion: (promoId: string) => `marketing/promotions/${promoId}`,
    social: (platform: string, assetId: string) => `marketing/social/${platform}/${assetId}`,
  },
  
  /**
   * System asset paths
   */
  system: {
    logo: (variant: string) => `system/logos/${variant}`,
    icon: (name: string) => `system/icons/${name}`,
    favicon: () => 'system/favicon',
  },
  
  /**
   * Document paths
   */
  documents: {
    receipt: (orderId: string) => `documents/receipts/${orderId}`,
    invoice: (invoiceId: string) => `documents/invoices/${invoiceId}`,
    legal: (documentType: string) => `documents/legal/${documentType}`,
  },
} as const

/**
 * Image transformation presets for common use cases
 */
export const IMAGE_PRESETS = {
  // E-commerce product images
  productThumbnail: { width: 150, height: 150, quality: 80, format: 'webp' },
  productCard: { width: 300, height: 300, quality: 85, format: 'webp' },
  productDetail: { width: 600, height: 600, quality: 90, format: 'webp' },
  productZoom: { width: 1200, height: 1200, quality: 95, format: 'webp' },
  
  // User interface elements
  avatar: { width: 80, height: 80, quality: 85, format: 'webp' },
  profilePicture: { width: 200, height: 200, quality: 90, format: 'webp' },
  
  // Marketing and promotional
  banner: { width: 800, height: 400, quality: 85, format: 'webp' },
  hero: { width: 1200, height: 600, quality: 90, format: 'webp' },
  socialMedia: { width: 1200, height: 630, quality: 85, format: 'webp' },
  
  // Category and navigation
  categoryIcon: { width: 64, height: 64, quality: 80, format: 'webp' },
  categoryCard: { width: 200, height: 150, quality: 85, format: 'webp' },
} as const

/**
 * Helper functions for storage operations
 */

/**
 * Get bucket configuration by ID
 */
export const getBucketConfig = (bucketId: keyof typeof BUCKET_IDS) => {
  return BUCKET_CONFIGS[bucketId]
}

/**
 * Validate file extension against bucket allowed types
 */
export const isFileTypeAllowed = (bucketId: keyof typeof BUCKET_IDS, extension: string): boolean => {
  const config = getBucketConfig(bucketId)
  return config.settings.allowedFileExtensions.includes(extension.toLowerCase())
}

/**
 * Check if file size is within bucket limits
 */
export const isFileSizeValid = (bucketId: keyof typeof BUCKET_IDS, fileSize: number): boolean => {
  const config = getBucketConfig(bucketId)
  return fileSize <= config.settings.fileSizeLimit
}

/**
 * Generate file path using predefined patterns
 */
export const generateFilePath = (
  category: keyof typeof STORAGE_PATHS,
  type: string,
  ...params: string[]
): string => {
  const pathGenerator = STORAGE_PATHS[category][type as keyof typeof STORAGE_PATHS[typeof category]]
  if (typeof pathGenerator === 'function') {
    return pathGenerator(...params)
  }
  return pathGenerator
}

/**
 * Get MIME type for file extension
 */
export const getMimeType = (extension: string): string | undefined => {
  return ALLOWED_MIME_TYPES[extension.toLowerCase() as keyof typeof ALLOWED_MIME_TYPES]
}

/**
 * Build image transformation URL
 */
export const buildImageUrl = (
  baseUrl: string,
  preset: keyof typeof IMAGE_PRESETS
): string => {
  const transformation = IMAGE_PRESETS[preset]
  const params = new URLSearchParams()
  
  Object.entries(transformation).forEach(([key, value]) => {
    params.append(key, value.toString())
  })
  
  return `${baseUrl}?${params.toString()}`
}

/**
 * Export types for TypeScript usage
 */
export type BucketId = keyof typeof BUCKET_IDS
export type BucketConfig = typeof BUCKET_CONFIGS[BucketId]
export type ImagePreset = keyof typeof IMAGE_PRESETS
export type StoragePathCategory = keyof typeof STORAGE_PATHS

/**
 * All bucket IDs as an array for iteration
 */
export const ALL_BUCKET_IDS = Object.values(BUCKET_IDS)

/**
 * Bucket names mapped to their IDs for reverse lookup
 */
export const BUCKET_NAMES = Object.fromEntries(
  Object.entries(BUCKET_IDS).map(([key, value]) => [value, key])
) as Record<string, BucketId>