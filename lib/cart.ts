import { apiClient, MedusaCart } from './api/client'

export interface CartService {
  getOrCreateCart(): Promise<string>
  getCart(cartId: string): Promise<MedusaCart | null>
  addItem(productId: string, variantId: string, quantity: number): Promise<boolean>
  updateItem(lineItemId: string, quantity: number): Promise<boolean>
  removeItem(lineItemId: string): Promise<boolean>
  clearCart(): Promise<boolean>
  setDeliverySlot(slotId: string): Promise<boolean>
  removeDeliverySlot(): Promise<boolean>
}

// Cookie-based cart ID management
const CART_COOKIE_NAME = 'medusa_cart_id'
const CART_EXPIRY_DAYS = 30

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return
  
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${value}; expires=${expires}; path=/`
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return
  
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
}

class MedusaCartService implements CartService {
  private cartId: string | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.cartId = getCookie(CART_COOKIE_NAME)
    }
  }

  async getOrCreateCart(): Promise<string> {
    // If we have a cart ID, try to fetch it to verify it's still valid
    if (this.cartId) {
      try {
        const response = await apiClient.getCart(this.cartId)
        if (response.success && response.data) {
          return this.cartId
        }
      } catch (error) {
        console.warn('Existing cart not found, creating new one')
      }
    }

    // Create a new cart
    try {
      const response = await apiClient.createCart()
      if (response.success && response.data) {
        this.cartId = response.data.id
        setCookie(CART_COOKIE_NAME, this.cartId, CART_EXPIRY_DAYS)
        return this.cartId
      }
    } catch (error) {
      console.error('Failed to create cart:', error)
    }

    throw new Error('Failed to create or retrieve cart')
  }

  async getCart(cartId?: string): Promise<MedusaCart | null> {
    const id = cartId || this.cartId
    if (!id) return null

    try {
      const response = await apiClient.getCart(id)
      return response.success && response.data ? response.data : null
    } catch (error) {
      console.error('Failed to fetch cart:', error)
      return null
    }
  }

  async addItem(productId: string, variantId: string, quantity: number): Promise<boolean> {
    try {
      const cartId = await this.getOrCreateCart()
      const response = await apiClient.addToCart(cartId, variantId, quantity)
      return response.success
    } catch (error) {
      console.error('Failed to add item to cart:', error)
      return false
    }
  }

  async updateItem(lineItemId: string, quantity: number): Promise<boolean> {
    if (!this.cartId) return false

    try {
      const response = await apiClient.updateCartItem(this.cartId, lineItemId, quantity)
      return response.success
    } catch (error) {
      console.error('Failed to update cart item:', error)
      return false
    }
  }

  async removeItem(lineItemId: string): Promise<boolean> {
    if (!this.cartId) return false

    try {
      const response = await apiClient.removeFromCart(this.cartId, lineItemId)
      return response.success
    } catch (error) {
      console.error('Failed to remove cart item:', error)
      return false
    }
  }

  async clearCart(): Promise<boolean> {
    if (!this.cartId) return true

    try {
      // For now, we'll delete the cookie and create a new cart
      // In a full Medusa implementation, there might be a clear cart endpoint
      deleteCookie(CART_COOKIE_NAME)
      this.cartId = null
      await this.getOrCreateCart()
      return true
    } catch (error) {
      console.error('Failed to clear cart:', error)
      return false
    }
  }

  async setDeliverySlot(slotId: string): Promise<boolean> {
    try {
      const cartId = await this.getOrCreateCart()
      const response = await apiClient.reserveSlot(cartId, slotId)
      return response.success
    } catch (error) {
      console.error('Failed to set delivery slot:', error)
      return false
    }
  }

  async removeDeliverySlot(): Promise<boolean> {
    if (!this.cartId) return true

    try {
      const response = await apiClient.releaseSlot(this.cartId)
      return response.success
    } catch (error) {
      console.error('Failed to remove delivery slot:', error)
      return false
    }
  }

  // Get current cart ID (useful for other operations)
  getCurrentCartId(): string | null {
    return this.cartId
  }

  // Force refresh cart ID from cookie
  refreshCartId(): void {
    this.cartId = getCookie(CART_COOKIE_NAME)
  }
}

// Singleton instance
export const cartService = new MedusaCartService()

// Helper functions for easy use
export async function getCurrentCart(): Promise<MedusaCart | null> {
  const cartId = await cartService.getOrCreateCart()
  return cartService.getCart(cartId)
}

export async function addToCart(productId: string, variantId: string, quantity: number = 1): Promise<boolean> {
  return cartService.addItem(productId, variantId, quantity)
}

export async function updateCartItem(lineItemId: string, quantity: number): Promise<boolean> {
  return cartService.updateItem(lineItemId, quantity)
}

export async function removeFromCart(lineItemId: string): Promise<boolean> {
  return cartService.removeItem(lineItemId)
}

export async function clearCart(): Promise<boolean> {
  return cartService.clearCart()
}

export async function setDeliverySlot(slotId: string): Promise<boolean> {
  return cartService.setDeliverySlot(slotId)
}

export async function removeDeliverySlot(): Promise<boolean> {
  return cartService.removeDeliverySlot()
}