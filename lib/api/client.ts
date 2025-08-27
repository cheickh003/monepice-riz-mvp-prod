export const apiBase = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'

export async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${apiBase}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text || res.statusText}`)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return (await res.json()) as T
  return (await res.text()) as unknown as T
}

// Minimal Medusa shapes used by planned integration
export type MedusaMoneyAmount = { currency_code: string; amount: number }
export type MedusaImage = { url: string }
export type MedusaVariant = { id: string; product: MedusaProduct; prices: MedusaMoneyAmount[]; inventory_quantity?: number }
export type MedusaProduct = { id: string; title: string; handle: string; description?: string; images: MedusaImage[]; variants: MedusaVariant[]; categories?: { name: string; handle: string; products?: any[] }[]; metadata?: Record<string, any> }
export type MedusaCategory = { id: string; name: string; handle: string; description?: string; products?: MedusaProduct[] }
export type MedusaLineItem = { id: string; title: string; description?: string; unit_price: number; quantity: number; variant: MedusaVariant }
export type MedusaCart = { id: string; items: MedusaLineItem[]; metadata?: Record<string, any> }

// Simple client wrapper aligning with planned API
export const apiClient = {
  async createCart(): Promise<{ success: boolean; data?: { id: string } }> {
    if (typeof window === 'undefined') return { success: false }
    const id = `cart_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
    return { success: true, data: { id } }
  },

  async getCart(id: string): Promise<{ success: boolean; data?: MedusaCart }> {
    // Placeholder: no server-side cart yet
    return { success: true, data: { id, items: [] } }
  },

  async addToCart(_cartId: string, _variantId: string, _quantity: number) {
    return { success: false }
  },

  async updateCartItem(_cartId: string, _lineItemId: string, _quantity: number) {
    return { success: false }
  },

  async removeFromCart(_cartId: string, _lineItemId: string) {
    return { success: false }
  },

  async reserveSlot(cartId: string, slotId: string) {
    await apiFetch('/delivery/slots/reserve', { method: 'POST', body: JSON.stringify({ cartId, slotId }) })
    return { success: true }
  },

  async releaseSlot(cartId: string) {
    await apiFetch('/delivery/slots/release', { method: 'POST', body: JSON.stringify({ cartId }) })
    return { success: true }
  },

  // Product/category stubs for planned Medusa integration
  async getProducts(_opts?: { search?: string }) {
    return { success: true, data: [] as MedusaProduct[] }
  },

  async getCategories() {
    return { success: true, data: [] as MedusaCategory[] }
  },

  async getProductByHandle(_handle: string): Promise<{ success: boolean; data?: MedusaProduct }> {
    return { success: false, data: undefined }
  },
}
