// Client Medusa.js pour le frontend Next.js
import Medusa from "@medusajs/medusa-js";
import { Product, Cart, Order, User, Category } from "../../shared/types";

// Configuration du client Medusa
const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

// Instance client Medusa
export const medusaClient = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  maxRetries: 3,
});

// Service d'API pour MonEpiceRiz
export class MedusaApiService {
  
  // === PRODUITS ===
  async getProducts(params?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
    featured?: boolean;
    promo?: boolean;
  }) {
    try {
      const queryParams: any = {};
      
      if (params?.limit) queryParams.limit = params.limit;
      if (params?.offset) queryParams.offset = params.offset;
      if (params?.search) queryParams.q = params.search;
      if (params?.category) queryParams.collection_id = params.category;
      
      const response = await medusaClient.products.list(queryParams);
      return response.products as Product[];
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }

  async getProduct(id: string) {
    try {
      const response = await medusaClient.products.retrieve(id);
      return response.product as Product;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  }

  async getProductBySlug(slug: string) {
    try {
      // Recherche par handle (slug dans Medusa)
      const response = await medusaClient.products.list({ handle: slug });
      return response.products[0] as Product || null;
    } catch (error) {
      console.error(`Error fetching product by slug ${slug}:`, error);
      throw error;
    }
  }

  // === CATÉGORIES ===
  async getCategories() {
    try {
      const response = await medusaClient.productCategories.list();
      return response.product_categories as Category[];
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }

  async getCategory(id: string) {
    try {
      const response = await medusaClient.productCategories.retrieve(id);
      return response.product_category as Category;
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error);
      throw error;
    }
  }

  // === PANIER ===
  async createCart(regionId: string = "reg_guinea") {
    try {
      const response = await medusaClient.carts.create({ region_id: regionId });
      return response.cart as Cart;
    } catch (error) {
      console.error("Error creating cart:", error);
      throw error;
    }
  }

  async getCart(cartId: string) {
    try {
      const response = await medusaClient.carts.retrieve(cartId);
      return response.cart as Cart;
    } catch (error) {
      console.error(`Error fetching cart ${cartId}:`, error);
      throw error;
    }
  }

  async addToCart(cartId: string, variantId: string, quantity: number) {
    try {
      const response = await medusaClient.carts.lineItems.create(cartId, {
        variant_id: variantId,
        quantity,
      });
      return response.cart as Cart;
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  }

  async updateCartItem(cartId: string, lineItemId: string, quantity: number) {
    try {
      const response = await medusaClient.carts.lineItems.update(cartId, lineItemId, {
        quantity,
      });
      return response.cart as Cart;
    } catch (error) {
      console.error("Error updating cart item:", error);
      throw error;
    }
  }

  async removeFromCart(cartId: string, lineItemId: string) {
    try {
      const response = await medusaClient.carts.lineItems.delete(cartId, lineItemId);
      return response.cart as Cart;
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  }

  // === CHECKOUT ===
  async addShippingMethod(cartId: string, shippingMethodId: string) {
    try {
      const response = await medusaClient.carts.addShippingMethod(cartId, {
        option_id: shippingMethodId,
      });
      return response.cart as Cart;
    } catch (error) {
      console.error("Error adding shipping method:", error);
      throw error;
    }
  }

  async setPaymentSession(cartId: string, providerId: string) {
    try {
      const response = await medusaClient.carts.createPaymentSessions(cartId);
      await medusaClient.carts.setPaymentSession(cartId, {
        provider_id: providerId,
      });
      return response.cart as Cart;
    } catch (error) {
      console.error("Error setting payment session:", error);
      throw error;
    }
  }

  async completeCart(cartId: string) {
    try {
      const response = await medusaClient.carts.complete(cartId);
      return response.data as Order;
    } catch (error) {
      console.error("Error completing cart:", error);
      throw error;
    }
  }

  // === COMMANDES ===
  async getOrders(customerId?: string) {
    try {
      if (customerId) {
        const response = await medusaClient.customers.orders.list();
        return response.orders as Order[];
      } else {
        // Pour les commandes d'invités, utiliser l'email
        throw new Error("Customer ID required for fetching orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  }

  async getOrder(orderId: string) {
    try {
      const response = await medusaClient.orders.retrieve(orderId);
      return response.order as Order;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      throw error;
    }
  }

  // === RÉGIONS ===
  async getRegions() {
    try {
      const response = await medusaClient.regions.list();
      return response.regions;
    } catch (error) {
      console.error("Error fetching regions:", error);
      throw error;
    }
  }

  async getShippingOptions(cartId: string) {
    try {
      const response = await medusaClient.shippingOptions.listCartOptions(cartId);
      return response.shipping_options;
    } catch (error) {
      console.error("Error fetching shipping options:", error);
      throw error;
    }
  }

  // === AUTHENTIFICATION ===
  async login(email: string, password: string) {
    try {
      const response = await medusaClient.auth.authenticate({
        email,
        password,
      });
      return response.customer as User;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  }

  async register(customerData: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    try {
      const response = await medusaClient.customers.create(customerData);
      return response.customer as User;
    } catch (error) {
      console.error("Error registering customer:", error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await medusaClient.customers.retrieve();
      return response.customer as User;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  }

  // === MOBILE MONEY (Custom endpoints) ===
  async initiateMobileMoneyPayment(orderId: string, provider: 'orange' | 'mtn' | 'moov', phoneNumber: string) {
    try {
      const response = await fetch(`${MEDUSA_BACKEND_URL}/store/mobile-money/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          provider,
          phone_number: phoneNumber,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error initiating mobile money payment:", error);
      throw error;
    }
  }

  async checkMobileMoneyPaymentStatus(transactionId: string) {
    try {
      const response = await fetch(`${MEDUSA_BACKEND_URL}/store/mobile-money/status/${transactionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error checking mobile money payment status:", error);
      throw error;
    }
  }
}

// Instance singleton du service
export const medusaApi = new MedusaApiService();

// Hooks React pour l'intégration avec le state management
export const useMedusaCart = (cartId?: string) => {
  // Ce hook sera implémenté avec React Query ou SWR
  // pour gérer le cache et la synchronisation
};

export const useMedusaProducts = (params?: any) => {
  // Hook pour la gestion des produits avec cache
};

export default medusaApi;