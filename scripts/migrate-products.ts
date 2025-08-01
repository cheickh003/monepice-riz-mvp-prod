/**
 * Product Data Migration Script
 * 
 * This script migrates existing product and category data from JSON files
 * to Appwrite collections. It handles data transformation, batch uploads,
 * and provides progress tracking.
 * 
 * Usage: npx tsx scripts/migrate-products.ts
 */

import { Client, Databases, ID, Query } from 'appwrite'
import { config } from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
config()

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
  .setKey(process.env.APPWRITE_API_KEY!)

const databases = new Databases(client)
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!

// Configuration
const BATCH_SIZE = 100
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

// Types for existing JSON data
interface JSONProduct {
  id: string
  name: string
  category: string
  price: number
  originalPrice?: number
  image: string
  images?: string[]
  description?: string
  unit: string
  weight?: number
  inStock: boolean
  featured?: boolean
  specialty?: boolean
  tags?: string[]
  nutrition?: string
  storage?: string
  origin?: string
}

interface JSONCategory {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  featured?: boolean
  parentId?: string
  order?: number
}

// Progress tracking
class ProgressTracker {
  private total: number
  private completed: number = 0
  private failed: number = 0

  constructor(total: number) {
    this.total = total
  }

  update(success: boolean = true) {
    if (success) {
      this.completed++
    } else {
      this.failed++
    }
    this.display()
  }

  display() {
    const percentage = Math.round(((this.completed + this.failed) / this.total) * 100)
    const bar = '█'.repeat(Math.floor(percentage / 2)) + '░'.repeat(50 - Math.floor(percentage / 2))
    process.stdout.write(`\r[${bar}] ${percentage}% (${this.completed}/${this.total}) Success: ${this.completed}, Failed: ${this.failed}`)
  }

  finish() {
    console.log(`\n✅ Migration complete: ${this.completed} successful, ${this.failed} failed`)
  }
}

// Utility functions
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function retryOperation<T>(operation: () => Promise<T>, retries: number = MAX_RETRIES): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (retries > 0) {
      await delay(RETRY_DELAY)
      return retryOperation(operation, retries - 1)
    }
    throw error
  }
}

// Check if document already exists
async function documentExists(collectionId: string, field: string, value: string): Promise<boolean> {
  try {
    const result = await databases.listDocuments(
      databaseId,
      collectionId,
      [Query.equal(field, value), Query.limit(1)]
    )
    return result.documents.length > 0
  } catch (error) {
    return false
  }
}

