/**
 * Store Selection Store
 * 
 * Zustand store for managing store selection state, geolocation,
 * and user preferences with persistence support.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { 
  StoreCode, 
  StoreSelectionState, 
  GeolocationCoordinates 
} from '@/lib/types'
import {
  DEFAULT_STORE,
  findNearestStore,
  isValidStoreCode,
  calculateDistance,
  STORE_CONSTANTS,
  STORE_ERRORS,
  STORE_MESSAGES
} from '@/lib/config/stores'

interface StoreSelectionStore extends StoreSelectionState {
  // Actions
  setSelectedStore: (store: StoreCode) => void
  setUserLocation: (location: GeolocationCoordinates) => void
  setLoadingLocation: (loading: boolean) => void
  setLocationError: (error: string | null) => void
  clearLocationError: () => void
  
  // Geolocation functions
  requestLocation: () => Promise<void>
  detectNearestStore: () => Promise<void>
  
  // Utility functions
  resetStore: () => void
  isLocationStale: () => boolean
  isLocationDistanceStale: () => Promise<boolean>
  hasUserMovedSignificantly: () => Promise<boolean>
  shouldPromptStoreUpdate: () => Promise<boolean>
  getDistanceToSelectedStore: () => number | null
  getDistanceFromCachedLocation: () => Promise<number | null>
  
  // Event handlers
  onStoreChange: (callback: (store: StoreCode) => void) => () => void
}

/**
 * Initial state for store selection
 */
const initialState: StoreSelectionState = {
  selectedStore: DEFAULT_STORE,
  userLocation: undefined,
  isLoadingLocation: false,
  locationError: undefined,
  nearestStore: undefined,
  lastLocationUpdate: undefined
}

/**
 * Store selection store with persistence
 */
