/**
 * Individual Product API Route
 * 
 * Handles GET requests for fetching individual product details by slug.
 * Includes related products and availability information.
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getProductBySlug, 
  getRelatedProducts, 
  checkProductAvailability 
} from '@/lib/services/products'

interface RouteParams {
  params: {
    slug: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = params
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug du produit requis' },
        { status: 400 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const includeRelated = searchParams.get('includeRelated') !== 'false'
    const includeAvailability = searchParams.get('includeAvailability') === 'true'
    const store = searchParams.get('store') || 'COCODY'

    // Fetch product by slug
    const product = await getProductBySlug(slug)
    
    if (!product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    // Transform product for API response
    const productData = {
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
    }

    // Build response data
    const responseData: any = {
      success: true,
      data: productData,
    }

    // Add related products if requested
    if (includeRelated && product.categoryId) {
      try {
        const relatedProducts = await getRelatedProducts(
          product.$id, 
          product.categoryId, 
          4
        )
        
        responseData.related = relatedProducts.map(related => ({
          $id: related.$id,
          name: related.name,
          slug: related.slug,
          shortDescription: related.shortDescription,
          basePrice: related.basePrice,
          promoPrice: related.promoPrice,
          imageUrl: related.imageUrl,
          unit: related.unit,
          isFeatured: related.isFeatured,
          isSpecialty: related.isSpecialty,
        }))
      } catch (relatedError) {
        console.warn('Error fetching related products:', relatedError)
        responseData.related = []
      }
    }

    // Add availability information if requested
    if (includeAvailability) {
      try {
        const availability = await checkProductAvailability(product.$id, store)
        responseData.availability = {
          store,
          available: availability.available,
          quantity: availability.quantity,
          lowStock: availability.lowStock,
          lastRestocked: availability.lastRestocked,
          nextDelivery: availability.nextDelivery,
        }
      } catch (availabilityError) {
        console.warn('Error checking product availability:', availabilityError)
        responseData.availability = {
          store,
          available: false,
          quantity: 0,
        }
      }
    }

    // Add cache headers for performance
    const headers = new Headers()
    headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1800') // 10 minutes cache
    headers.set('Content-Type', 'application/json')

    // Add ETag for better caching
    const etag = `"${product.$id}-${product.$updatedAt}"`
    headers.set('ETag', etag)

    // Check if client has cached version
    const ifNoneMatch = request.headers.get('If-None-Match')
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers })
    }

    return NextResponse.json(responseData, { headers })

  } catch (error: any) {
    console.error('Product detail API error:', error)
    
    // Handle specific database errors
    if (error.code === 400) {
      return NextResponse.json(
        { error: 'Paramètres de requête invalides' },
        { status: 400 }
      )
    }
    
    if (error.code === 404) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }
    
    if (error.code === 429) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer plus tard' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération du produit' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: 'Méthode non autorisée. Utilisez GET pour récupérer un produit' },
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