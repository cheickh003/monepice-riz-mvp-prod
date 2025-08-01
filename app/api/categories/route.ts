/**
 * Categories API Route
 * 
 * Handles GET requests for listing product categories with
 * metadata and product counts.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCategories, getFeaturedCategories } from '@/lib/services/products'
import { createServerDatabases } from '@/lib/server/appwrite'
import { SERVER_CONFIG } from '@/lib/server/appwrite'
import { Query } from 'appwrite'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract filter parameters
    const featuredOnly = searchParams.get('featured') === 'true'
    const activeOnly = searchParams.get('active') !== 'false'
    const includeProductCount = searchParams.get('includeProductCount') === 'true'
    const includeHierarchy = searchParams.get('includeHierarchy') === 'true'

    let categories

    // Fetch categories based on filters
    if (featuredOnly) {
      const limit = parseInt(searchParams.get('limit') || '10', 10)
      categories = await getFeaturedCategories(limit)
    } else {
      categories = await getCategories(activeOnly)
    }

    // Transform categories for API response
    const transformedCategories = await Promise.all(
      categories.map(async (category) => {
        const categoryData: any = {
          $id: category.$id,
          $createdAt: category.$createdAt,
          $updatedAt: category.$updatedAt,
          name: category.name,
          slug: category.slug,
          description: category.description,
          imageUrl: category.imageUrl,
          parentId: category.parentId,
          displayOrder: category.displayOrder,
          isActive: category.isActive,
          isFeatured: category.isFeatured,
        }

        // Add product count if requested
        if (includeProductCount) {
          try {
            const databases = createServerDatabases()
            const productCountResult = await databases.listDocuments(
              SERVER_CONFIG.DATABASE_ID,
              'products',
              [
                Query.equal('categoryId', category.$id),
                Query.equal('isActive', true),
                Query.limit(1)
              ]
            )
            categoryData.productCount = productCountResult.total
          } catch (countError) {
            console.warn(`Error counting products for category ${category.name}:`, countError)
            categoryData.productCount = 0
          }
        }

        return categoryData
      })
    )

    // Build hierarchy if requested
    let responseData: any = {
      success: true,
      data: transformedCategories,
    }

    if (includeHierarchy) {
      // Group categories by parent-child relationship
      const categoryMap = new Map(transformedCategories.map(cat => [cat.$id, cat]))
      const rootCategories: any[] = []
      const childCategories = new Map<string, any[]>()

      // First pass: identify root categories and group children
      transformedCategories.forEach(category => {
        if (!category.parentId) {
          rootCategories.push(category)
        } else {
          if (!childCategories.has(category.parentId)) {
            childCategories.set(category.parentId, [])
          }
          childCategories.get(category.parentId)!.push(category)
        }
      })

      // Second pass: attach children to parents
      const buildHierarchy = (category: any): any => {
        const children = childCategories.get(category.$id) || []
        return {
          ...category,
          children: children.map(buildHierarchy).sort((a, b) => a.displayOrder - b.displayOrder)
        }
      }

      responseData.data = rootCategories
        .map(buildHierarchy)
        .sort((a, b) => a.displayOrder - b.displayOrder)
    }

    // Add metadata
    responseData.meta = {
      total: transformedCategories.length,
      featured: transformedCategories.filter(cat => cat.isFeatured).length,
      active: transformedCategories.filter(cat => cat.isActive).length,
      hasHierarchy: includeHierarchy,
      hasProductCounts: includeProductCount,
    }

    // Add cache headers for performance
    const headers = new Headers()
    headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1800') // 10 minutes cache
    headers.set('Content-Type', 'application/json')

    return NextResponse.json(responseData, { headers })

  } catch (error: any) {
    console.error('Categories API error:', error)
    
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
      { error: 'Erreur lors de la récupération des catégories' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: 'Méthode non autorisée. Utilisez GET pour lister les catégories' },
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