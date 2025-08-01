/**
 * Product Services for Appwrite Database
 * 
 * This service replaces static JSON-based product functions with dynamic
 * Appwrite database queries. It maintains the same interface for backward
 * compatibility while adding new database-driven capabilities.
 */

import { Query } from 'appwrite'
import { databases } from '@/lib/appwrite'
import { StoreCode, ProductAvailability } from '@/lib/types'

// Database ID from environment
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!

// Enhanced types with store awareness
export interface ProductFilters {
  categoryId?: string
  featured?: boolean
  specialty?: boolean
  active?: boolean
  priceRange?: { min: number; max: number }
  tags?: string[]
  search?: string
  // Store-specific filters
  store?: StoreCode
  availability?: 'available' | 'low_stock' | 'out_of_stock' | 'all'
  availableAtStore?: StoreCode
  minQuantity?: number
}

export interface ProductQueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  documents: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

/**
 * Product Query Functions
 */

/**
 * Get product by ID
 * @param productId - Product document ID
 * @returns Product document or null
 */
export async function getProductById(productId: string) {
  try {
    const product = await databases.getDocument(
      DATABASE_ID,
      'products',
      productId
    )
    return product
  } catch (error: any) {
    if (error.code === 404) {
      return null
    }
    throw error
  }
}

/**
 * Get product by slug
 * @param slug - Product slug
 * @returns Product document or null
 */
export async function getProductBySlug(slug: string) {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      'products',
      [Query.equal('slug', slug), Query.limit(1)]
    )
    
    return result.documents.length > 0 ? result.documents[0] : null
  } catch (error) {
    console.error('Error fetching product by slug:', error)
    return null
  }
}

/**
 * Get product by legacy ID (for migration compatibility)
 * @param legacyId - Original JSON product ID
 * @returns Product document or null
 */
export async function getProductByLegacyId(legacyId: string) {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      'products',
      [Query.equal('legacyId', legacyId), Query.limit(1)]
    )
    
    return result.documents.length > 0 ? result.documents[0] : null
  } catch (error) {
    console.error('Error fetching product by legacy ID:', error)
    return null
  }
}

/**
 * List products with filtering and pagination
 * @param filters - Product filters
 * @param options - Query options
 * @returns Paginated product results
 */
export async function listProducts(
  filters: ProductFilters = {},
  options: ProductQueryOptions = {}
): Promise<PaginatedResult<any>> {
  try {
    const queries: string[] = []
    
    // Build filters
    if (filters.categoryId) {
      queries.push(Query.equal('categoryId', filters.categoryId))
    }
    
    if (filters.featured !== undefined) {
      queries.push(Query.equal('isFeatured', filters.featured))
    }
    
    if (filters.specialty !== undefined) {
      queries.push(Query.equal('isSpecialty', filters.specialty))
    }
    
    if (filters.active !== undefined) {
      queries.push(Query.equal('isActive', filters.active))
    }
    
    if (filters.priceRange) {
      if (filters.priceRange.min > 0) {
        queries.push(Query.greaterThanEqual('basePrice', filters.priceRange.min))
      }
      if (filters.priceRange.max > 0) {
        queries.push(Query.lessThanEqual('basePrice', filters.priceRange.max))
      }
    }
    
    if (filters.tags && filters.tags.length > 0) {
      queries.push(Query.contains('tags', filters.tags))
    }
    
    if (filters.search) {
      queries.push(Query.search('search', filters.search))
    }
    
    // Apply pagination
    const limit = options.limit || 20
    const offset = options.offset || 0
    queries.push(Query.limit(limit))
    queries.push(Query.offset(offset))
    
    // Apply ordering
    if (options.orderBy) {
      const direction = options.orderDirection === 'desc' ? Query.orderDesc : Query.orderAsc
      queries.push(direction(options.orderBy))
    } else {
      // Default ordering by creation date
      queries.push(Query.orderDesc('$createdAt'))
    }

    const result = await databases.listDocuments(
      DATABASE_ID,
      'products',
      queries
    )

    return {
      documents: result.documents,
      total: result.total,
      limit,
      offset,
      hasMore: offset + limit < result.total,
    }
  } catch (error) {
    console.error('Error listing products:', error)
    throw error
  }
}

