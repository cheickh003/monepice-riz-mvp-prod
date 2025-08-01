/**
 * Advanced Search Component (Optimized)
 * 
 * Comprehensive search interface with store-aware filtering,
 * category selection, price ranges, and specialty product filters.
 * Optimized for performance with memoization, lazy loading, and virtual scrolling.
 * Enhanced for the MonEpice&Riz two-store system.
 */

'use client'

import { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
// import { useDebouncedCallback } from 'use-debounce' // Will implement custom debounce for now
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  XMarkIcon,
  ChevronDownIcon,
  MapPinIcon,
  StarIcon,
  TagIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { useSelectedStore } from '@/lib/stores/storeSelectionStore'
import { getCategories } from '@/lib/services/products'
import { StoreCode } from '@/lib/types'

// Lazy load heavy components
const VirtualizedFilterOptions = lazy(() => import('./VirtualizedFilterOptions'))
const PriceRangeSlider = lazy(() => import('./PriceRangeSlider'))

// Custom debounce hook for better performance
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useCallback(() => {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => callback(...args), delay)
    }
  }, [callback, delay])

  return timeoutRef() as T
}

// Memoized filter calculation utilities
const FilterCalculator = {
  calculateActiveFilters: memo((filters: SearchFilters) => {
    let count = 0
    if (filters.query) count++
    if (filters.categoryId) count++
    if (filters.priceRange.min > 0 || filters.priceRange.max < 50000) count++
    if (filters.storeFilter !== 'selected') count++
    if (filters.availabilityFilter !== 'available') count++
    if (filters.specialtyOnly) count++
    if (filters.featuredOnly) count++
    if (filters.tags.length > 0) count++
    return count
  }),

  shouldShowAdvanced: memo((filters: SearchFilters, hasCategories: boolean) => {
    return hasCategories && (
      filters.categoryId ||
      filters.priceRange.min > 0 ||
      filters.priceRange.max < 50000 ||
      filters.specialtyOnly ||
      filters.featuredOnly ||
      filters.tags.length > 0
    )
  })
}

interface SearchFilters {
  query: string
  categoryId?: string
  priceRange: { min: number; max: number }
  storeFilter: 'all' | 'selected' | StoreCode
  availabilityFilter: 'all' | 'available' | 'low_stock'
  specialtyOnly: boolean
  featuredOnly: boolean
  tags: string[]
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'name' | 'newest'
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  onClear?: () => void
  initialFilters?: Partial<SearchFilters>
  isLoading?: boolean
  compact?: boolean
  className?: string
}

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  priceRange: { min: 0, max: 50000 },
  storeFilter: 'selected',
  availabilityFilter: 'available',
  specialtyOnly: false,
  featuredOnly: false,
  tags: [],
  sortBy: 'relevance'
}

const PRICE_PRESETS = [
  { label: 'Moins de 1000 FCFA', min: 0, max: 1000 },
  { label: '1000 - 5000 FCFA', min: 1000, max: 5000 },
  { label: '5000 - 10000 FCFA', min: 5000, max: 10000 },
  { label: '10000 - 25000 FCFA', min: 10000, max: 25000 },
  { label: 'Plus de 25000 FCFA', min: 25000, max: 100000 }
]

const COMMON_TAGS = [
  'bio', 'local', 'frais', 'surgelé', 'importé', 'premium', 
  'épicé', 'doux', 'san-pedro', 'traditionnel', 'exotique'
]

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Pertinence' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'name', label: 'Nom A-Z' },
  { value: 'newest', label: 'Plus récents' }
]

