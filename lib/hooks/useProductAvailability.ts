/**
 * Product Availability Hook
 * 
 * Custom React hook for fetching and managing product availability data
 * for the currently selected store. Uses React Query for caching and
 * automatic refetching.
 */

import { useQuery, useQueries, UseQueryResult } from '@tanstack/react-query'
import { useEffect } from 'react'
import { StoreCode, ProductAvailability } from '@/lib/types'
import { checkProductAvailability } from '@/lib/services/products'
import { useSelectedStore } from '@/lib/stores/storeSelectionStore'

/**
 * Hook options for product availability
 */
interface UseProductAvailabilityOptions {
  enabled?: boolean
  refetchInterval?: number
  staleTime?: number
  cacheTime?: number
  onError?: (error: Error) => void
  onSuccess?: (data: ProductAvailability) => void
}

/**
 * Default options for product availability queries
 */
const DEFAULT_OPTIONS: UseProductAvailabilityOptions = {
  enabled: true,
  refetchInterval: 30000, // 30 seconds
  staleTime: 10000, // 10 seconds
  cacheTime: 300000, // 5 minutes
}

/**
 * Single product availability hook
 * @param productId - Product ID to check availability for
 * @param storeCode - Store to check (defaults to selected store)
 * @param options - Query options
 * @returns Query result with availability data
 */
export function useProductAvailability(
  productId: string,
  storeCode?: StoreCode,
  options: UseProductAvailabilityOptions = {}
) {
  const selectedStore = useSelectedStore()
  const targetStore = storeCode || selectedStore
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  const query = useQuery({
    queryKey: ['product-availability', productId, targetStore],
    queryFn: async (): Promise<ProductAvailability> => {
      const result = await checkProductAvailability(productId, targetStore)
      
      return {
        productId,
        store: targetStore,
        isAvailable: result.available,
        quantity: result.quantity,
        isLowStock: result.lowStock || false,
        lastUpdated: new Date().toISOString(),
        nextRestockDate: result.nextDelivery,
      }
    },
    enabled: mergedOptions.enabled && !!productId && !!targetStore,
    refetchInterval: mergedOptions.refetchInterval,
    staleTime: mergedOptions.staleTime,
    gcTime: mergedOptions.cacheTime,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: mergedOptions.onError,
    onSuccess: mergedOptions.onSuccess,
  })

  // Handle store changes - refetch when store changes
  useEffect(() => {
    if (query.isSuccess && targetStore) {
      query.refetch()
    }
  }, [targetStore])

  return {
    ...query,
    availability: query.data,
    isAvailable: query.data?.isAvailable ?? false,
    quantity: query.data?.quantity ?? 0,
    isLowStock: query.data?.isLowStock ?? false,
    nextRestockDate: query.data?.nextRestockDate,
    store: targetStore,
  }
}

/**
 * Multiple products availability hook
 * @param productIds - Array of product IDs to check
 * @param storeCode - Store to check (defaults to selected store)
 * @param options - Query options
 * @returns Array of query results
 */
