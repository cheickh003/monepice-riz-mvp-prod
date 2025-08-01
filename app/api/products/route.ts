/**
 * Products API Route
 * 
 * Handles GET requests for listing products with filtering,
 * searching, and pagination support.
 */

import { NextRequest, NextResponse } from 'next/server'
import { listProducts, type ProductFilters, type ProductQueryOptions } from '@/lib/services/products'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract filter parameters
    const filters: ProductFilters = {}
    const options: ProductQueryOptions = {}
    
    // Category filter
    const categoryId = searchParams.get('category')
    if (categoryId) {
      filters.categoryId = categoryId
    }
    
    // Featured filter
    const featured = searchParams.get('featured')
    if (featured !== null) {
      filters.featured = featured === 'true'
    }
    
    // Specialty filter
    const specialty = searchParams.get('specialty')
    if (specialty !== null) {
      filters.specialty = specialty === 'true'
    }
    
    // Active filter (default to true)
    const active = searchParams.get('active')
    filters.active = active !== 'false'
    
    // Price range filter
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    if (minPrice || maxPrice) {
      filters.priceRange = {
        min: minPrice ? parseFloat(minPrice) : 0,
        max: maxPrice ? parseFloat(maxPrice) : 0,
      }
    }
    
    // Tags filter
    const tags = searchParams.get('tags')
    if (tags) {
      filters.tags = tags.split(',').map(tag => tag.trim())
    }
    
    // Search filter
    const search = searchParams.get('search') || searchParams.get('q')
    if (search) {
      filters.search = search
    }
    
    // Pagination options
    const limit = searchParams.get('limit')
    if (limit) {
      const parsedLimit = parseInt(limit, 10)
      if (parsedLimit > 0 && parsedLimit <= 100) {
        options.limit = parsedLimit
      }
    }
    
    const offset = searchParams.get('offset') || searchParams.get('skip')
    if (offset) {
      const parsedOffset = parseInt(offset, 10)
      if (parsedOffset >= 0) {
        options.offset = parsedOffset
      }
    }
    
    const page = searchParams.get('page')
    if (page && !offset) {
      const parsedPage = parseInt(page, 10)
      if (parsedPage > 0) {
        options.offset = (parsedPage - 1) * (options.limit || 20)
      }
    }
    
    // Sorting options
    const sortBy = searchParams.get('sortBy') || searchParams.get('orderBy')
    if (sortBy) {
      const validSortFields = ['name', 'basePrice', 'createdAt', 'updatedAt', 'displayOrder']
      if (validSortFields.includes(sortBy)) {
        options.orderBy = sortBy === 'createdAt' ? '$createdAt' : sortBy
      }
    }
    
    const sortOrder = searchParams.get('sortOrder') || searchParams.get('order')
    if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
      options.orderDirection = sortOrder as 'asc' | 'desc'
    }

    // Fetch products
    const result = await listProducts(filters, options)
    
    // Transform products for API response
    const products = result.documents.map(product => ({
      $id: product.$id,
      $createdAt: product.$createdAt,
      $updatedAt: product.$updatedAt,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.shortDescription,
      categoryId: product.categoryId,
      basePrice: product.basePrice,
      promoPrice: product.promoPrice,
      imageUrl: product.imageUrl,
      images: product.images || [],
      unit: product.unit,
      weight: product.weight,
      sku: product.sku,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      isSpecialty: product.isSpecialty,
      tags: product.tags || [],
      nutrition: product.nutrition,
      storage: product.storage,
      origin: product.origin,
    }))

    // Add cache headers for performance
    const headers = new Headers()
    headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600') // 5 minutes cache
    headers.set('Content-Type', 'application/json')

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore,
        page: Math.floor(result.offset / result.limit) + 1,
        totalPages: Math.ceil(result.total / result.limit),
      },
      filters: {
        applied: filters,
        available: {
          categories: searchParams.get('includeCategories') === 'true',
          priceRange: {
            min: 0,
            max: 100000, // This could be dynamic based on actual data
          }
        }
      }
    }, { headers })

  } catch (error: any) {
    console.error('Products API error:', error)
    
    // Handle specific database errors
    if (error.code === 400) {
      return NextResponse.json(
        { error: 'Paramètres de requête invalides' },
        { status: 400 }
      )
    }
    
    if (error.code === 429) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer plus tard' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération des produits' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: 'Méthode non autorisée. Utilisez GET pour lister les produits' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  )
}