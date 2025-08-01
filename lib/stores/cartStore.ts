import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, Cart, StoreCode } from '@/lib/types';
import { useStoreSelectionStore } from './storeSelectionStore';
import { DEFAULT_STORE } from '@/lib/config/stores';

interface CartStore {
  items: CartItem[];
  selectedStore?: StoreCode;
  
  // Core cart operations
  addItem: (product: Product, quantity?: number, fromStore?: StoreCode) => Promise<boolean>;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  
  // Cart information
  getCart: () => Cart;
  getTotalItems: () => number;
  isInCart: (productId: number) => boolean;
  getItemQuantity: (productId: number) => number;
  
  // Store-aware operations
  setStore: (store: StoreCode) => void;
  switchStore: (newStore: StoreCode) => Promise<boolean>;
  validateStoreConsistency: () => boolean;
  hasItemsFromStore: (store: StoreCode) => boolean;
  getStoreConflictItems: (newStore: StoreCode) => CartItem[];
  
  // Store switching callbacks
  onStoreConflict?: (currentStore: StoreCode, newStore: StoreCode, conflictItems: CartItem[]) => Promise<boolean>;
}

// Frais de livraison et de préparation
const DELIVERY_FEE = 1500;
const PREPARATION_FEE = 500;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      selectedStore: undefined,
      onStoreConflict: undefined,

      /**
       * Add item to cart with store validation
       */
      addItem: async (product: Product, quantity = 1, fromStore?: StoreCode): Promise<boolean> => {
        const currentStore = get().selectedStore
        const currentStoreSelection = useStoreSelectionStore.getState().selectedStore
        const targetStore = fromStore || currentStore || currentStoreSelection

        // Check for store conflicts
        if (currentStore && currentStore !== targetStore) {
          const conflictItems = get().getStoreConflictItems(targetStore)
          if (conflictItems.length > 0) {
            // Handle store conflict
            const onStoreConflict = get().onStoreConflict
            if (onStoreConflict) {
              const shouldSwitch = await onStoreConflict(currentStore, targetStore, conflictItems)
              if (!shouldSwitch) {
                return false // User cancelled
              }
              // Clear cart and switch store
              get().clearCart()
              get().setStore(targetStore)
            } else {
              // Default behavior: reject addition
              console.warn(`Cannot add item from ${targetStore} to cart with items from ${currentStore}`)
              return false
            }
          }
        }

        // Set store if not set
        if (!currentStore) {
          get().setStore(targetStore)
        }

        // Add item to cart
        set((state) => {
          const existingItem = state.items.find(item => item.product.id === product.id)
          
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            }
          }
          
          return {
            items: [...state.items, { 
              product, 
              quantity, 
              selectedStore: targetStore 
            }],
          }
        })
        
        return true
      },

      removeItem: (productId: number) => {
        set((state) => {
          const newItems = state.items.filter(item => item.product.id !== productId)
          
          // If cart is empty, clear selected store
          const newState: any = { items: newItems }
          if (newItems.length === 0) {
            newState.selectedStore = undefined
          }
          
          return newState
        })
      },

      updateQuantity: (productId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        set((state) => ({
          items: state.items.map(item =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          ),
        }))
      },

      clearCart: () => {
        set({ items: [], selectedStore: undefined })
      },

      setStore: (store: StoreCode) => {
        set({ selectedStore: store })
        
        // Update all cart items to reflect the new store
        set((state) => ({
          items: state.items.map(item => ({
            ...item,
            selectedStore: store
          }))
        }))
      },

      switchStore: async (newStore: StoreCode): Promise<boolean> => {
        const currentStore = get().selectedStore
        
        if (!currentStore || currentStore === newStore) {
          get().setStore(newStore)
          return true
        }

        const conflictItems = get().getStoreConflictItems(newStore)
        if (conflictItems.length > 0) {
          const onStoreConflict = get().onStoreConflict
          if (onStoreConflict) {
            const shouldSwitch = await onStoreConflict(currentStore, newStore, conflictItems)
            if (shouldSwitch) {
              get().clearCart()
              get().setStore(newStore)
            }
            return shouldSwitch
          } else {
            // Default: clear cart when switching stores
            get().clearCart()
            get().setStore(newStore)
            return true
          }
        }

        get().setStore(newStore)
        return true
      },

      validateStoreConsistency: () => {
        const state = get()
        if (state.items.length === 0) return true
        
        const stores = new Set(state.items.map(item => item.selectedStore).filter(Boolean))
        return stores.size <= 1
      },

      hasItemsFromStore: (store: StoreCode) => {
        const state = get()
        return state.items.some(item => item.selectedStore === store)
      },

      getStoreConflictItems: (newStore: StoreCode) => {
        const state = get()
        return state.items.filter(item => 
          item.selectedStore && item.selectedStore !== newStore
        )
      },

      getCart: () => {
        const state = get()
        const subtotal = state.items.reduce((total, item) => {
          const price = item.product.isPromo && item.product.promoPrice
            ? item.product.promoPrice
            : item.product.price
          return total + (price * item.quantity)
        }, 0)

        const totalItems = state.items.reduce((total, item) => total + item.quantity, 0)

        return {
          items: state.items,
          totalItems,
          subtotal,
          deliveryFee: totalItems > 0 ? DELIVERY_FEE : 0,
          preparationFee: totalItems > 0 ? PREPARATION_FEE : 0,
          total: subtotal + (totalItems > 0 ? DELIVERY_FEE + PREPARATION_FEE : 0),
          selectedStore: state.selectedStore,
        }
      },

      getTotalItems: () => {
        const state = get()
        return state.items.reduce((total, item) => total + item.quantity, 0)
      },

      isInCart: (productId: number) => {
        const state = get()
        return state.items.some(item => item.product.id === productId)
      },

      getItemQuantity: (productId: number) => {
        const state = get()
        const item = state.items.find(item => item.product.id === productId)
        return item ? item.quantity : 0
      },
    }),
    {
      name: 'monepiceriz-cart',
      partialize: (state) => ({
        // Persist essential cart data
        items: state.items,
        selectedStore: state.selectedStore
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle migration from version 0 (old cart without store support)
        if (version === 0) {
          return {
            items: persistedState.items?.map((item: any) => ({
              ...item,
              selectedStore: undefined // Will be set when items are added
            })) || [],
            selectedStore: undefined
          }
        }
        return persistedState
      }
    }
  )
)