/**
 * Get products by category
 * @param categoryId - Category ID
 * @param options - Query options
 * @returns Products in the category
 */
export async function getProductsByCategory(
  categoryId: string,
  options: ProductQueryOptions = {}
) {
  return await listProducts(
    { categoryId, active: true },
    options
  )
}

/**
 * Get featured products
 * @param limit - Number of products to return
 * @returns Featured products
 */
export async function getFeaturedProducts(limit: number = 10) {
  const result = await listProducts(
    { featured: true, active: true },
    { limit, orderBy: '$createdAt', orderDirection: 'desc' }
  )
  
  return result.documents
}

/**
 * Get specialty products (escargots, crabes, etc.)
 * @param limit - Number of products to return
 * @returns Specialty products
 */
export async function getSpecialtyProducts(limit: number = 10) {
  const result = await listProducts(
    { specialty: true, active: true },
    { limit, orderBy: '$createdAt', orderDirection: 'desc' }
  )
  
  return result.documents
}

/**
 * Search products
 * @param searchTerm - Search query
 * @param options - Query options
 * @returns Search results
 */
export async function searchProducts(
  searchTerm: string,
  options: ProductQueryOptions = {}
) {
  return await listProducts(
    { search: searchTerm, active: true },
    options
  )
}

/**
 * Get related products
 * @param productId - Current product ID
 * @param categoryId - Product category ID
 * @param limit - Number of related products
 * @returns Related products
 */
export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit: number = 4
) {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      'products',
      [
        Query.equal('categoryId', categoryId),
        Query.equal('isActive', true),
        Query.notEqual('$id', productId),
        Query.limit(limit),
        Query.orderDesc('$createdAt')
      ]
    )
    
    return result.documents
  } catch (error) {
    console.error('Error fetching related products:', error)
    return []
  }
}

/**
 * Category Query Functions
 */

/**
 * Get all categories
 * @param activeOnly - Only return active categories
 * @returns List of categories
 */
export async function getCategories(activeOnly: boolean = true) {
  try {
    const queries = [
      Query.orderAsc('displayOrder'),
      Query.orderAsc('name')
    ]
    
    if (activeOnly) {
      queries.push(Query.equal('isActive', true))
    }

    const result = await databases.listDocuments(
      DATABASE_ID,
      'categories',
      queries
    )
    
    return result.documents
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

/**
 * Get category by ID
 * @param categoryId - Category document ID
 * @returns Category document or null
 */
export async function getCategoryById(categoryId: string) {
  try {
    const category = await databases.getDocument(
      DATABASE_ID,
      'categories',
      categoryId
    )
    return category
  } catch (error: any) {
    if (error.code === 404) {
      return null
    }
    throw error
  }
}

/**
 * Get category by slug
 * @param slug - Category slug
 * @returns Category document or null
 */
export async function getCategoryBySlug(slug: string) {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      'categories',
      [Query.equal('slug', slug), Query.limit(1)]
    )
    
    return result.documents.length > 0 ? result.documents[0] : null
  } catch (error) {
    console.error('Error fetching category by slug:', error)
    return null
  }
}

/**
 * Get featured categories
 * @param limit - Number of categories to return
 * @returns Featured categories
 */
export async function getFeaturedCategories(limit: number = 6) {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      'categories',
      [
        Query.equal('isFeatured', true),
        Query.equal('isActive', true),
        Query.limit(limit),
        Query.orderAsc('displayOrder')
      ]
    )
    
    return result.documents
  } catch (error) {
    console.error('Error fetching featured categories:', error)
    return []
  }
}

