/**
 * Search Results Component
 * 
 * Displays search results with store-aware product information,
 * pagination, loading states, and empty state handling.
 * Integrates with the enhanced ProductCard for store availability.
 */

'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MapPinIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { useSelectedStore } from '@/lib/stores/storeSelectionStore'
import { StoreCode, Product } from '@/lib/types'
import ProductCard from '@/components/product/ProductCard'

interface SearchResultsProps {
  results: Product[]
  totalResults: number
  currentPage: number
  totalPages: number
  searchQuery?: string
  isLoading?: boolean
  hasError?: boolean
  onPageChange: (page: number) => void
  onRetry?: () => void
  onSortChange?: (sortBy: string) => void
  onViewModeChange?: (mode: 'grid' | 'list') => void
  className?: string
}

type ViewMode = 'grid' | 'list'
type ResultsPerPage = 12 | 24 | 48

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Pertinence' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'name', label: 'Nom A-Z' },
  { value: 'newest', label: 'Plus récents' },
  { value: 'availability', label: 'Disponibilité' }
]

export default function SearchResults({
  results,
  totalResults,
  currentPage,
  totalPages,
  searchQuery = '',
  isLoading = false,
  hasError = false,
  onPageChange,
  onRetry,
  onSortChange,
  onViewModeChange,
  className = ''
}: SearchResultsProps) {
  const router = useRouter()
  const selectedStore = useSelectedStore()
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState('relevance')
  const [resultsPerPage, setResultsPerPage] = useState<ResultsPerPage>(24)

  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    onViewModeChange?.(mode)
  }

  // Handle sort change
  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy)
    onSortChange?.(newSortBy)
  }

  // Calculate result statistics
  const resultStats = useMemo(() => {
    const availableCount = results.filter(product => {
      const availability = product.storeInventory?.find(inv => inv.store === selectedStore)
      return availability?.isAvailable
    }).length
    
    const specialtyCount = results.filter(product => 
      product.isSpecialty || 
      product.name?.toLowerCase().includes('escargot') || 
      product.name?.toLowerCase().includes('crabe')
    ).length

    return { availableCount, specialtyCount }
  }, [results, selectedStore])

  // Error State
  if (hasError) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Erreur lors de la recherche
          </h3>
          <p className="text-gray-600 mb-6">
            Une erreur s'est produite lors de la recherche. Veuillez réessayer.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Réessayer
            </button>
          )}
        </div>
      </div>
    )
  }

  // Loading State
  if (isLoading) {
    return (
      <div className={`${className}`}>
        <SearchResultsHeader
          totalResults={totalResults}
          searchQuery={searchQuery}
          selectedStore={selectedStore}
          viewMode={viewMode}
          sortBy={sortBy}
          onViewModeChange={handleViewModeChange}
          onSortChange={handleSortChange}
          isLoading={true}
        />
        <LoadingSkeleton viewMode={viewMode} />
      </div>
    )
  }

  // Empty State
  if (!isLoading && results.length === 0) {
    return (
      <div className={`${className}`}>
        <SearchResultsHeader
          totalResults={totalResults}
          searchQuery={searchQuery}
          selectedStore={selectedStore}
          viewMode={viewMode}
          sortBy={sortBy}
          onViewModeChange={handleViewModeChange}
          onSortChange={handleSortChange}
        />
        <EmptyState searchQuery={searchQuery} selectedStore={selectedStore} />
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {/* Results Header */}
      <SearchResultsHeader
        totalResults={totalResults}
        searchQuery={searchQuery}
        selectedStore={selectedStore}
        viewMode={viewMode}
        sortBy={sortBy}
        onViewModeChange={handleViewModeChange}
        onSortChange={handleSortChange}
        availableCount={resultStats.availableCount}
        specialtyCount={resultStats.specialtyCount}
      />

      {/* Results Grid/List */}
      <div className={`
        ${viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' 
          : 'space-y-4'
        }
      `}>
        {results.map((product) => (
          <ProductCard
            key={product.$id}
            product={product}
            variant={viewMode === 'list' ? 'horizontal' : 'vertical'}
            showStoreAvailability={true}
            showCrossStoreAvailability={false}
            className={viewMode === 'list' ? 'max-w-none' : ''}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={totalResults}
          onPageChange={onPageChange}
          className="mt-8"
        />
      )}
    </div>
  )
}

interface SearchResultsHeaderProps {
  totalResults: number
  searchQuery: string
  selectedStore?: StoreCode | null
  viewMode: ViewMode
  sortBy: string
  onViewModeChange: (mode: ViewMode) => void
  onSortChange: (sortBy: string) => void
  availableCount?: number
  specialtyCount?: number
  isLoading?: boolean
}

function SearchResultsHeader({
  totalResults,
  searchQuery,
  selectedStore,
  viewMode,
  sortBy,
  onViewModeChange,
  onSortChange,
  availableCount,
  specialtyCount,
  isLoading = false
}: SearchResultsHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Results Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            {searchQuery && (
              <span className="flex items-center">
                <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
                "{searchQuery}"
              </span>
            )}
            {selectedStore && (
              <span className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1" />
                {selectedStore === 'COCODY' ? 'Cocody' : 'Koumassi'}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium text-gray-900">
              {isLoading ? (
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              ) : (
                `${totalResults.toLocaleString()} résultat${totalResults !== 1 ? 's' : ''}`
              )}
            </span>
            
            {!isLoading && availableCount !== undefined && (
              <span className="text-green-600">
                {availableCount} disponible{availableCount !== 1 ? 's' : ''}
              </span>
            )}
            
            {!isLoading && specialtyCount !== undefined && specialtyCount > 0 && (
              <span className="flex items-center text-amber-600">
                <TagIcon className="h-4 w-4 mr-1" />
                {specialtyCount} spécialité{specialtyCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        {!isLoading && (
          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Trier par:</span>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 ${
                  viewMode === 'grid'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Vue grille"
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 ${
                  viewMode === 'list'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Vue liste"
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalResults: number
  onPageChange: (page: number) => void
  className?: string
}

function Pagination({ currentPage, totalPages, totalResults, onPageChange, className = '' }: PaginationProps) {
  const pages = []
  const showEllipsis = totalPages > 7

  if (showEllipsis) {
    // Always show first page
    pages.push(1)
    
    if (currentPage > 4) {
      pages.push('ellipsis-start')
    }
    
    // Show pages around current page
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    if (currentPage < totalPages - 3) {
      pages.push('ellipsis-end')
    }
    
    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages)
    }
  } else {
    // Show all pages
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="text-sm text-gray-700">
        Page {currentPage} sur {totalPages} ({totalResults.toLocaleString()} résultats)
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Précédent
        </button>
        
        {pages.map((page, index) => (
          <div key={index}>
            {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
              <span className="px-3 py-2 text-sm text-gray-500">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`px-3 py-2 text-sm border rounded-md ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            )}
          </div>
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Suivant
        </button>
      </div>
    </div>
  )
}

function LoadingSkeleton({ viewMode }: { viewMode: ViewMode }) {
  const skeletonCount = viewMode === 'grid' ? 8 : 6

  return (
    <div className={`
      ${viewMode === 'grid' 
        ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' 
        : 'space-y-4'
      }
    `}>
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <div
          key={index}
          className={`
            animate-pulse bg-white rounded-lg border
            ${viewMode === 'list' ? 'flex gap-4 p-4' : 'p-4'}
          `}
        >
          <div className={`
            bg-gray-200 rounded-lg
            ${viewMode === 'list' ? 'w-24 h-24 flex-shrink-0' : 'w-full h-48 mb-4'}
          `} />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface EmptyStateProps {
  searchQuery: string
  selectedStore?: StoreCode | null
}

function EmptyState({ searchQuery, selectedStore }: EmptyStateProps) {
  const router = useRouter()

  return (
    <div className="text-center py-12">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
        <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Aucun produit trouvé
      </h3>
      
      <div className="text-gray-600 mb-6 space-y-1">
        {searchQuery && (
          <p>Aucun résultat pour "{searchQuery}"</p>
        )}
        {selectedStore && (
          <p className="text-sm">dans le magasin {selectedStore === 'COCODY' ? 'Cocody' : 'Koumassi'}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <p className="mb-2">Suggestions:</p>
          <ul className="space-y-1">
            <li>• Vérifiez l'orthographe de votre recherche</li>
            <li>• Essayez des mots-clés plus généraux</li>
            <li>• Recherchez dans tous les magasins</li>
            <li>• Explorez nos catégories populaires</li>
          </ul>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push('/products')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Voir tous les produits
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  )
}