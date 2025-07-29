import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, Cart } from '@/lib/types';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCart: () => Cart;
  getTotalItems: () => number;
  isInCart: (productId: number) => boolean;
  getItemQuantity: (productId: number) => number;
}

// Frais de livraison et de préparation
const DELIVERY_FEE = 1500;
const PREPARATION_FEE = 500;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.product.id === product.id);
          
          if (existingItem) {
            // Si le produit existe déjà, augmenter la quantité
            return {
              items: state.items.map(item =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          
          // Sinon, ajouter le nouveau produit
          return {
            items: [...state.items, { product, quantity }],
          };
        });
      },

      removeItem: (productId: number) => {
        set((state) => ({
          items: state.items.filter(item => item.product.id !== productId),
        }));
      },

      updateQuantity: (productId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map(item =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getCart: () => {
        const state = get();
        const subtotal = state.items.reduce((total, item) => {
          const price = item.product.isPromo && item.product.promoPrice
            ? item.product.promoPrice
            : item.product.price;
          return total + (price * item.quantity);
        }, 0);

        const totalItems = state.items.reduce((total, item) => total + item.quantity, 0);

        return {
          items: state.items,
          totalItems,
          subtotal,
          deliveryFee: totalItems > 0 ? DELIVERY_FEE : 0,
          preparationFee: totalItems > 0 ? PREPARATION_FEE : 0,
          total: subtotal + (totalItems > 0 ? DELIVERY_FEE + PREPARATION_FEE : 0),
        };
      },

      getTotalItems: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.quantity, 0);
      },

      isInCart: (productId: number) => {
        const state = get();
        return state.items.some(item => item.product.id === productId);
      },

      getItemQuantity: (productId: number) => {
        const state = get();
        const item = state.items.find(item => item.product.id === productId);
        return item ? item.quantity : 0;
      },
    }),
    {
      name: 'monepiceriz-cart',
    }
  )
);