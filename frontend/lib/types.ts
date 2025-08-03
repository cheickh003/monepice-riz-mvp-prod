export interface Product {
  id: number;
  ref: string;
  barcode: string;
  name: string;
  slug: string;
  category: string;
  mainCategory: string;
  price: number;
  priceHT: number;
  priceTTC: number;
  currency: string;
  unit: string;
  stock: 'in_stock' | 'low_stock' | 'out_of_stock';
  images: string[];
  description: string;
  brand: string;
  weight: string | null;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isPromo: boolean;
  promoPrice: number | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  productCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  preparationFee: number;
  total: number;
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