const AdvancedSearch = memo(function AdvancedSearch({
  onSearch,
  onClear,
  initialFilters = {},
  isLoading = false,
  compact = false,
  className = ''
}: AdvancedSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedStore = useSelectedStore()
  
  const [filters, setFilters] = useState<SearchFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
    storeFilter: initialFilters.storeFilter || (selectedStore || 'all')
  })
  
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showPriceRange, setShowPriceRange] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Load categories for filtering with optimized caching
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(true),
    staleTime: 30 * 60 * 1000, // 30 minutes for better caching
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  // Memoized filter calculations
  const activeFiltersCount = useMemo(() => 
    FilterCalculator.calculateActiveFilters(filters), 
    [filters]
  )

  const shouldShowAdvancedByDefault = useMemo(() => 
    FilterCalculator.shouldShowAdvanced(filters, categories.length > 0), 
    [filters, categories.length]
  )

  // Debounced search to reduce API calls
  const debouncedSearch = useDebounce((searchFilters: SearchFilters) => {
    setIsSearching(true)
    onSearch(searchFilters)
    setIsSearching(false)
  }, 300)

  // Initialize from URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q') || ''
    const urlCategory = searchParams.get('category') || undefined
    const urlMinPrice = parseInt(searchParams.get('min_price') || '0')
    const urlMaxPrice = parseInt(searchParams.get('max_price') || '50000')
    const urlStore = searchParams.get('store') as StoreCode || filters.storeFilter
    const urlSort = searchParams.get('sort') as SearchFilters['sortBy'] || 'relevance'
    
    if (urlQuery || urlCategory || urlMinPrice > 0 || urlMaxPrice < 50000) {
      setFilters(prev => ({
        ...prev,
        query: urlQuery,
        categoryId: urlCategory,
        priceRange: { min: urlMinPrice, max: urlMaxPrice },
        storeFilter: urlStore,
        sortBy: urlSort
      }))
    }
  }, [searchParams])

  // Memoized search execution with optimized URL updates
  const handleSearch = useCallback((filtersToUse = filters) => {
    debouncedSearch(filtersToUse)
    
    // Batch URL updates to prevent multiple navigations
    const params = new URLSearchParams()
    if (filtersToUse.query) params.set('q', filtersToUse.query)
    if (filtersToUse.categoryId) params.set('category', filtersToUse.categoryId)
    if (filtersToUse.priceRange.min > 0) params.set('min_price', filtersToUse.priceRange.min.toString())
    if (filtersToUse.priceRange.max < 50000) params.set('max_price', filtersToUse.priceRange.max.toString())
    if (filtersToUse.storeFilter !== 'selected') params.set('store', filtersToUse.storeFilter)
    if (filtersToUse.sortBy !== 'relevance') params.set('sort', filtersToUse.sortBy)
    
    const newUrl = params.toString() ? `?${params.toString()}` : ''
    
    // Use replace instead of push for filter changes to prevent history pollution
    router.replace(`/products${newUrl}`, { scroll: false })
  }, [filters, debouncedSearch, router])

  // Optimized clear filters with batch state update
  const handleClear = useCallback(() => {
    const newFilters = {
      ...DEFAULT_FILTERS,
      storeFilter: selectedStore || 'all'
    }
    setFilters(newFilters)
    onClear?.()
    router.replace('/products', { scroll: false })
  }, [onClear, router, selectedStore])

  // Memoized filter update handler to prevent unnecessary re-renders
  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    setFilters(prev => {
      const newFilters = { ...prev, ...updates }
      // Only trigger search if significant filters changed
      if (updates.query !== undefined || 
          updates.categoryId !== undefined || 
          updates.storeFilter !== undefined ||
          updates.availabilityFilter !== undefined) {
        // Slight delay to batch multiple rapid updates
        setTimeout(() => handleSearch(newFilters), 50)
      }
      return newFilters
    })
  }, [handleSearch])

  // Debounced search for query changes
  useEffect(() => {
    if (filters.query.length >= 2 || filters.query.length === 0) {
      const timeoutId = setTimeout(handleSearch, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [filters.query])

  // Auto-search on filter changes (except query)
  useEffect(() => {
    handleSearch()
  }, [
    filters.categoryId,
    filters.priceRange,
    filters.storeFilter,
    filters.availabilityFilter,
    filters.specialtyOnly,
    filters.featuredOnly,
    filters.sortBy
  ])

  const hasActiveFilters = useMemo(() => {
    return (
      filters.query ||
      filters.categoryId ||
      filters.priceRange.min > 0 ||
      filters.priceRange.max < 50000 ||
      filters.storeFilter !== 'selected' ||
      filters.availabilityFilter !== 'available' ||
      filters.specialtyOnly ||
      filters.featuredOnly ||
      filters.tags.length > 0
    )
  }, [filters])

  if (compact) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher des produits..."
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2 border rounded-md transition-colors ${
              showAdvanced ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="px-3 py-2 text-gray-500 hover:text-gray-700"
              title="Effacer les filtres"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <AdvancedFilters
              filters={filters}
              setFilters={setFilters}
              categories={categories}
              selectedStore={selectedStore}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Main Search Bar */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher escargots, crabes, épices..."
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              className="w-full pl-12 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center px-4 py-3 border rounded-lg transition-colors ${
              showAdvanced ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
            Filtres
            {hasActiveFilters && (
              <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="px-4 py-3 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <XMarkIcon className="h-5 w-5 mr-2" />
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="p-6">
          <AdvancedFilters
            filters={filters}
            setFilters={setFilters}
            categories={categories}
            selectedStore={selectedStore}
          />
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <ActiveFiltersSummary filters={filters} categories={categories} onRemoveFilter={(key, value) => {
            if (key === 'categoryId') {
              setFilters(prev => ({ ...prev, categoryId: undefined }))
            } else if (key === 'priceRange') {
              setFilters(prev => ({ ...prev, priceRange: { min: 0, max: 50000 } }))
            } else if (key === 'specialtyOnly') {
              setFilters(prev => ({ ...prev, specialtyOnly: false }))
            } else if (key === 'featuredOnly') {
              setFilters(prev => ({ ...prev, featuredOnly: false }))
            }
          }} />
        </div>
      )}
    </div>
  )
})

interface AdvancedFiltersProps {
  filters: SearchFilters
  setFilters: (filters: SearchFilters | ((prev: SearchFilters) => SearchFilters)) => void
  categories: any[]
  selectedStore?: StoreCode | null
}

function AdvancedFilters({ filters, setFilters, categories, selectedStore }: AdvancedFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Catégorie
        </label>
        <select
          value={filters.categoryId || ''}
          onChange={(e) => setFilters(prev => ({ ...prev, categoryId: e.target.value || undefined }))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((category) => (
            <option key={category.$id} value={category.$id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gamme de prix (FCFA)
        </label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceRange.min || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                priceRange: { ...prev.priceRange, min: parseInt(e.target.value) || 0 }
              }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.priceRange.max || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                priceRange: { ...prev.priceRange, max: parseInt(e.target.value) || 50000 }
              }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Price Presets */}
          <div className="flex flex-wrap gap-1">
            {PRICE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setFilters(prev => ({
                  ...prev,
                  priceRange: { min: preset.min, max: preset.max }
                }))}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Store & Availability */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Magasin & Disponibilité
        </label>
        <div className="space-y-2">
          <select
            value={filters.storeFilter}
            onChange={(e) => setFilters(prev => ({ ...prev, storeFilter: e.target.value as any }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tous les magasins</option>
            <option value="selected">Magasin sélectionné {selectedStore && `(${selectedStore})`}</option>
            <option value="COCODY">MonEpice&Riz Cocody</option>
            <option value="KOUMASSI">MonEpice&Riz Koumassi</option>
          </select>
          
          <select
            value={filters.availabilityFilter}
            onChange={(e) => setFilters(prev => ({ ...prev, availabilityFilter: e.target.value as any }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Toute disponibilité</option>
            <option value="available">Disponible maintenant</option>
            <option value="low_stock">Stock limité</option>
          </select>
        </div>
      </div>

      {/* Product Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Types de produits
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.specialtyOnly}
              onChange={(e) => setFilters(prev => ({ ...prev, specialtyOnly: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              🐌🦀 Spécialités uniquement
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.featuredOnly}
              onChange={(e) => setFilters(prev => ({ ...prev, featuredOnly: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              ⭐ Produits vedettes
            </span>
          </label>
        </div>
      </div>

      {/* Sort Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Trier par
        </label>
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

interface ActiveFiltersSummaryProps {
  filters: SearchFilters
  categories: any[]
  onRemoveFilter: (key: string, value?: any) => void
}

function ActiveFiltersSummary({ filters, categories, onRemoveFilter }: ActiveFiltersSummaryProps) {
  const activeFilters = []

  if (filters.categoryId) {
    const category = categories.find(c => c.$id === filters.categoryId)
    activeFilters.push({
      key: 'categoryId',
      label: `Catégorie: ${category?.name || 'Inconnue'}`,
      value: filters.categoryId
    })
  }

  if (filters.priceRange.min > 0 || filters.priceRange.max < 50000) {
    activeFilters.push({
      key: 'priceRange',
      label: `Prix: ${filters.priceRange.min} - ${filters.priceRange.max} FCFA`,
      value: filters.priceRange
    })
  }

  if (filters.specialtyOnly) {
    activeFilters.push({
      key: 'specialtyOnly',
      label: 'Spécialités uniquement',
      value: true
    })
  }

  if (filters.featuredOnly) {
    activeFilters.push({
      key: 'featuredOnly',
      label: 'Produits vedettes',
      value: true
    })
  }

  if (activeFilters.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-600">Filtres actifs:</span>
      {activeFilters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
        >
          {filter.label}
          <button
            onClick={() => onRemoveFilter(filter.key, filter.value)}
            className="ml-2 text-blue-600 hover:text-blue-800"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </span>
      ))}
    </div>
  )
}

export default AdvancedSearch;