/**
 * Store Configuration for MonEpice&Riz
 * 
 * This file defines the two physical store locations in Abidjan
 * with their complete information, coordinates, and utility functions
 * for geolocation-based store selection.
 */

import { Store, StoreCode, StoreDistance, GeolocationCoordinates } from '@/lib/types'

/**
 * Physical store configurations for Cocody and Koumassi locations
 */
export const STORES: Record<StoreCode, Store> = {
  COCODY: {
    code: 'COCODY',
    name: 'MonEpice&Riz Cocody',
    location: {
      latitude: 5.3515625, // Cocody area coordinates
      longitude: -3.9936523,
      address: 'Boulevard de la République, Cocody',
      zone: 'Cocody'
    },
    phone: '0161888888',
    email: 'cocody@monepiceriz.ci',
    operatingHours: {
      monday: { open: '07:00', close: '21:00' },
      tuesday: { open: '07:00', close: '21:00' },
      wednesday: { open: '07:00', close: '21:00' },
      thursday: { open: '07:00', close: '21:00' },
      friday: { open: '07:00', close: '21:00' },
      saturday: { open: '07:00', close: '22:00' },
      sunday: { open: '08:00', close: '20:00' }
    },
    deliveryRadius: 15, // 15km radius
    isActive: true
  },
  KOUMASSI: {
    code: 'KOUMASSI',
    name: 'MonEpice&Riz Koumassi',
    location: {
      latitude: 5.2897949, // Koumassi area coordinates
      longitude: -3.9208984,
      address: 'Avenue principale, Koumassi',
      zone: 'Koumassi'
    },
    phone: '0172089090',
    email: 'koumassi@monepiceriz.ci',
    operatingHours: {
      monday: { open: '07:00', close: '21:00' },
      tuesday: { open: '07:00', close: '21:00' },
      wednesday: { open: '07:00', close: '21:00' },
      thursday: { open: '07:00', close: '21:00' },
      friday: { open: '07:00', close: '21:00' },
      saturday: { open: '07:00', close: '22:00' },
      sunday: { open: '08:00', close: '20:00' }
    },
    deliveryRadius: 15, // 15km radius
    isActive: true
  }
}

/**
 * Default store (fallback when location is unavailable)
 */
export const DEFAULT_STORE: StoreCode = 'COCODY'

/**
 * All store codes as an array for iteration
 */
export const ALL_STORE_CODES: StoreCode[] = Object.keys(STORES) as StoreCode[]

/**
 * All stores as an array for iteration
 */
export const ALL_STORES: Store[] = Object.values(STORES)

/**
 * Calculate distance between two geographic points using Haversine formula
 * @param point1 - First coordinate point
 * @param point2 - Second coordinate point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  point1: GeolocationCoordinates,
  point2: GeolocationCoordinates
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(point2.latitude - point1.latitude)
  const dLon = toRadians(point2.longitude - point1.longitude)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) * Math.cos(toRadians(point2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in kilometers
}

/**
 * Convert degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Find the nearest store to a given location
 * @param userLocation - User's current coordinates
 * @returns The nearest store code and distance
 */
export function findNearestStore(userLocation: GeolocationCoordinates): {
  store: StoreCode;
  distance: number;
} {
  let nearestStore: StoreCode = DEFAULT_STORE
  let minDistance = Infinity
  
  for (const storeCode of ALL_STORE_CODES) {
    const store = STORES[storeCode]
    const distance = calculateDistance(userLocation, store.location)
    
    if (distance < minDistance) {
      minDistance = distance
      nearestStore = storeCode
    }
  }
  
  return {
    store: nearestStore,
    distance: minDistance
  }
}

/**
 * Get stores with distances from user location
 * @param userLocation - User's current coordinates
 * @returns Array of stores with calculated distances
 */
export function getStoresWithDistances(userLocation: GeolocationCoordinates): StoreDistance[] {
  return ALL_STORES.map(store => ({
    ...store,
    distance: calculateDistance(userLocation, store.location)
  })).sort((a, b) => (a.distance || 0) - (b.distance || 0))
}

/**
 * Check if a location is within delivery radius of a store
 * @param userLocation - User's location
 * @param storeCode - Store to check
 * @returns True if within delivery radius
 */
export function isWithinDeliveryRadius(
  userLocation: GeolocationCoordinates,
  storeCode: StoreCode
): boolean {
  const store = STORES[storeCode]
  const distance = calculateDistance(userLocation, store.location)
  return distance <= store.deliveryRadius
}