export const useStoreSelectionStore = create<StoreSelectionStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Set the selected store
       */
      setSelectedStore: (store: StoreCode) => {
        if (!isValidStoreCode(store)) {
          console.warn(`Invalid store code: ${store}`)
          return
        }
        
        set({ selectedStore: store })
        
        // Trigger any registered callbacks
        const callbacks = (get() as any)._storeChangeCallbacks || []
        callbacks.forEach((callback: (store: StoreCode) => void) => {
          try {
            callback(store)
          } catch (error) {
            console.error('Error in store change callback:', error)
          }
        })
      },

      /**
       * Set user location coordinates
       */
      setUserLocation: (location: GeolocationCoordinates) => {
        set({
          userLocation: location,
          lastLocationUpdate: new Date().toISOString(),
          locationError: undefined
        })
      },

      /**
       * Set location loading state
       */
      setLoadingLocation: (loading: boolean) => {
        set({ isLoadingLocation: loading })
      },

      /**
       * Set location error
       */
      setLocationError: (error: string | null) => {
        set({
          locationError: error || undefined,
          isLoadingLocation: false
        })
      },

      /**
       * Clear location error
       */
      clearLocationError: () => {
        set({ locationError: undefined })
      },

      /**
       * Request user's geolocation
       */
      requestLocation: async () => {
        if (!navigator.geolocation) {
          get().setLocationError(STORE_ERRORS.GEOLOCATION_NOT_SUPPORTED)
          return
        }

        get().setLoadingLocation(true)
        get().clearLocationError()

        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: STORE_CONSTANTS.GEOLOCATION_HIGH_ACCURACY,
                timeout: STORE_CONSTANTS.GEOLOCATION_TIMEOUT,
                maximumAge: STORE_CONSTANTS.GEOLOCATION_MAX_AGE
              }
            )
          })

          const coordinates: GeolocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }

          get().setUserLocation(coordinates)
          get().setLoadingLocation(false)

        } catch (error: any) {
          let errorMessage = STORE_ERRORS.GEOLOCATION_POSITION_UNAVAILABLE

          if (error.code === GeolocationPositionError.PERMISSION_DENIED) {
            errorMessage = STORE_ERRORS.GEOLOCATION_PERMISSION_DENIED
          } else if (error.code === GeolocationPositionError.TIMEOUT) {
            errorMessage = STORE_ERRORS.GEOLOCATION_TIMEOUT
          }

          get().setLocationError(errorMessage)
        }
      },

      /**
       * Detect and select the nearest store based on user location
       */
      detectNearestStore: async () => {
        const { userLocation, requestLocation } = get()

        // Request location if not available
        if (!userLocation) {
          await requestLocation()
        }

        const currentLocation = get().userLocation
        if (!currentLocation) {
          return // Location request failed
        }

        try {
          const { store: nearestStoreCode } = findNearestStore(currentLocation)
          
          set({ 
            nearestStore: nearestStoreCode,
            selectedStore: nearestStoreCode
          })

          console.log(STORE_MESSAGES.NEAREST_STORE_SELECTED)
        } catch (error) {
          console.error('Error detecting nearest store:', error)
          get().setLocationError(STORE_ERRORS.STORE_NOT_FOUND)
        }
      },

      /**
       * Reset store to initial state
       */
      resetStore: () => {
        set(initialState)
      },

      /**
       * Check if location data is stale based on time
       */
      isLocationStale: () => {
        const { lastLocationUpdate } = get()
        if (!lastLocationUpdate) return true

        const lastUpdate = new Date(lastLocationUpdate)
        const now = new Date()
        const timeDiff = now.getTime() - lastUpdate.getTime()

        return timeDiff > STORE_CONSTANTS.LOCATION_CACHE_DURATION
      },

      /**
       * Check if location is stale based on distance from cached location
       */
      isLocationDistanceStale: async () => {
        const distanceFromCached = await get().getDistanceFromCachedLocation()
        if (distanceFromCached === null) return true
        
        // Consider location stale if user has moved more than 5km
        return distanceFromCached > 5000 // 5km in meters
      },

      /**
       * Check if user has moved significantly from their cached location
       */
      hasUserMovedSignificantly: async () => {
        try {
          if (!navigator.geolocation) return false

          const currentLocation = await new Promise<GeolocationCoordinates>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) => resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
              }),
              reject,
              {
                enableHighAccuracy: false, // Use less accurate but faster location for distance check
                timeout: 10000, // 10 second timeout
                maximumAge: 60000 // Accept 1-minute old location for this check
              }
            )
          })

          const cachedLocation = get().userLocation
          if (!cachedLocation) return true

          const distance = calculateDistance(
            cachedLocation.latitude,
            cachedLocation.longitude,
            currentLocation.latitude,
            currentLocation.longitude
          )

          // Consider user has moved significantly if distance > 2km
          return distance > 2000 // 2km in meters
        } catch (error) {
          console.warn('Unable to check location change:', error)
          return false // Don't assume movement if we can't check
        }
      },

      /**
       * Determine if we should prompt user to update their store selection
       */
      shouldPromptStoreUpdate: async () => {
        const state = get()
        
        // Always prompt if no store is selected
        if (!state.selectedStore) return true
        
        // Don't prompt if location services are not available
        if (!navigator.geolocation) return false
        
        // Check both time-based and distance-based staleness
        const isTimeStale = state.isLocationStale()
        const isDistanceStale = await state.isLocationDistanceStale()
        const hasMovedSignificantly = await state.hasUserMovedSignificantly()
        
        // Prompt if either:
        // 1. Time-based staleness (old logic)
        // 2. User has moved significantly from cached location
        // 3. Distance from cached location is stale
        return isTimeStale || hasMovedSignificantly || isDistanceStale
      },

      /**
       * Get distance from current location to cached location
       */
      getDistanceFromCachedLocation: async () => {
        try {
          const cachedLocation = get().userLocation
          if (!cachedLocation) return null

          if (!navigator.geolocation) return null

          const currentLocation = await new Promise<GeolocationCoordinates>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) => resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
              }),
              reject,
              {
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 300000 // Accept 5-minute old location
              }
            )
          })

          return calculateDistance(
            cachedLocation.latitude,
            cachedLocation.longitude,
            currentLocation.latitude,
            currentLocation.longitude
          )
        } catch (error) {
          console.warn('Unable to calculate distance from cached location:', error)
          return null
        }
      },

      /**
       * Get distance to currently selected store
       */
      getDistanceToSelectedStore: () => {
        const { userLocation, selectedStore } = get()
        if (!userLocation) return null

        try {
          const { distance } = findNearestStore(userLocation)
          return distance
        } catch {
          return null
        }
      },

      /**
       * Register callback for store changes
       */
      onStoreChange: (callback: (store: StoreCode) => void) => {
        const state = get() as any
        const callbacks = state._storeChangeCallbacks || []
        const newCallbacks = [...callbacks, callback]
        
        set({ _storeChangeCallbacks: newCallbacks } as any)

        // Return unsubscribe function
        return () => {
          const currentState = get() as any
          const currentCallbacks = currentState._storeChangeCallbacks || []
          const filteredCallbacks = currentCallbacks.filter((cb: any) => cb !== callback)
          set({ _storeChangeCallbacks: filteredCallbacks } as any)
        }
      }
    }),
    {
      name: 'store-selection-storage',
      storage: createJSONStorage(() => {
        // Use localStorage in browser, fallback for SSR
        if (typeof window !== 'undefined') {
          return localStorage
        }
        
        // Mock storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {}
        }
      }),
      partialize: (state) => ({
        // Only persist essential state, not loading states or callbacks
        selectedStore: state.selectedStore,
        userLocation: state.userLocation,
        nearestStore: state.nearestStore,
        lastLocationUpdate: state.lastLocationUpdate
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle migration from older versions
        if (version === 0) {
          // Migration logic for version 0 to 1
          return {
            ...initialState,
            ...persistedState,
            selectedStore: isValidStoreCode(persistedState.selectedStore) 
              ? persistedState.selectedStore 
              : DEFAULT_STORE
          }
        }
        
        return persistedState
      }
    }
  )
)

/**
 * Hook to get just the selected store (for performance)
 */
export const useSelectedStore = () => useStoreSelectionStore(state => state.selectedStore)

/**
 * Hook to get user location
 */
