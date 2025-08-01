/**
 * Store Selector Component
 * 
 * UI component for selecting between available stores with geolocation
 * support and distance calculations.
 */

'use client'

import { useState, useEffect } from 'react'
import { StoreCode, StoreDistance } from '@/lib/types'
import { 
  STORES, 
  ALL_STORES, 
  getStoresWithDistances, 
  formatDistance,
  getStoreDisplayName,
  isStoreOpen,
  getTodayOpeningHours,
  STORE_ERRORS,
  STORE_MESSAGES
} from '@/lib/config/stores'
import {
  useStoreSelectionStore,
  useSelectedStore,
  useUserLocation,
  useLocationLoading,
  useLocationError,
  useStoreActions,
  isGeolocationSupported
} from '@/lib/stores/storeSelectionStore'

interface StoreSelectorProps {
  isOpen: boolean
  onClose: () => void
  onStoreSelect?: (store: StoreCode) => void
  className?: string
  showDistances?: boolean
  autoDetect?: boolean
}

export default function StoreSelector({
  isOpen,
  onClose,
  onStoreSelect,
  className = '',
  showDistances = true,
  autoDetect = true
}: StoreSelectorProps) {
  const selectedStore = useSelectedStore()
  const userLocation = useUserLocation()
  const isLoadingLocation = useLocationLoading()
  const locationError = useLocationError()
  const { setSelectedStore, requestLocation, detectNearestStore, clearLocationError } = useStoreActions()

  const [storesWithDistances, setStoresWithDistances] = useState<StoreDistance[]>(ALL_STORES)
  const [isDetecting, setIsDetecting] = useState(false)

  // Update distances when user location changes
  useEffect(() => {
    if (userLocation && showDistances) {
      const storesWithDist = getStoresWithDistances(userLocation)
      setStoresWithDistances(storesWithDist)
    } else {
      setStoresWithDistances(ALL_STORES)
    }
  }, [userLocation, showDistances])

  // Auto-detect nearest store on mount if enabled
  useEffect(() => {
    if (autoDetect && isOpen && !userLocation && !isLoadingLocation && isGeolocationSupported()) {
      handleDetectNearest()
    }
  }, [isOpen, autoDetect])

  const handleStoreSelect = async (storeCode: StoreCode) => {
    setSelectedStore(storeCode)
    onStoreSelect?.(storeCode)
    onClose()
  }

  const handleDetectNearest = async () => {
    if (!isGeolocationSupported()) {
      return
    }

    setIsDetecting(true)
    clearLocationError()

    try {
      await detectNearestStore()
    } catch (error) {
      console.error('Failed to detect nearest store:', error)
    } finally {
      setIsDetecting(false)
    }
  }

  const handleLocationRequest = async () => {
    if (!isGeolocationSupported()) {
      return
    }

    try {
      await requestLocation()
    } catch (error) {
      console.error('Failed to request location:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${className}`}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform rounded-lg bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Choisir un magasin
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Location Controls */}
            {isGeolocationSupported() && (
              <div className="mt-4 space-y-3">
                {!userLocation && !locationError && (
                  <button
                    onClick={handleDetectNearest}
                    disabled={isLoadingLocation || isDetecting}
                    className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingLocation || isDetecting ? (
                      <>
                        <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Détection en cours...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Détecter le magasin le plus proche
                      </>
                    )}
                  </button>
                )}

                {locationError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{locationError}</p>
                        <button
                          onClick={handleLocationRequest}
                          className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Réessayer
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {userLocation && showDistances && (
                  <div className="flex items-center text-sm text-green-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Position détectée
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Store List */}
          <div className="px-6 py-4">
            <div className="space-y-3">
              {storesWithDistances.map((store) => {
                const isSelected = selectedStore === store.code
                const isOpen = isStoreOpen(store.code)
                const openingHours = getTodayOpeningHours(store.code)

                return (
                  <div
                    key={store.code}
                    className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleStoreSelect(store.code)}
                  >
                    {/* Selection Indicator */}
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>

                      {/* Store Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {store.name}
                          </h4>
                          {store.distance !== undefined && showDistances && (
                            <span className="text-sm text-gray-500">
                              {formatDistance(store.distance)}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-gray-600">
                          {store.location.address}
                        </p>

                        <div className="mt-2 flex items-center justify-between">
                          {/* Phone Number */}
                          <a
                            href={`tel:${store.phone}`}
                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {store.phone}
                          </a>

                          {/* Status */}
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              isOpen ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            <span className={`text-xs font-medium ${
                              isOpen ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {isOpen ? 'Ouvert' : 'Fermé'}
                            </span>
                          </div>
                        </div>

                        {/* Opening Hours */}
                        {openingHours && (
                          <p className="mt-1 text-xs text-gray-500">
                            Aujourd'hui: {openingHours.open} - {openingHours.close}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-600 text-center">
              Vous ne pouvez commander que dans un seul magasin à la fois
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Compact Store Selector for inline use
 */
interface CompactStoreSelectorProps {
  onStoreSelect?: (store: StoreCode) => void
  className?: string
  showLabels?: boolean
}

export function CompactStoreSelector({
  onStoreSelect,
  className = '',
  showLabels = true
}: CompactStoreSelectorProps) {
  const selectedStore = useSelectedStore()
  const userLocation = useUserLocation()
  const { setSelectedStore } = useStoreActions()

  const handleStoreSelect = (storeCode: StoreCode) => {
    setSelectedStore(storeCode)
    onStoreSelect?.(storeCode)
  }

  const storesWithDistances = userLocation 
    ? getStoresWithDistances(userLocation)
    : ALL_STORES

  return (
    <div className={`flex space-x-2 ${className}`}>
      {storesWithDistances.map((store) => {
        const isSelected = selectedStore === store.code
        const isOpen = isStoreOpen(store.code)

        return (
          <button
            key={store.code}
            onClick={() => handleStoreSelect(store.code)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isSelected
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={!isOpen}
          >
            <div className="flex items-center justify-center space-x-1">
              <span>{showLabels ? store.name : store.code}</span>
              {store.distance !== undefined && (
                <span className="text-xs opacity-75">
                  ({formatDistance(store.distance)})
                </span>
              )}
              {!isOpen && (
                <span className="text-xs opacity-60">(Fermé)</span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}