/**
 * Get available delivery stores for a location
 * @param userLocation - User's location
 * @returns Array of stores that can deliver to the location
 */
export function getAvailableDeliveryStores(userLocation: GeolocationCoordinates): StoreDistance[] {
  return getStoresWithDistances(userLocation).filter(store => 
    store.distance !== undefined && store.distance <= store.deliveryRadius
  )
}

/**
 * Validate if a store code is valid
 * @param storeCode - Store code to validate
 * @returns True if valid store code
 */
export function isValidStoreCode(storeCode: string): storeCode is StoreCode {
  return ALL_STORE_CODES.includes(storeCode as StoreCode)
}

/**
 * Get store by code with error handling
 * @param storeCode - Store code
 * @returns Store object or null if invalid
 */
export function getStoreByCode(storeCode: StoreCode): Store | null {
  return STORES[storeCode] || null
}

/**
 * Format distance for display
 * @param distance - Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  return `${distance.toFixed(1)}km`
}

/**
 * Get store display name with distance
 * @param store - Store with distance
 * @returns Formatted store name with distance
 */
export function getStoreDisplayName(store: StoreDistance): string {
  const baseName = store.name
  if (store.distance !== undefined) {
    return `${baseName} (${formatDistance(store.distance)})`
  }
  return baseName
}

/**
 * Check if store is currently open based on operating hours
 * @param storeCode - Store to check
 * @param date - Date to check (defaults to now)
 * @returns True if store is open
 */
export function isStoreOpen(storeCode: StoreCode, date: Date = new Date()): boolean {
  const store = STORES[storeCode]
  if (!store || !store.isActive) return false
  
  const dayOfWeek = date.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase()
  const hours = store.operatingHours[dayOfWeek]
  
  if (!hours || hours.closed) return false
  
  const currentTime = date.toTimeString().slice(0, 5) // HH:MM format
  return currentTime >= hours.open && currentTime <= hours.close
}

/**
 * Get store opening hours for today
 * @param storeCode - Store code
 * @returns Opening hours for today or null if closed
 */
export function getTodayOpeningHours(storeCode: StoreCode): { open: string; close: string } | null {
  const store = STORES[storeCode]
  if (!store) return null
  
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase()
  const hours = store.operatingHours[today]
  
  return (hours && !hours.closed) ? { open: hours.open, close: hours.close } : null
}

/**
 * Constants for geolocation and store selection
 */
export const STORE_CONSTANTS = {
  // Geolocation settings
  GEOLOCATION_TIMEOUT: 10000, // 10 seconds
  GEOLOCATION_MAX_AGE: 300000, // 5 minutes
  GEOLOCATION_HIGH_ACCURACY: true,
  
  // Distance settings
  MAX_DELIVERY_DISTANCE: 20, // km
  MIN_DISTANCE_FOR_ACCURACY: 0.1, // km
  
  // Cache settings
  LOCATION_CACHE_DURATION: 3600000, // 1 hour in milliseconds
  STORE_DISTANCE_CACHE_KEY: 'store_distances',
  SELECTED_STORE_CACHE_KEY: 'selected_store',
  
  // UI settings
  DEFAULT_ZOOM_LEVEL: 12,
  MAP_CENTER_ABIDJAN: {
    latitude: 5.3364308,
    longitude: -4.0266588
  }
} as const

/**
 * Error messages for store selection (in French)
 */
export const STORE_ERRORS = {
  GEOLOCATION_NOT_SUPPORTED: 'La géolocalisation n\'est pas supportée par votre navigateur',
  GEOLOCATION_PERMISSION_DENIED: 'L\'accès à votre position a été refusé',
  GEOLOCATION_POSITION_UNAVAILABLE: 'Votre position n\'est pas disponible',
  GEOLOCATION_TIMEOUT: 'La demande de géolocalisation a expiré',
  NO_STORES_IN_RANGE: 'Aucun magasin ne livre dans votre zone',
  STORE_NOT_FOUND: 'Magasin introuvable',
  STORE_CLOSED: 'Ce magasin est actuellement fermé',
  INVALID_COORDINATES: 'Coordonnées géographiques invalides'
} as const

/**
 * Success messages for store selection (in French)
 */
export const STORE_MESSAGES = {
  NEAREST_STORE_SELECTED: 'Le magasin le plus proche a été sélectionné automatiquement',
  STORE_CHANGED: 'Magasin modifié avec succès',
  LOCATION_DETECTED: 'Votre position a été détectée avec succès',
  DELIVERY_AVAILABLE: 'Livraison disponible dans votre zone'
} as const