/**
 * Inventory and Stock Functions
 */

/**
 * Check product availability at store
 * @param productId - Product ID
 * @param storeCode - Store code
 * @returns Availability info
 */
export async function checkProductAvailability(productId: string, storeCode: string = 'COCODY') {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      'store_inventory',
      [
        Query.equal('productId', productId),
        Query.equal('store', storeCode),
        Query.limit(1)
      ]
    )
    
    if (result.documents.length === 0) {
      return { available: false, quantity: 0 }
    }
    
    const inventory = result.documents[0]
    const availableQty = inventory.quantityAvailable - inventory.quantityReserved
    
    return {
      available: availableQty > 0,
      quantity: Math.max(0, availableQty),
      lowStock: availableQty <= inventory.lowStockThreshold,
      lastRestocked: inventory.lastRestockedAt,
      nextDelivery: inventory.nextDeliveryAt,
    }
  } catch (error) {
    console.error('Error checking product availability:', error)
    return { available: false, quantity: 0 }
  }
}

/**
 * Get products available at specific store
 * @param storeCode - Store code
 * @param options - Query options
 * @returns Products available at store
 */
export async function getProductsAvailableAtStore(
  storeCode: StoreCode,
  options: ProductQueryOptions = {}
) {
  try {
    // First get products with inventory at this store
    const inventoryResult = await databases.listDocuments(
      DATABASE_ID,
      'store_inventory',
      [
        Query.equal('store', storeCode),
        Query.greaterThan('quantityAvailable', 0),
        Query.limit(options.limit || 50),
        Query.offset(options.offset || 0)
      ]
    )

    if (inventoryResult.documents.length === 0) {
      return { documents: [], total: 0, limit: 0, offset: 0, hasMore: false }
    }

    // Get product IDs
    const productIds = inventoryResult.documents.map(inv => inv.productId)

    // Get product details
    const productsResult = await databases.listDocuments(
      DATABASE_ID,
      'products',
      [
        Query.contains('$id', productIds),
        Query.equal('isActive', true)
      ]
    )

    return {
      documents: productsResult.documents,
      total: inventoryResult.total,
      limit: options.limit || 50,
      offset: options.offset || 0,
      hasMore: (options.offset || 0) + (options.limit || 50) < inventoryResult.total
    }
  } catch (error) {
    console.error('Error getting products available at store:', error)
    return { documents: [], total: 0, limit: 0, offset: 0, hasMore: false }
  }
}

/**
 * Search products with store context and availability
 * @param searchTerm - Search query
 * @param storeCode - Store to check availability
 * @param options - Query options
 * @returns Search results with availability
 */
export async function searchProductsWithStore(
  searchTerm: string,
  storeCode?: StoreCode,
  options: ProductQueryOptions = {}
) {
  try {
    const queries: string[] = [
      Query.search('search', searchTerm),
      Query.equal('isActive', true)
    ]

    // Apply pagination
    const limit = options.limit || 20
    const offset = options.offset || 0
    queries.push(Query.limit(limit))
    queries.push(Query.offset(offset))

    // Apply ordering
    if (options.orderBy) {
      const direction = options.orderDirection === 'desc' ? Query.orderDesc : Query.orderAsc
      queries.push(direction(options.orderBy))
    }

    const result = await databases.listDocuments(
      DATABASE_ID,
      'products',
      queries
    )

    // If store is specified, enrich with availability data
    if (storeCode) {
      const enrichedProducts = await Promise.all(
        result.documents.map(async (product) => {
          const availability = await checkProductAvailability(product.$id, storeCode)
          return {
            ...product,
            storeAvailability: {
              [storeCode]: availability
            }
          }
        })
      )

      return {
        documents: enrichedProducts,
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total,
      }
    }

    return {
      documents: result.documents,
      total: result.total,
      limit,
      offset,
      hasMore: offset + limit < result.total,
    }
  } catch (error) {
    console.error('Error searching products with store:', error)
    throw error
  }
}

