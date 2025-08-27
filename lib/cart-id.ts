export function getOrCreateCartId(): string {
  if (typeof window === 'undefined') return 'cart-ssr'
  const key = 'mep_cart_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = `cart_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
    localStorage.setItem(key, id)
  }
  return id
}

