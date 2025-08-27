import { apiClient, MedusaProduct, MedusaCategory } from './api/client'
import { Product, Category } from './types'

// Transform Medusa product to our frontend Product type
function transformMedusaProduct(medusaProduct: MedusaProduct): Product {
  const variant = medusaProduct.variants[0] // Use first variant
  const price = variant?.prices[0]?.amount || 0
  const image = medusaProduct.images[0]?.url || '/images/products/placeholder.jpg'

  return {
    id: parseInt(medusaProduct.id) || 0, // Convert string ID to number for compatibility
    ref: medusaProduct.metadata?.ref || medusaProduct.id,
    barcode: medusaProduct.metadata?.barcode || '',
    name: medusaProduct.title,
    slug: medusaProduct.handle,
    category: medusaProduct.categories?.[0]?.name || 'Non classé',
    mainCategory: medusaProduct.categories?.[0]?.handle || 'other',
    price: price,
    priceHT: price,
    priceTTC: price,
    currency: variant?.prices[0]?.currency_code || 'XOF',
    unit: medusaProduct.metadata?.unit || 'unité',
    stock: variant?.inventory_quantity && variant.inventory_quantity > 0 ? 'in_stock' as const : 'out_of_stock' as const,
    images: medusaProduct.images.map(img => img.url),
    description: medusaProduct.description || '',
    brand: medusaProduct.metadata?.brand || '',
    isFeatured: medusaProduct.metadata?.isFeatured === 'true',
    isPromo: medusaProduct.metadata?.isPromo === 'true',
    promoPrice: medusaProduct.metadata?.promoPrice ? parseInt(medusaProduct.metadata.promoPrice) : undefined,
    nutritionalInfo: medusaProduct.metadata?.nutritionalInfo,
    allergens: medusaProduct.metadata?.allergens,
    origin: medusaProduct.metadata?.origin,
    conservation: medusaProduct.metadata?.conservation,
    // Add Medusa-specific fields
    medusaId: medusaProduct.id,
    variantId: variant?.id
  }
}

// Transform Medusa category to our frontend Category type
function transformMedusaCategory(medusaCategory: MedusaCategory): Category {
  return {
    id: medusaCategory.handle,
    name: medusaCategory.name,
    slug: medusaCategory.handle,
    description: medusaCategory.description || '',
    productCount: medusaCategory.products?.length || 0
  }
}

// Cache for products and categories to reduce API calls
let productsCache: Product[] | null = null
let categoriesCache: Category[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function isCacheValid(): boolean {
  return Date.now() - cacheTimestamp < CACHE_DURATION
}

export async function getProducts(): Promise<Product[]> {
  if (productsCache && isCacheValid()) {
    return productsCache
  }

  try {
    const response = await apiClient.getProducts()
    if (response.success && response.data) {
      productsCache = response.data.map(transformMedusaProduct)
      cacheTimestamp = Date.now()
      return productsCache
    }
  } catch (error) {
    console.error('Failed to fetch products from API:', error)
  }

  // Fallback to empty array if API fails
  return []
}

export async function getCategories(): Promise<Category[]> {
  if (categoriesCache && isCacheValid()) {
    return categoriesCache
  }

  try {
    const response = await apiClient.getCategories()
    if (response.success && response.data) {
      categoriesCache = response.data.map(transformMedusaCategory)
      cacheTimestamp = Date.now()
      return categoriesCache
    }
  } catch (error) {
    console.error('Failed to fetch categories from API:', error)
  }

  // Fallback to empty array if API fails
  return []
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const products = await getProducts()
  return products.find(p => p.id === id)
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    const response = await apiClient.getProductByHandle(slug)
    if (response.success && response.data) {
      return transformMedusaProduct(response.data)
    }
  } catch (error) {
    console.error('Failed to fetch product by slug:', error)
  }

  // Fallback to searching in cached products
  const products = await getProducts()
  return products.find(p => p.slug === slug)
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const products = await getProducts()
  
  if (categorySlug === 'promo') {
    return products.filter(p => p.isPromo)
  }
  
  return products.filter(p => p.mainCategory === categorySlug)
}

export async function getFeaturedProducts(limit: number = 8): Promise<Product[]> {
  const products = await getProducts()
  return products
    .filter(p => p.isFeatured)
    .slice(0, limit)
}

export async function getPromoProducts(limit: number = 8): Promise<Product[]> {
  const products = await getProducts()
  return products
    .filter(p => p.isPromo)
    .slice(0, limit)
}

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    // Try API search first
    const response = await apiClient.getProducts({ search: query })
    if (response.success && response.data) {
      return response.data.map(transformMedusaProduct)
    }
  } catch (error) {
    console.error('API search failed, falling back to local search:', error)
  }

  // Fallback to local search
  const products = await getProducts()
  const searchTerm = query.toLowerCase()
  return products.filter(p => 
    p.name.toLowerCase().includes(searchTerm) ||
    p.category.toLowerCase().includes(searchTerm) ||
    p.brand.toLowerCase().includes(searchTerm) ||
    p.description.toLowerCase().includes(searchTerm)
  )
}

export async function getRelatedProducts(product: Product, limit: number = 4): Promise<Product[]> {
  const products = await getProducts()
  return products
    .filter(p => 
      p.id !== product.id && 
      (p.mainCategory === product.mainCategory || p.category === product.category)
    )
    .slice(0, limit)
}

export async function getCategoryById(id: string): Promise<Category | undefined> {
  const categories = await getCategories()
  return categories.find(c => c.id === id)
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const categories = await getCategories()
  return categories.find(c => c.slug === slug)
}

// Clear cache function for manual refresh
export function clearCache(): void {
  productsCache = null
  categoriesCache = null
  cacheTimestamp = 0
}

// Preload products and categories (useful for app initialization)
export async function preloadData(): Promise<{ products: Product[], categories: Category[] }> {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories()
  ])
  
  return { products, categories }
}