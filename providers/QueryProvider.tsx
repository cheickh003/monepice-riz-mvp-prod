/**
 * React Query Provider
 * 
 * Provides React Query (TanStack Query) context for data fetching,
 * caching, and state management throughout the application.
 */

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a stable query client instance
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time - how long data is considered fresh
        staleTime: 5 * 60 * 1000, // 5 minutes
        
        // Cache time - how long inactive data is kept in cache
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        
        // Retry configuration
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors except 408, 429
          if (error?.status >= 400 && error?.status < 500 && ![408, 429].includes(error.status)) {
            return false
          }
          // Retry up to 3 times for other errors
          return failureCount < 3
        },
        
        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Refetch on window focus (good for real-time inventory updates)
        refetchOnWindowFocus: true,
        
        // Refetch on reconnect
        refetchOnReconnect: true,
        
        // Refetch interval for critical data (like product availability)
        refetchInterval: false, // Individual queries can override this
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
        
        // Retry delay for mutations
        retryDelay: 1000,
        
        // Global mutation error handling
        onError: (error: any) => {
          console.error('Mutation error:', error)
          
          // You could integrate with toast notifications here
          // toast.error('Une erreur s\'est produite. Veuillez réessayer.')
        },
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show React Query devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-left"
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  )
}

/**
 * Hook to access the query client directly
 * Useful for invalidating caches, prefetching, etc.
 */
export { useQueryClient } from '@tanstack/react-query'

/**
 * Utility function to invalidate all product-related queries
 * Useful when store changes or inventory updates
 */
export function invalidateProductQueries(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['products'] }),
    queryClient.invalidateQueries({ queryKey: ['product-availability'] }),
    queryClient.invalidateQueries({ queryKey: ['categories'] }),
    queryClient.invalidateQueries({ queryKey: ['search'] }),
  ])
}

/**
 * Utility function to invalidate store-specific queries
 */
export function invalidateStoreQueries(queryClient: QueryClient, storeCode?: string) {
  if (storeCode) {
    return queryClient.invalidateQueries({ 
      queryKey: ['product-availability'],
      predicate: (query) => {
        // Invalidate queries that include the specific store
        return query.queryKey.includes(storeCode)
      }
    })
  }
  
  // Invalidate all availability queries if no specific store
  return queryClient.invalidateQueries({ queryKey: ['product-availability'] })
}

/**
 * Prefetch common data for better performance
 */
export function prefetchCommonData(queryClient: QueryClient) {
  // This could be called on app initialization
  // to prefetch categories, featured products, etc.
  
  // Example:
  // queryClient.prefetchQuery({
  //   queryKey: ['categories'],
  //   queryFn: () => getCategories(),
  //   staleTime: 10 * 60 * 1000, // 10 minutes
  // })
}