export const useUserLocation = () => useStoreSelectionStore(state => state.userLocation)

/**
 * Hook to get location loading state
 */
export const useLocationLoading = () => useStoreSelectionStore(state => state.isLoadingLocation)

/**
 * Hook to get location error
 */
export const useLocationError = () => useStoreSelectionStore(state => state.locationError)

/**
 * Hook for store selection actions
 */
export const useStoreActions = () => useStoreSelectionStore(state => ({
  setSelectedStore: state.setSelectedStore,
  requestLocation: state.requestLocation,
  detectNearestStore: state.detectNearestStore,
  clearLocationError: state.clearLocationError,
  resetStore: state.resetStore
}))

/**
 * Initialize store selection on app start with enhanced staleness detection
 */
export const initializeStoreSelection = async () => {
  const store = useStoreSelectionStore.getState()
  
  try {
    // Check if we should prompt for store update using enhanced detection
    const shouldUpdate = await store.shouldPromptStoreUpdate()
    
    if (shouldUpdate) {
      console.log('Store selection needs update based on time/distance criteria')
      
      // Try to detect nearest store automatically
      await store.detectNearestStore()
      
      // If detection was successful, check if the nearest store is different
      const newState = useStoreSelectionStore.getState()
      if (newState.nearestStore && newState.nearestStore !== store.selectedStore) {
        console.log(`Store changed from ${store.selectedStore} to ${newState.nearestStore}`)
      }
    } else {
      console.log('Store selection is still valid')
    }
  } catch (error) {
    console.log('Auto location detection failed, using current/default store:', error)
    
    // Fallback to default store if current selection is invalid
    if (!store.selectedStore || !isValidStoreCode(store.selectedStore)) {
      store.setSelectedStore(DEFAULT_STORE)
    }
  }
}

/**
 * Enhanced store update check that can be called periodically
 * This function can be used to check if store selection needs updating
 * during app usage (e.g., when user navigates to key pages)
 */
export const checkAndPromptStoreUpdate = async (): Promise<{
  shouldUpdate: boolean;
  reason?: 'time' | 'distance' | 'movement' | 'no_store';
  distance?: number;
}> => {
  const store = useStoreSelectionStore.getState()
  
  // Check if no store is selected
  if (!store.selectedStore) {
    return { shouldUpdate: true, reason: 'no_store' }
  }
  
  // Check time-based staleness
  const isTimeStale = store.isLocationStale()
  if (isTimeStale) {
    return { shouldUpdate: true, reason: 'time' }
  }
  
  try {
    // Check distance-based staleness
    const hasMovedSignificantly = await store.hasUserMovedSignificantly()
    if (hasMovedSignificantly) {
      const distance = await store.getDistanceFromCachedLocation()
      return { 
        shouldUpdate: true, 
        reason: 'movement', 
        distance: distance || undefined 
      }
    }
    
    const isDistanceStale = await store.isLocationDistanceStale()
    if (isDistanceStale) {
      const distance = await store.getDistanceFromCachedLocation()
      return { 
        shouldUpdate: true, 
        reason: 'distance', 
        distance: distance || undefined 
      }
    }
    
    return { shouldUpdate: false }
  } catch (error) {
    console.warn('Error checking store update need:', error)
    return { shouldUpdate: false }
  }
}

/**
 * Cookie-based fallback for SSR compatibility
 */
export const getSelectedStoreFromCookie = (): StoreCode => {
  if (typeof document === 'undefined') return DEFAULT_STORE
  
  const cookies = document.cookie.split(';')
  const storeCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${STORE_CONSTANTS.SELECTED_STORE_CACHE_KEY}=`)
  )
  
  if (storeCookie) {
    const storeCode = storeCookie.split('=')[1]
    return isValidStoreCode(storeCode) ? storeCode : DEFAULT_STORE
  }
  
  return DEFAULT_STORE
}

/**
 * Set selected store in cookie for SSR
 */
export const setSelectedStoreInCookie = (store: StoreCode) => {
  if (typeof document === 'undefined') return
  
  const expirationDate = new Date()
  expirationDate.setFullYear(expirationDate.getFullYear() + 1) // 1 year
  
  document.cookie = `${STORE_CONSTANTS.SELECTED_STORE_CACHE_KEY}=${store}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`
}

/**
 * Utility function to check if geolocation is supported
 */
export const isGeolocationSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
}

/**
 * Utility function to get readable location error
 */
export const getLocationErrorMessage = (error: GeolocationPositionError | null): string => {
  if (!error) return ''
  
  switch (error.code) {
    case GeolocationPositionError.PERMISSION_DENIED:
      return STORE_ERRORS.GEOLOCATION_PERMISSION_DENIED
    case GeolocationPositionError.POSITION_UNAVAILABLE:
      return STORE_ERRORS.GEOLOCATION_POSITION_UNAVAILABLE
    case GeolocationPositionError.TIMEOUT:
      return STORE_ERRORS.GEOLOCATION_TIMEOUT
    default:
      return STORE_ERRORS.GEOLOCATION_POSITION_UNAVAILABLE
  }
}