export function useProductsAvailability(
  productIds: string[],
  storeCode?: StoreCode,
  options: UseProductAvailabilityOptions = {}
) {
  const selectedStore = useSelectedStore()
  const targetStore = storeCode || selectedStore
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  const queries = useQueries({
    queries: productIds.map(productId => ({
      queryKey: ['product-availability', productId, targetStore],
      queryFn: async (): Promise<ProductAvailability> => {
        const result = await checkProductAvailability(productId, targetStore)
        
        return {
          productId,
          store: targetStore,
          isAvailable: result.available,
          quantity: result.quantity,
          isLowStock: result.lowStock || false,
          lastUpdated: new Date().toISOString(),
          nextRestockDate: result.nextDelivery,
        }
      },
      enabled: mergedOptions.enabled && !!productId && !!targetStore,
      refetchInterval: mergedOptions.refetchInterval,
      staleTime: mergedOptions.staleTime,
      gcTime: mergedOptions.cacheTime,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }))
  })

  // Create a map for easy lookup
  const availabilityMap = new Map<string, ProductAvailability>()
  queries.forEach((query, index) => {
    if (query.data) {
      availabilityMap.set(productIds[index], query.data)
    }
  })

  return {
    queries,
    availabilityMap,
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
    hasErrors: queries.filter(q => q.isError).length > 0,
    allLoaded: queries.every(q => q.isSuccess || q.isError),
    store: targetStore,
    
    // Helper functions
    getAvailability: (productId: string) => availabilityMap.get(productId),
    isAvailable: (productId: string) => availabilityMap.get(productId)?.isAvailable ?? false,
    getQuantity: (productId: string) => availabilityMap.get(productId)?.quantity ?? 0,
    isLowStock: (productId: string) => availabilityMap.get(productId)?.isLowStock ?? false,
  }
}

/**
 * Hook for checking availability across multiple stores
 * @param productId - Product ID to check
 * @param stores - Array of stores to check
 * @param options - Query options
 * @returns Availability data for all stores
 */
export function useProductAvailabilityAcrossStores(
  productId: string,
  stores: StoreCode[],
  options: UseProductAvailabilityOptions = {}
) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  const queries = useQueries({
    queries: stores.map(store => ({
      queryKey: ['product-availability', productId, store],
      queryFn: async (): Promise<ProductAvailability> => {
        const result = await checkProductAvailability(productId, store)
        
        return {
          productId,
          store,
          isAvailable: result.available,
          quantity: result.quantity,
          isLowStock: result.lowStock || false,
          lastUpdated: new Date().toISOString(),
          nextRestockDate: result.nextDelivery,
        }
      },
      enabled: mergedOptions.enabled && !!productId,
      refetchInterval: mergedOptions.refetchInterval,
      staleTime: mergedOptions.staleTime,
      gcTime: mergedOptions.cacheTime,
      retry: 2,
    }))
  })

  // Create store availability map
  const storeAvailabilityMap = new Map<StoreCode, ProductAvailability>()
  queries.forEach((query, index) => {
    if (query.data) {
      storeAvailabilityMap.set(stores[index], query.data)
    }
  })

  // Find stores with availability
  const availableStores = stores.filter(store => 
    storeAvailabilityMap.get(store)?.isAvailable
  )

  const unavailableStores = stores.filter(store => 
    !storeAvailabilityMap.get(store)?.isAvailable
  )

  return {
    queries,
    storeAvailabilityMap,
    availableStores,
    unavailableStores,
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
    allLoaded: queries.every(q => q.isSuccess || q.isError),
    hasAvailableStores: availableStores.length > 0,
    
    // Helper functions
    getStoreAvailability: (store: StoreCode) => storeAvailabilityMap.get(store),
    isAvailableAtStore: (store: StoreCode) => storeAvailabilityMap.get(store)?.isAvailable ?? false,
    getStoreQuantity: (store: StoreCode) => storeAvailabilityMap.get(store)?.quantity ?? 0,
    getBestAvailableStore: () => {
      // Return store with highest quantity
      let bestStore: StoreCode | null = null
      let maxQuantity = 0
      
      for (const [store, availability] of storeAvailabilityMap) {
        if (availability.isAvailable && availability.quantity > maxQuantity) {
          maxQuantity = availability.quantity
          bestStore = store
        }
      }
      
      return bestStore
    }
  }
}

/**
 * Hook for batch availability checking with performance optimization
 * @param productStoreMap - Map of product IDs to store codes
 * @param options - Query options
 * @returns Batch availability results
 */
