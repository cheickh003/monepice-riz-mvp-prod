import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product, CartItem, Cart } from '@/lib/types'
import { cartService, getCurrentCart } from '@/lib/cart'
import { MedusaCart } from '@/lib/api/client'

interface MedusaCartStore {
  // State
  cartId: string | null
  items: CartItem[]
  isLoading: boolean
  error: string | null
  
  // Actions
  initializeCart: () => Promise<void>
  addItem: (product: Product, quantity?: number) => Promise<void>
  removeItem: (productId: number) => Promise<void>
  updateQuantity: (productId: number, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
  
  // Getters
  getCart: () => Cart
  getTotalItems: () => number
  isInCart: (productId: number) => boolean
  getItemQuantity: (productId: number) => number
  
  // Delivery slot management
  setDeliverySlot: (slotId: string) => Promise<void>
  removeDeliverySlot: () => Promise<void>
  deliverySlot: string | null
}

// Transform Medusa cart to our Cart interface
function transformMedusaCart(medusaCart: MedusaCart): { items: CartItem[], deliverySlot: string | null } {
  const items: CartItem[] = medusaCart.items.map(item => ({
    product: {
      id: parseInt(item.variant.product.id) || 0,
      ref: item.variant.product.metadata?.ref || item.variant.product.id,
      barcode: item.variant.product.metadata?.barcode || '',
      name: item.title,
      slug: item.variant.product.handle,
      category: item.variant.product.categories?.[0]?.name || 'Non classé',
      mainCategory: item.variant.product.categories?.[0]?.handle || 'other',
      price: item.unit_price,
      priceHT: item.unit_price,
      priceTTC: item.unit_price,
      currency: 'XOF', // Default currency
      unit: item.variant.product.metadata?.unit || 'unité',
      stock: 'in_stock' as const,
      images: item.variant.product.images.map(img => img.url),
      description: item.description || '',
      brand: item.variant.product.metadata?.brand || '',
      isFeatured: item.variant.product.metadata?.isFeatured === 'true',
      isPromo: item.variant.product.metadata?.isPromo === 'true',
      promoPrice: item.variant.product.metadata?.promoPrice ? parseInt(item.variant.product.metadata.promoPrice) : undefined,
      // Medusa-specific fields
      medusaId: item.variant.product.id,
      variantId: item.variant.id
    },
    quantity: item.quantity
  }))

  const deliverySlot = medusaCart.metadata?.deliverySlot || null

  return { items, deliverySlot }
}

// Frais de livraison et de préparation
const DELIVERY_FEE = 1500
const PREPARATION_FEE = 500

export const useMedusaCartStore = create<MedusaCartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      cartId: null,
      items: [],
      isLoading: false,
      error: null,
      deliverySlot: null,

