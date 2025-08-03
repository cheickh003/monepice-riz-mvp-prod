// Types partagés entre Frontend et Backend
// Compatible avec Medusa.js et le modèle existant

import { Product as MedusaProduct, ProductVariant, Order as MedusaOrder } from "@medusajs/medusa";

// Extension du produit Medusa pour MonEpiceRiz
export interface Product extends Omit<MedusaProduct, 'variants'> {
  // Champs existants du projet
  ref: string;
  barcode: string;
  slug: string;
  mainCategory: string;
  priceHT: number;
  priceTTC: number;
  currency: string;
  unit: string;
  stock: 'in_stock' | 'low_stock' | 'out_of_stock';
  brand: string;
  weight: string | null;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isPromo: boolean;
  promoPrice: number | null;
  
  // Champs Medusa adaptés
  variants: ProductVariant[];
  collection_id?: string;
  type_id?: string;
}

// Catégorie compatible Medusa
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  productCount: number;
  handle: string; // Medusa requirement
  parent_category_id?: string;
  category_children?: Category[];
}

// Article de panier étendu
export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  unit_price: number;
  total: number;
}

// Panier compatible Medusa
export interface Cart {
  id: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  preparationFee: number;
  total: number;
  currency_code: string;
  region_id: string;
  customer_id?: string;
  payment_sessions?: any[];
  shipping_methods?: any[];
}

// Adresse étendue pour la Guinée
export interface Address {
  id?: string;
  fullName: string;
  first_name: string;
  last_name: string;
  phoneNumber: string;
  phone?: string;
  phoneNumberAlt?: string;
  street: string;
  address_1: string;
  address_2?: string;
  building?: string;
  apartment?: string;
  zone: string;
  city: string;
  province?: string;
  postal_code?: string;
  country_code: string; // "GN" pour Guinée
  instructions?: string;
  isDefault?: boolean;
  metadata?: Record<string, any>;
}

// Créneau de livraison spécifique Guinée
export interface DeliverySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
  price: number;
  isExpress?: boolean;
  zone: string;
  max_orders?: number;
  current_orders?: number;
}

// Commande étendue
export interface Order extends Omit<MedusaOrder, 'items'> {
  // Champs existants
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  preparationFee: number;
  total: number;
  paymentMethod: 'mobile_money' | 'card' | 'cash_on_delivery';
  paymentStatus: 'pending' | 'paid' | 'failed';
  deliveryMethod: 'delivery' | 'pickup';
  deliveryAddress?: Address;
  deliverySlot?: DeliverySlot;
  notes?: string;
  
  // Champs spécifiques Mobile Money Guinée
  mobileMoneyProvider?: 'orange' | 'mtn' | 'moov';
  mobileMoneyNumber?: string;
  mobileMoneyTransactionId?: string;
}

// Utilisateur étendu
export interface User {
  id: string;
  email?: string;
  phoneNumber: string;
  phone?: string;
  fullName: string;
  first_name: string;
  last_name: string;
  addresses: Address[];
  orders: Order[];
  createdAt: string;
  created_at: Date;
  updated_at: Date;
  isGuest?: boolean;
  has_account: boolean;
  metadata?: Record<string, any>;
}

// Configuration régionale pour la Guinée
export interface GuineeRegion {
  id: string;
  name: string;
  currency_code: 'GNF';
  tax_rate: number;
  payment_providers: ('manual' | 'orange_money' | 'mtn_money' | 'moov_money')[];
  fulfillment_providers: ('manual' | 'local_delivery')[];
  countries: ['GN'];
}

// Fournisseur de paiement Mobile Money
export interface MobileMoneyProvider {
  id: string;
  name: string;
  code: 'orange' | 'mtn' | 'moov';
  is_active: boolean;
  api_endpoint: string;
  supported_currencies: ['GNF'];
}

// Événements personnalisés pour Mobile Money
export interface MobileMoneyPaymentEvent {
  type: 'payment.mobile_money.initiated' | 'payment.mobile_money.completed' | 'payment.mobile_money.failed';
  order_id: string;
  payment_id: string;
  provider: 'orange' | 'mtn' | 'moov';
  amount: number;
  currency: 'GNF';
  phone_number: string;
  transaction_id?: string;
  error_message?: string;
  timestamp: Date;
}

// Configuration de livraison locale
export interface LocalDeliveryZone {
  id: string;
  name: string;
  zones: string[];
  base_price: number;
  currency: 'GNF';
  estimated_time_min: number;
  estimated_time_max: number;
  is_active: boolean;
  requires_phone: boolean;
  delivery_slots: DeliverySlot[];
}

// Réponse API standardisée
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Types pour la migration des données
export interface MigrationProduct {
  legacyId: number;
  medusaId: string;
  ref: string;
  migrationStatus: 'pending' | 'completed' | 'failed';
  migrationDate?: Date;
  migrationErrors?: string[];
}

export interface MigrationLog {
  id: string;
  type: 'product' | 'category' | 'customer' | 'order';
  legacy_id: number | string;
  medusa_id: string;
  status: 'success' | 'error' | 'skipped';
  error_message?: string;
  migrated_at: Date;
  data_before?: any;
  data_after?: any;
}