/**
 * Get products with cross-store availability comparison
 * @param productIds - Array of product IDs
 * @param stores - Array of store codes to check
 * @returns Products with availability at each store
 */
export async function getProductsWithCrossStoreAvailability(
  productIds: string[],
  stores: StoreCode[] = ['COCODY', 'KOUMASSI']
) {
  try {
    // Get product details
    const productsResult = await databases.listDocuments(
      DATABASE_ID,
      'products',
      [Query.contains('$id', productIds)]
    )

    // Get availability for each product at each store
    const enrichedProducts = await Promise.all(
      productsResult.documents.map(async (product) => {
        const storeAvailability: Record<string, any> = {}
        
        for (const store of stores) {
          storeAvailability[store] = await checkProductAvailability(product.$id, store)
        }

        return {
          ...product,
          storeAvailability
        }
      })
    )

    return enrichedProducts
  } catch (error) {
    console.error('Error getting cross-store availability:', error)
    return []
  }
}

/**
 * Get enhanced product recommendations with store availability
 * @param productId - Current product ID
 * @param storeCode - Store to check availability
 * @param categoryId - Product category ID
 * @param limit - Number of recommendations
 * @returns Recommended products with availability
 */
export async function getProductRecommendationsWithStore(
  productId: string,
  storeCode: StoreCode,
  categoryId?: string,
  limit: number = 4
) {
  try {
    const queries = [
      Query.equal('isActive', true),
      Query.notEqual('$id', productId),
      Query.limit(limit * 2) // Get more to filter for availability
    ]

    if (categoryId) {
      queries.push(Query.equal('categoryId', categoryId))
    }

    const result = await databases.listDocuments(
      DATABASE_ID,
      'products',
      queries
    )

    // Enrich with availability and filter available products
    const availableProducts = []
    for (const product of result.documents) {
      const availability = await checkProductAvailability(product.$id, storeCode)
      if (availability.available) {
        availableProducts.push({
          ...product,
          storeAvailability: { [storeCode]: availability }
        })
        if (availableProducts.length >= limit) break
      }
    }

    return availableProducts
  } catch (error) {
    console.error('Error getting product recommendations with store:', error)
    return []
  }
}

/**
 * Batch availability check for multiple products
 * @param productIds - Array of product IDs
 * @param storeCode - Store code
 * @returns Map of product availability
 */
export async function batchCheckProductAvailability(
  productIds: string[],
  storeCode: StoreCode
): Promise<Map<string, ProductAvailability>> {
  const availabilityMap = new Map<string, ProductAvailability>()

  try {
    // Get inventory records for all products at once
    const inventoryResult = await databases.listDocuments(
      DATABASE_ID,
      'store_inventory',
      [
        Query.contains('productId', productIds),
        Query.equal('store', storeCode),
        Query.limit(productIds.length)
      ]
    )

    // Create availability map
    for (const inventory of inventoryResult.documents) {
      const availableQty = inventory.quantityAvailable - inventory.quantityReserved
      availabilityMap.set(inventory.productId, {
        productId: inventory.productId,
        store: storeCode,
        isAvailable: availableQty > 0,
        quantity: Math.max(0, availableQty),
        isLowStock: availableQty <= inventory.lowStockThreshold,
        lastUpdated: new Date().toISOString(),
        nextRestockDate: inventory.nextDeliveryAt,
      })
    }

    // Add unavailable entries for products not found in inventory
    for (const productId of productIds) {
      if (!availabilityMap.has(productId)) {
        availabilityMap.set(productId, {
          productId,
          store: storeCode,
          isAvailable: false,
          quantity: 0,
          isLowStock: false,
          lastUpdated: new Date().toISOString(),
        })
      }
    }

    return availabilityMap
  } catch (error) {
    console.error('Error in batch availability check:', error)
    // Return empty availability for all products on error
    for (const productId of productIds) {
      availabilityMap.set(productId, {
        productId,
        store: storeCode,
        isAvailable: false,
        quantity: 0,
        isLowStock: false,
        lastUpdated: new Date().toISOString(),
      })
    }
    return availabilityMap
  }
}

