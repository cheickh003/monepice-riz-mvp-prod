/**
 * Store Banner Component
 * 
 * Banner component that appears at the top of pages showing the currently
 * selected store with quick access to store switching functionality.
 */

'use client'

import { useState } from 'react'
import { StoreCode } from '@/lib/types'
import {
  STORES,
  formatDistance,
  isStoreOpen,
  getTodayOpeningHours
} from '@/lib/config/stores'
import {
  useSelectedStore,
  useUserLocation,
  useStoreActions
} from '@/lib/stores/storeSelectionStore'
import StoreSelector from './StoreSelector'

interface StoreBannerProps {
  className?: string
  isDismissible?: boolean
  showDeliveryInfo?: boolean
  showOpeningHours?: boolean
  variant?: 'full' | 'compact' | 'minimal'
}

export default function StoreBanner({
  className = '',
  isDismissible = false,
  showDeliveryInfo = true,
  showOpeningHours = true,
  variant = 'full'
}: StoreBannerProps) {
  const selectedStore = useSelectedStore()
  const userLocation = useUserLocation()
  const { setSelectedStore } = useStoreActions()

  const [isStoreSelectorOpen, setIsStoreSelectorOpen] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed || !selectedStore) return null

  const store = STORES[selectedStore]
  const isOpen = isStoreOpen(selectedStore)
  const openingHours = getTodayOpeningHours(selectedStore)
  const distance = userLocation ? 
    Math.round(Math.sqrt(
      Math.pow(userLocation.latitude - store.location.latitude, 2) + 
      Math.pow(userLocation.longitude - store.location.longitude, 2)
    ) * 111) : null // Rough distance calculation

  const handleStoreChange = () => {
    setIsStoreSelectorOpen(true)
  }

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  // Minimal variant - just store name and change button
  if (variant === 'minimal') {
    return (
      <>
        <div className={`bg-blue-50 border-b border-blue-200 ${className}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-blue-800">
                Magasin: {store.name}
              </span>
              <button
                onClick={handleStoreChange}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Changer
              </button>
            </div>
          </div>
        </div>

        <StoreSelector
          isOpen={isStoreSelectorOpen}
          onClose={() => setIsStoreSelectorOpen(false)}
          onStoreSelect={(newStore) => {
            setSelectedStore(newStore)
            setIsStoreSelectorOpen(false)
          }}
        />
      </>
    )
  }

  // Compact variant - single line with essential info
  if (variant === 'compact') {
    return (
      <>
        <div className={`bg-white border-b border-gray-200 shadow-sm ${className}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-medium text-gray-900">{store.name}</span>
                  {distance && (
                    <span className="text-sm text-gray-500">({distance}km)</span>
                  )}
                </div>

                <a
                  href={`tel:${store.phone}`}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {store.phone}
                </a>
              </div>

              <div className="flex items-center space-x-3">
                {openingHours && (
                  <span className="text-sm text-gray-600">
                    {openingHours.open} - {openingHours.close}
                  </span>
                )}
                
                <button
                  onClick={handleStoreChange}
                  className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors"
                >
                  Changer
                </button>

                {isDismissible && (
                  <button
                    onClick={handleDismiss}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <StoreSelector
          isOpen={isStoreSelectorOpen}
          onClose={() => setIsStoreSelectorOpen(false)}
          onStoreSelect={(newStore) => {
            setSelectedStore(newStore)
            setIsStoreSelectorOpen(false)
          }}
        />
      </>
    )
  }

  // Full variant - complete store information
  return (
    <>
      <div className={`bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-start space-x-4">
              {/* Store Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0v-4a2 2 0 012-2h10a2 2 0 012 2v4" />
                  </svg>
                </div>
              </div>

              {/* Store Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-gray-900">{store.name}</h2>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isOpen 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {isOpen ? 'Ouvert' : 'Fermé'}
                  </div>
                  {distance && (
                    <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {distance}km
                    </span>
                  )}
                </div>

                <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-1 sm:space-y-0">
                  {/* Address */}
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {store.location.address}
                  </div>

                  {/* Phone */}
                  <a
                    href={`tel:${store.phone}`}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {store.phone}
                  </a>

                  {/* Opening Hours */}
                  {showOpeningHours && openingHours && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Aujourd'hui: {openingHours.open} - {openingHours.close}
                    </div>
                  )}
                </div>

                {/* Delivery Info */}
                {showDeliveryInfo && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Livraison disponible dans un rayon de {store.deliveryRadius}km
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleStoreChange}
                className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Changer de magasin
              </button>

              {isDismissible && (
                <button
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <StoreSelector
        isOpen={isStoreSelectorOpen}
        onClose={() => setIsStoreSelectorOpen(false)}
        onStoreSelect={(newStore) => {
          setSelectedStore(newStore)
          setIsStoreSelectorOpen(false)
        }}
      />
    </>
  )
}

/**
 * Floating Store Indicator
 * A small floating indicator that shows current store
 */
interface FloatingStoreIndicatorProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  className?: string
  onStoreChange?: (store: StoreCode) => void
}

export function FloatingStoreIndicator({
  position = 'top-right',
  className = '',
  onStoreChange
}: FloatingStoreIndicatorProps) {
  const selectedStore = useSelectedStore()
  const [isStoreSelectorOpen, setIsStoreSelectorOpen] = useState(false)

  if (!selectedStore) return null

  const store = STORES[selectedStore]
  const isOpen = isStoreOpen(selectedStore)

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }

  return (
    <>
      <div className={`fixed z-40 ${positionClasses[position]} ${className}`}>
        <button
          onClick={() => setIsStoreSelectorOpen(true)}
          className="bg-white shadow-lg rounded-lg border border-gray-200 p-3 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium text-gray-900">
              {store.code}
            </span>
          </div>
        </button>
      </div>

      <StoreSelector
        isOpen={isStoreSelectorOpen}
        onClose={() => setIsStoreSelectorOpen(false)}
        onStoreSelect={(newStore) => {
          onStoreChange?.(newStore)
          setIsStoreSelectorOpen(false)
        }}
      />
    </>
  )
}

/**
 * Store Status Bar
 * Simple status bar showing store availability
 */
export function StoreStatusBar({ className = '' }: { className?: string }) {
  const selectedStore = useSelectedStore()

  if (!selectedStore) return null

  const store = STORES[selectedStore]
  const isOpen = isStoreOpen(selectedStore)

  return (
    <div className={`bg-gray-50 border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-gray-600">
              {store.name} - {isOpen ? 'Ouvert' : 'Fermé'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}