/**
 * Store Provider
 * 
 * Provides store selection context and initialization logic
 * for the entire application. Handles geolocation, store switching,
 * and cart conflict resolution.
 */

'use client'

import { useEffect, useState } from 'react'
import { StoreCode, CartItem } from '@/lib/types'
import { 
  initializeStoreSelection, 
  useStoreSelectionStore,
  useSelectedStore,
  useStoreActions 
} from '@/lib/stores/storeSelectionStore'
import { 
  setCartStoreConflictHandler,
  defaultStoreConflictHandler 
} from '@/lib/stores/cartStore'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateStoreQueries } from './QueryProvider'

interface StoreProviderProps {
  children: React.ReactNode
}

export function StoreProvider({ children }: StoreProviderProps) {
  const selectedStore = useSelectedStore()
  const { setSelectedStore } = useStoreActions()
  const queryClient = useQueryClient()
  
  const [isInitialized, setIsInitialized] = useState(false)
  const [showInitialStoreSelector, setShowInitialStoreSelector] = useState(false)

  // Initialize store selection on mount
  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      try {
        await initializeStoreSelection()
        
        if (mounted) {
          setIsInitialized(true)
          
          // Check if no store is selected and user needs to choose
          const currentStore = useStoreSelectionStore.getState().selectedStore
          if (!currentStore) {
            setShowInitialStoreSelector(true)
          }
        }
      } catch (error) {
        console.error('Failed to initialize store selection:', error)
        if (mounted) {
          setIsInitialized(true)
        }
      }
    }

    initialize()

    return () => {
      mounted = false
    }
  }, [])

  // Set up cart store conflict handler
  useEffect(() => {
    const conflictHandler = async (
      currentStore: StoreCode,
      newStore: StoreCode,
      conflictItems: CartItem[]
    ): Promise<boolean> => {
      // Use default confirmation dialog
      const shouldSwitch = await defaultStoreConflictHandler(currentStore, newStore, conflictItems)
      
      if (shouldSwitch) {
        // Invalidate availability queries for the new store
        await invalidateStoreQueries(queryClient, newStore)
      }
      
      return shouldSwitch
    }

    setCartStoreConflictHandler(conflictHandler)
  }, [queryClient])

  // Handle store changes and invalidate relevant queries
  useEffect(() => {
    if (!selectedStore) return

    // Invalidate store-specific queries when store changes
    invalidateStoreQueries(queryClient, selectedStore)
    
    // Set up store change listener
    const unsubscribe = useStoreSelectionStore.getState().onStoreChange((newStore) => {
      // Invalidate queries for the new store
      invalidateStoreQueries(queryClient, newStore)
      
      // Optional: Show a brief notification about store change
      console.log(`Store changed to: ${newStore}`)
    })

    return unsubscribe
  }, [selectedStore, queryClient])

  // Handle initial store selection modal
  const handleInitialStoreSelect = (store: StoreCode) => {
    setSelectedStore(store)
    setShowInitialStoreSelector(false)
  }

  // Show loading state during initialization
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initialisation de l'application...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {children}
      
      {/* Initial Store Selection Modal */}
      {showInitialStoreSelector && (
        <InitialStoreSelectionModal
          onStoreSelect={handleInitialStoreSelect}
          onClose={() => setShowInitialStoreSelector(false)}
        />
      )}
    </>
  )
}

/**
 * Initial Store Selection Modal
 * Shown when user visits the app for the first time
 */
interface InitialStoreSelectionModalProps {
  onStoreSelect: (store: StoreCode) => void
  onClose: () => void
}

function InitialStoreSelectionModal({ onStoreSelect, onClose }: InitialStoreSelectionModalProps) {
  const { detectNearestStore } = useStoreActions()
  const [isDetecting, setIsDetecting] = useState(false)

  const handleAutoDetect = async () => {
    setIsDetecting(true)
    try {
      await detectNearestStore()
      onClose() // Close modal after auto-detection
    } catch (error) {
      console.error('Auto-detection failed:', error)
    } finally {
      setIsDetecting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Bienvenue chez MonEpice&Riz !
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Choisissez votre magasin pour commencer vos achats
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="space-y-4">
              {/* Auto-detect button */}
              <button
                onClick={handleAutoDetect}
                disabled={isDetecting}
                className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDetecting ? (
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

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">ou choisissez manuellement</span>
                </div>
              </div>

              {/* Manual store selection */}
              <div className="space-y-2">
                <button
                  onClick={() => onStoreSelect('COCODY')}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">MonEpice&Riz Cocody</div>
                  <div className="text-sm text-gray-600">Boulevard de la République, Cocody</div>
                  <div className="text-sm text-blue-600">0161888888</div>
                </button>

                <button
                  onClick={() => onStoreSelect('KOUMASSI')}
                  className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">MonEpice&Riz Koumassi</div>
                  <div className="text-sm text-gray-600">Avenue principale, Koumassi</div>
                  <div className="text-sm text-blue-600">0172089090</div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-600 text-center">
              Vous pourrez changer de magasin à tout moment
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook to check if store context is ready
 */
export function useStoreReady() {
  const selectedStore = useSelectedStore()
  return !!selectedStore
}

/**
 * Store context ready guard component
 * Only renders children when store is selected
 */
interface StoreReadyGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function StoreReadyGuard({ children, fallback }: StoreReadyGuardProps) {
  const isReady = useStoreReady()
  
  if (!isReady) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-pulse rounded-full h-12 w-12 bg-gray-300 mx-auto mb-4"></div>
          <p className="text-gray-600">Sélection du magasin...</p>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}