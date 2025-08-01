// Store types for multi-location support
export type StoreCode = 'COCODY' | 'KOUMASSI';

export interface StoreLocation {
  latitude: number;
  longitude: number;
  address: string;
  zone: string;
}

export interface Store {
  code: StoreCode;
  name: string;
  location: StoreLocation;
  phone: string;
  email?: string;
  operatingHours: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  deliveryRadius: number; // in kilometers
  isActive: boolean;
}

export interface StoreInventory {
  store: StoreCode;
  quantityAvailable: number;
  quantityReserved: number;
  lowStockThreshold: number;
  lastRestockedAt?: string;
  nextDeliveryAt?: string;
  isAvailable: boolean;
  isLowStock: boolean;
}

export interface Product {
  // Legacy JSON fields
  id: number;
  ref?: string;
  barcode?: string;
  name: string;
  slug: string;
  category: string;
  mainCategory: string;
  price: number;
  originalPrice?: number;
  priceHT?: number;
  priceTTC?: number;
  currency?: string;
  unit: string;
  stock?: 'in_stock' | 'low_stock' | 'out_of_stock';
  image: string;
  images: string[];
  description: string;
  brand?: string;
  weight?: number | string | null;
  rating?: number;
  reviewCount?: number;
  isFeatured: boolean;
  isPromo: boolean;
  promoPrice?: number | null;
  inStock?: boolean;
  
  // New Appwrite fields (optional for backward compatibility)
  $id?: string;
  $createdAt?: string;
  $updatedAt?: string;
  categoryId?: string;
  shortDescription?: string;
  basePrice?: number;
  imageUrl?: string;
  sku?: string;
  legacyId?: string;
  isActive?: boolean;
  isSpecialty?: boolean;
  tags?: string[];
  nutrition?: string;
  storage?: string;
  origin?: string;
  
  // Store-specific inventory (optional for backward compatibility)
  storeInventory?: {
    [key in StoreCode]?: StoreInventory;
  };
}

export interface Category {
  // Legacy JSON fields
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description: string;
  productCount?: number;
  image?: string;
  
  // New Appwrite fields (optional for backward compatibility)
  $id?: string;
  $createdAt?: string;
  $updatedAt?: string;
  imageUrl?: string;
  parentId?: string;
  displayOrder?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  legacyId?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedStore?: StoreCode;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  preparationFee: number;
  total: number;
  selectedStore?: StoreCode;
}

export interface Address {
  id?: string;
  fullName: string;
  phoneNumber: string;
  phoneNumberAlt?: string;
  street: string;
  building?: string;
  apartment?: string;
  zone: string;
  city: string;
  instructions?: string;
  isDefault?: boolean;
}

export interface DeliverySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
  price: number;
  isExpress?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  preparationFee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
  paymentMethod: 'mobile_money' | 'card' | 'cash_on_delivery';
  paymentStatus: 'pending' | 'paid' | 'failed';
  deliveryMethod: 'delivery' | 'pickup';
  deliveryAddress?: Address;
  deliverySlot?: DeliverySlot;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface User {
  id: string;
  email?: string;
  phoneNumber: string;
  fullName: string;
  addresses: Address[];
  orders: Order[];
  createdAt: string;
  isGuest?: boolean;
}

// Geolocation and store selection types
export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface StoreDistance extends Store {
  distance?: number; // in kilometers
}

export interface StoreSelectionState {
  selectedStore: StoreCode;
  userLocation?: GeolocationCoordinates;
  isLoadingLocation: boolean;
  locationError?: string;
  nearestStore?: StoreCode;
  lastLocationUpdate?: string;
}

// Product availability types
export interface ProductAvailability {
  productId: string;
  store: StoreCode;
  isAvailable: boolean;
  quantity: number;
  isLowStock: boolean;
  lastUpdated: string;
  nextRestockDate?: string;
}

// Search and filtering types
export interface ProductFilters {
  categoryId?: string;
  priceRange?: { min: number; max: number };
  availability?: 'available' | 'low_stock' | 'out_of_stock' | 'all';
  isSpecialty?: boolean;
  isFeatured?: boolean;
  inStock?: boolean;
  store?: StoreCode;
  tags?: string[];
}

export interface SearchState {
  query: string;
  filters: ProductFilters;
  sortBy: 'name' | 'price_asc' | 'price_desc' | 'rating' | 'availability';
  currentPage: number;
  itemsPerPage: number;
}

// Advanced search result
export interface SearchResult {
  products: Product[];
  totalCount: number;
  hasMore: boolean;
  appliedFilters: ProductFilters;
}