/**
 * Get low stock products
 * @param storeCode - Store code
 * @returns Products with low stock
 */
export async function getLowStockProducts(storeCode: string = 'COCODY') {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      'store_inventory',
      [
        Query.equal('store', storeCode),
        Query.lessThanEqual('quantityAvailable', Query.select(['lowStockThreshold'])),
        Query.orderAsc('quantityAvailable')
      ]
    )
    
    return result.documents
  } catch (error) {
    console.error('Error fetching low stock products:', error)
    return []
  }
}

/**
 * Statistics and Analytics
 */

/**
 * Get product statistics
 * @returns Product statistics
 */
export async function getProductStats() {
  try {
    const [
      totalProducts,
      activeProducts,
      featuredProducts,
      specialtyProducts,
      categoriesResult
    ] = await Promise.all([
      databases.listDocuments(DATABASE_ID, 'products', [Query.limit(1)]),
      databases.listDocuments(DATABASE_ID, 'products', [Query.equal('isActive', true), Query.limit(1)]),
      databases.listDocuments(DATABASE_ID, 'products', [Query.equal('isFeatured', true), Query.limit(1)]),
      databases.listDocuments(DATABASE_ID, 'products', [Query.equal('isSpecialty', true), Query.limit(1)]),
      databases.listDocuments(DATABASE_ID, 'categories', [Query.limit(1)])
    ])
    
    return {
      totalProducts: totalProducts.total,
      activeProducts: activeProducts.total,
      featuredProducts: featuredProducts.total,
      specialtyProducts: specialtyProducts.total,
      totalCategories: categoriesResult.total,
    }
  } catch (error) {
    console.error('Error fetching product stats:', error)
    return {
      totalProducts: 0,
      activeProducts: 0,
      featuredProducts: 0,
      specialtyProducts: 0,
      totalCategories: 0,
    }
  }
}

/**
 * Cache utilities (for future implementation)
 */

/**
 * Cache key generator
 * @param type - Cache type
 * @param params - Cache parameters
 * @returns Cache key
 */
export function generateCacheKey(type: string, params: Record<string, any> = {}): string {
  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|')
  
  return `products:${type}:${paramString}`
}

/**
 * Error handling utilities
 */

/**
 * Handle database errors
 * @param error - Database error
 * @param operation - Operation that failed
 * @returns Standardized error
 */
export function handleDatabaseError(error: any, operation: string) {
  console.error(`Database error in ${operation}:`, error)
  
  if (error.code === 404) {
    return new Error('Ressource non trouvée')
  }
  
  if (error.code === 401) {
    return new Error('Accès non autorisé')
  }
  
  if (error.code === 429) {
    return new Error('Trop de requêtes. Veuillez réessayer plus tard')
  }
  
  return new Error('Erreur lors de l\'accès aux données')
}

/**
 * Export enhanced service with store-aware functions
 */
export const productService = {
  // Core product functions
  getProductById,
  getProductBySlug,
  getProductByLegacyId,
  listProducts,
  getProductsByCategory,
  getFeaturedProducts,
  getSpecialtyProducts,
  searchProducts,
  getRelatedProducts,
  
  // Category functions
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  getFeaturedCategories,
  
  // Store-aware functions
  checkProductAvailability,
  getProductsAvailableAtStore,
  searchProductsWithStore,
  getProductsWithCrossStoreAvailability,
  getProductRecommendationsWithStore,
  batchCheckProductAvailability,
  
  // Inventory functions
  getLowStockProducts,
  
  // Statistics
  getProductStats,
}

export default productService