/**
 * Hook to get cart with store information
 */
export const useCartWithStore = () => {
  const cart = useCartStore(state => state.getCart())
  const selectedStore = useStoreSelectionStore(state => state.selectedStore)
  
  return {
    ...cart,
    selectedStore: cart.selectedStore || selectedStore
  }
}

/**
 * Hook for cart actions
 */
export const useCartActions = () => useCartStore(state => ({
  addItem: state.addItem,
  removeItem: state.removeItem,
  updateQuantity: state.updateQuantity,
  clearCart: state.clearCart,
  setStore: state.setStore,
  switchStore: state.switchStore
}))

/**
 * Hook to check if cart has store conflicts
 */
export const useCartStoreValidation = () => useCartStore(state => ({
  validateStoreConsistency: state.validateStoreConsistency,
  hasItemsFromStore: state.hasItemsFromStore,
  getStoreConflictItems: state.getStoreConflictItems
}))

/**
 * Set up store conflict handler
 */
export const setCartStoreConflictHandler = (
  handler: (currentStore: StoreCode, newStore: StoreCode, conflictItems: CartItem[]) => Promise<boolean>
) => {
  useCartStore.setState({ onStoreConflict: handler })
}

/**
 * Default store conflict handler with confirmation dialog
 */
export const defaultStoreConflictHandler = async (
  currentStore: StoreCode,
  newStore: StoreCode,
  conflictItems: CartItem[]
): Promise<boolean> => {
  const message = `Votre panier contient des articles du magasin ${currentStore}. Voulez-vous vider le panier et passer au magasin ${newStore} ?`
  
  if (typeof window !== 'undefined') {
    return window.confirm(message)
  }
  
  // Fallback for SSR or testing
  return true
}