export function useBatchProductAvailability(
  productStoreMap: Map<string, StoreCode>,
  options: UseProductAvailabilityOptions = {}
) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  const queries = useQueries({
    queries: Array.from(productStoreMap.entries()).map(([productId, store]) => ({
      queryKey: ['product-availability', productId, store],
      queryFn: async (): Promise<ProductAvailability> => {
        const result = await checkProductAvailability(productId, store)
        
        return {
          productId,
          store,
          isAvailable: result.available,
          quantity: result.quantity,
          isLowStock: result.lowStock || false,
          lastUpdated: new Date().toISOString(),
          nextRestockDate: result.nextDelivery,
        }
      },
      enabled: mergedOptions.enabled && !!productId,
      refetchInterval: mergedOptions.refetchInterval,
      staleTime: mergedOptions.staleTime,
      gcTime: mergedOptions.cacheTime,
      retry: 2,
    }))
  })

  // Create product availability map
  const productAvailabilityMap = new Map<string, ProductAvailability>()
  queries.forEach((query, index) => {
    if (query.data) {
      const productId = Array.from(productStoreMap.keys())[index]
      productAvailabilityMap.set(productId, query.data)
    }
  })

  return {
    queries,
    productAvailabilityMap,
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
    allLoaded: queries.every(q => q.isSuccess || q.isError),
    
    // Helper functions
    getProductAvailability: (productId: string) => productAvailabilityMap.get(productId),
    isProductAvailable: (productId: string) => productAvailabilityMap.get(productId)?.isAvailable ?? false,
    getProductQuantity: (productId: string) => productAvailabilityMap.get(productId)?.quantity ?? 0,
  }
}

/**
 * Hook for invalidating availability cache
 * @returns Functions to invalidate cache
 */
export function useProductAvailabilityCache() {
  return {
    // Invalidate specific product at specific store
    invalidateProduct: (productId: string, store: StoreCode) => {
      // This would need to be implemented with QueryClient
      // For now, returning a placeholder
      console.log(`Invalidating cache for product ${productId} at store ${store}`)
    },
    
    // Invalidate all availability for a store
    invalidateStore: (store: StoreCode) => {
      console.log(`Invalidating all availability cache for store ${store}`)
    },
    
    // Invalidate all availability cache
    invalidateAll: () => {
      console.log('Invalidating all availability cache')
    },
  }
}

/**
 * Utility hook for availability status helpers
 * @param availability - Availability data
 * @returns Helper functions and formatted strings
 */
export function useAvailabilityHelpers(availability?: ProductAvailability) {
  const getStatusText = (locale: string = 'fr'): string => {
    if (!availability) return 'Chargement...'
    
    if (!availability.isAvailable) {
      return 'Rupture de stock'
    }
    
    if (availability.isLowStock) {
      return `Stock limité (${availability.quantity} restant${availability.quantity > 1 ? 's' : ''})`
    }
    
    return 'Disponible'
  }

  const getStatusColor = (): 'green' | 'yellow' | 'red' | 'gray' => {
    if (!availability) return 'gray'
    
    if (!availability.isAvailable) return 'red'
    if (availability.isLowStock) return 'yellow'
    return 'green'
  }

  const getQuantityText = (): string => {
    if (!availability || !availability.isAvailable) return ''
    
    if (availability.quantity <= 5) {
      return `Plus que ${availability.quantity} en stock`
    }
    
    return `${availability.quantity} en stock`
  }

  const getRestockText = (): string => {
    if (!availability?.nextRestockDate) return ''
    
    const restockDate = new Date(availability.nextRestockDate)
    const now = new Date()
    const diffDays = Math.ceil((restockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 0) return 'Réapprovisionnement prévu aujourd\'hui'
    if (diffDays === 1) return 'Réapprovisionnement prévu demain'
    return `Réapprovisionnement prévu dans ${diffDays} jours`
  }

  return {
    getStatusText,
    getStatusColor,
    getQuantityText,
    getRestockText,
    isAvailable: availability?.isAvailable ?? false,
    isLowStock: availability?.isLowStock ?? false,
    quantity: availability?.quantity ?? 0,
  }
}