// Load JSON data
function loadJSONData<T>(filename: string): T[] {
  const filePath = path.join(process.cwd(), 'lib', 'data', filename)
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`)
    return []
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(fileContent)
    
    // Handle different JSON structures
    if (Array.isArray(data)) {
      return data
    } else if (data.products) {
      return data.products
    } else if (data.categories) {
      return data.categories
    } else {
      return Object.values(data)
    }
  } catch (error) {
    console.error(`❌ Error parsing JSON file ${filename}:`, error)
    return []
  }
}

// Transform category data
function transformCategory(jsonCategory: JSONCategory) {
  return {
    name: jsonCategory.name,
    slug: jsonCategory.slug || createSlug(jsonCategory.name),
    description: jsonCategory.description || '',
    imageUrl: jsonCategory.image || '',
    parentId: jsonCategory.parentId || null,
    displayOrder: jsonCategory.order || 0,
    isActive: true,
    isFeatured: jsonCategory.featured || false,
    legacyId: jsonCategory.id,
  }
}

// Transform product data
function transformProduct(jsonProduct: JSONProduct, categoryMap: Map<string, string>) {
  // Find category ID by legacy category name/id
  const categoryId = categoryMap.get(jsonProduct.category) || jsonProduct.category

  return {
    name: jsonProduct.name,
    slug: createSlug(jsonProduct.name),
    description: jsonProduct.description || '',
    shortDescription: jsonProduct.description?.substring(0, 200) || '',
    categoryId: categoryId,
    basePrice: jsonProduct.price,
    promoPrice: jsonProduct.originalPrice && jsonProduct.originalPrice > jsonProduct.price 
      ? jsonProduct.originalPrice 
      : null,
    imageUrl: jsonProduct.image,
    images: jsonProduct.images || [],
    unit: jsonProduct.unit || 'unité',
    weight: jsonProduct.weight || null,
    sku: null,
    legacyId: jsonProduct.id,
    isActive: jsonProduct.inStock !== false,
    isFeatured: jsonProduct.featured || false,
    isSpecialty: jsonProduct.specialty || false,
    tags: jsonProduct.tags || [],
    nutrition: jsonProduct.nutrition || null,
    storage: jsonProduct.storage || null,
    origin: jsonProduct.origin || null,
  }
}

// Migrate categories
async function migrateCategories(): Promise<Map<string, string>> {
  console.log('🏷️  Starting category migration...')
  
  const jsonCategories = loadJSONData<JSONCategory>('categories.json')
  if (jsonCategories.length === 0) {
    console.log('⚠️  No categories found in JSON file')
    return new Map()
  }

  console.log(`Found ${jsonCategories.length} categories to migrate`)
  
  const progress = new ProgressTracker(jsonCategories.length)
  const categoryMap = new Map<string, string>() // legacyId -> appwriteId

  // Process categories in batches
  for (let i = 0; i < jsonCategories.length; i += BATCH_SIZE) {
    const batch = jsonCategories.slice(i, i + BATCH_SIZE)
    
    for (const jsonCategory of batch) {
      try {
        // Check if category already exists
        const exists = await documentExists('categories', 'legacyId', jsonCategory.id)
        if (exists) {
          // Get existing category ID
          const result = await databases.listDocuments(
            databaseId,
            'categories',
            [Query.equal('legacyId', jsonCategory.id), Query.limit(1)]
          )
          if (result.documents.length > 0) {
            categoryMap.set(jsonCategory.id, result.documents[0].$id)
            categoryMap.set(jsonCategory.name, result.documents[0].$id)
          }
          progress.update(true)
          continue
        }

        // Transform and create category
        const transformedCategory = transformCategory(jsonCategory)
        
        const document = await retryOperation(() =>
          databases.createDocument(
            databaseId,
            'categories',
            ID.unique(),
            transformedCategory
          )
        )

        // Store mapping
        categoryMap.set(jsonCategory.id, document.$id)
        categoryMap.set(jsonCategory.name, document.$id)
        
        progress.update(true)
      } catch (error: any) {
        console.error(`\n❌ Error migrating category ${jsonCategory.name}:`, error.message)
        progress.update(false)
      }
    }
    
    // Brief pause between batches
    if (i + BATCH_SIZE < jsonCategories.length) {
      await delay(500)
    }
  }

  progress.finish()
  console.log(`📋 Category mapping created with ${categoryMap.size} entries`)
  return categoryMap
}

// Migrate products
async function migrateProducts(categoryMap: Map<string, string>): Promise<void> {
  console.log('\n🍎 Starting product migration...')
  
  const jsonProducts = loadJSONData<JSONProduct>('products.json')
  if (jsonProducts.length === 0) {
    console.log('⚠️  No products found in JSON file')
    return
  }

  console.log(`Found ${jsonProducts.length} products to migrate`)
  
  const progress = new ProgressTracker(jsonProducts.length)

  // Process products in batches
  for (let i = 0; i < jsonProducts.length; i += BATCH_SIZE) {
    const batch = jsonProducts.slice(i, i + BATCH_SIZE)
    
    for (const jsonProduct of batch) {
      try {
        // Check if product already exists
        const exists = await documentExists('products', 'legacyId', jsonProduct.id)
        if (exists) {
          progress.update(true)
          continue
        }

        // Transform and create product
        const transformedProduct = transformProduct(jsonProduct, categoryMap)
        
        await retryOperation(() =>
          databases.createDocument(
            databaseId,
            'products',
            ID.unique(),
            transformedProduct
          )
        )
        
        progress.update(true)
      } catch (error: any) {
        console.error(`\n❌ Error migrating product ${jsonProduct.name}:`, error.message)
        progress.update(false)
      }
    }
    
    // Brief pause between batches
    if (i + BATCH_SIZE < jsonProducts.length) {
      await delay(500)
    }
  }

  progress.finish()
}

// Verify migration
async function verifyMigration(): Promise<void> {
  console.log('\n🔍 Verifying migration...')
  
  try {
    // Count categories
    const categoriesResult = await databases.listDocuments(
      databaseId,
      'categories',
      [Query.limit(1)]
    )
    console.log(`✅ Categories in database: ${categoriesResult.total}`)

    // Count products
    const productsResult = await databases.listDocuments(
      databaseId,
      'products', 
      [Query.limit(1)]
    )
    console.log(`✅ Products in database: ${productsResult.total}`)

    // Check for active products
    const activeProductsResult = await databases.listDocuments(
      databaseId,
      'products',
      [Query.equal('isActive', true), Query.limit(1)]
    )
    console.log(`✅ Active products: ${activeProductsResult.total}`)

    // Check for featured products
    const featuredProductsResult = await databases.listDocuments(
      databaseId,
      'products',
      [Query.equal('isFeatured', true), Query.limit(1)]
    )
    console.log(`✅ Featured products: ${featuredProductsResult.total}`)

  } catch (error: any) {
    console.error('❌ Error during verification:', error.message)
  }
}

// Main migration function
async function main() {
  console.log('🚀 Starting product migration to Appwrite...\n')
  
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
    // Check if collections exist
    try {
      await databases.getCollection(databaseId, 'categories')
      await databases.getCollection(databaseId, 'products')
    } catch (error) {
      console.error('❌ Required collections not found. Please run init-appwrite-collections.ts first.')
      process.exit(1)
    }

    const startTime = Date.now()
    
    // Migrate categories first (products depend on categories)
    const categoryMap = await migrateCategories()
    
    // Migrate products
    await migrateProducts(categoryMap)
    
    // Verify migration
    await verifyMigration()
    
    const endTime = Date.now()
    const duration = Math.round((endTime - startTime) / 1000)
    
    console.log(`\n🎉 Migration completed in ${duration} seconds!`)
    console.log('✅ Your products are now available in Appwrite!')
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}