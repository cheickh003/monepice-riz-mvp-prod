import { create } from 'zustand';
import { Address, DeliverySlot } from '@/lib/types';

interface CheckoutStore {
  // Informations client
  customerInfo: {
    fullName: string;
    email: string;
    phoneNumber: string;
    phoneNumberAlt?: string;
  };
  setCustomerInfo: (info: Partial<CheckoutStore['customerInfo']>) => void;

  // Adresse de livraison
  deliveryAddress: Address | null;
  setDeliveryAddress: (address: Address) => void;

  // Mode de livraison
  deliveryMethod: 'delivery' | 'pickup';
  setDeliveryMethod: (method: 'delivery' | 'pickup') => void;

  // Créneau de livraison
  deliverySlot: DeliverySlot | null;
  setDeliverySlot: (slot: DeliverySlot) => void;

  // Instructions de livraison
  deliveryInstructions: string;
  setDeliveryInstructions: (instructions: string) => void;

  // Méthode de paiement
  paymentMethod: 'mobile_money' | 'card' | 'cash_on_delivery' | 'cash_on_order';
  setPaymentMethod: (method: 'mobile_money' | 'card' | 'cash_on_delivery' | 'cash_on_order') => void;

  // Mobile Money provider
  mobileMoneyProvider: 'orange' | 'mtn' | 'moov' | 'wave' | null;
  setMobileMoneyProvider: (provider: 'orange' | 'mtn' | 'moov' | 'wave' | null) => void;

  // Reset
  resetCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutStore>((set) => ({
  customerInfo: {
    fullName: '',
    email: '',
    phoneNumber: '',
    phoneNumberAlt: '',
  },
  setCustomerInfo: (info) =>
    set((state) => ({
      customerInfo: { ...state.customerInfo, ...info },
    })),

  deliveryAddress: null,
  setDeliveryAddress: (address) => set({ deliveryAddress: address }),

  deliveryMethod: 'delivery',
  setDeliveryMethod: (method) => set({ deliveryMethod: method }),

  deliverySlot: null,
  setDeliverySlot: (slot) => set({ deliverySlot: slot }),

  deliveryInstructions: '',
  setDeliveryInstructions: (instructions) => set({ deliveryInstructions: instructions }),

  paymentMethod: 'mobile_money',
  setPaymentMethod: (method) => set({ paymentMethod: method }),

  mobileMoneyProvider: null,
  setMobileMoneyProvider: (provider) => set({ mobileMoneyProvider: provider }),

  resetCheckout: () =>
    set({
      customerInfo: {
        fullName: '',
        email: '',
        phoneNumber: '',
        phoneNumberAlt: '',
      },
      deliveryAddress: null,
      deliveryMethod: 'delivery',
      deliverySlot: null,
      deliveryInstructions: '',
      paymentMethod: 'mobile_money',
      mobileMoneyProvider: null,
    }),
}));