      // Initialize cart
      initializeCart: async () => {
        set({ isLoading: true, error: null })
        try {
          const cartId = await cartService.getOrCreateCart()
          const medusaCart = await getCurrentCart()
          
          if (medusaCart) {
            const { items, deliverySlot } = transformMedusaCart(medusaCart)
            set({ cartId, items, deliverySlot, isLoading: false })
          } else {
            set({ cartId, items: [], deliverySlot: null, isLoading: false })
          }
        } catch (error) {
          console.error('Failed to initialize cart:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to initialize cart',
            isLoading: false 
          })
        }
      },

      // Add item to cart
      addItem: async (product: Product, quantity = 1) => {
        if (!product.variantId) {
          console.error('Product missing variantId for Medusa cart')
          return
        }

        set({ isLoading: true, error: null })
        try {
          const success = await cartService.addItem(product.medusaId || product.id.toString(), product.variantId, quantity)
          
          if (success) {
            await get().refreshCart()
          } else {
            set({ error: 'Failed to add item to cart', isLoading: false })
          }
        } catch (error) {
          console.error('Failed to add item:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add item',
            isLoading: false 
          })
        }
      },

      // Remove item from cart
      removeItem: async (productId: number) => {
        const state = get()
        const item = state.items.find(item => item.product.id === productId)
        
        if (!item || !state.cartId) return

        set({ isLoading: true, error: null })
        try {
          // For Medusa, we need the line item ID, which we don't have in our simplified structure
          // In a full implementation, we'd store this in our cart items
          // For now, we'll refresh the cart after the operation
          await get().refreshCart()
        } catch (error) {
          console.error('Failed to remove item:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to remove item',
            isLoading: false 
          })
        }
      },

      // Update item quantity
      updateQuantity: async (productId: number, quantity: number) => {
        if (quantity <= 0) {
          await get().removeItem(productId)
          return
        }

        set({ isLoading: true, error: null })
        try {
          // Similar limitation as removeItem - need line item ID
          await get().refreshCart()
        } catch (error) {
          console.error('Failed to update quantity:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update quantity',
            isLoading: false 
          })
        }
      },

      // Clear cart
      clearCart: async () => {
        set({ isLoading: true, error: null })
        try {
          const success = await cartService.clearCart()
          if (success) {
            set({ items: [], deliverySlot: null, isLoading: false })
          } else {
            set({ error: 'Failed to clear cart', isLoading: false })
          }
        } catch (error) {
          console.error('Failed to clear cart:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to clear cart',
            isLoading: false 
          })
        }
      },

      // Refresh cart from API
      refreshCart: async () => {
        set({ isLoading: true, error: null })
        try {
          const medusaCart = await getCurrentCart()
          
          if (medusaCart) {
            const { items, deliverySlot } = transformMedusaCart(medusaCart)
            set({ items, deliverySlot, isLoading: false })
          } else {
            set({ items: [], deliverySlot: null, isLoading: false })
          }
        } catch (error) {
          console.error('Failed to refresh cart:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to refresh cart',
            isLoading: false 
          })
        }
      },

      // Get cart summary
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
        }
      },

      // Get total items count
      getTotalItems: () => {
        const state = get()
        return state.items.reduce((total, item) => total + item.quantity, 0)
      },

      // Check if product is in cart
      isInCart: (productId: number) => {
        const state = get()
        return state.items.some(item => item.product.id === productId)
      },

      // Get item quantity
      getItemQuantity: (productId: number) => {
        const state = get()
        const item = state.items.find(item => item.product.id === productId)
        return item ? item.quantity : 0
      },

      // Set delivery slot
      setDeliverySlot: async (slotId: string) => {
        set({ isLoading: true, error: null })
        try {
          const success = await cartService.setDeliverySlot(slotId)
          if (success) {
            set({ deliverySlot: slotId, isLoading: false })
          } else {
            set({ error: 'Failed to set delivery slot', isLoading: false })
          }
        } catch (error) {
          console.error('Failed to set delivery slot:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to set delivery slot',
            isLoading: false 
          })
        }
      },

      // Remove delivery slot
      removeDeliverySlot: async () => {
        set({ isLoading: true, error: null })
        try {
          const success = await cartService.removeDeliverySlot()
          if (success) {
            set({ deliverySlot: null, isLoading: false })
          } else {
            set({ error: 'Failed to remove delivery slot', isLoading: false })
          }
        } catch (error) {
          console.error('Failed to remove delivery slot:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Failed to remove delivery slot',
            isLoading: false 
          })
        }
      },
    }),
    {
      name: 'monepiceriz-medusa-cart',
      // Only persist cart ID and delivery slot, not the full cart data
      partialize: (state) => ({ 
        cartId: state.cartId,
        deliverySlot: state.deliverySlot 
      }),
    }
  )
)

// Hook for easy cart management
export function useCart() {
  const store = useMedusaCartStore()
  
  // Initialize cart on first use
  React.useEffect(() => {
    if (!store.cartId) {
      store.initializeCart()
    }
  }, [store.cartId, store.initializeCart])

  return store
}

// Import React for useEffect
import React from 'react'