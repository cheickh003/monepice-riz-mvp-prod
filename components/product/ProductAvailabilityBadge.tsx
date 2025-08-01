/**
 * ProductAvailabilityBadge Component
 * 
 * Displays various badges for product status including specialty, promotion,
 * availability, and stock levels. Handles store-aware availability display.
 */

'use client';

import { memo } from 'react';
import { Product, StoreCode, ProductAvailability } from '@/lib/types';
import { STORES } from '@/lib/config/stores';

interface ProductAvailabilityBadgeProps {
  product: Product;
  selectedStore?: StoreCode | null;
  availability?: ProductAvailability | null;
  availabilityLoading?: boolean;
  showStoreInfo?: boolean;
  showSpecialtyBadge?: boolean;
  showPromotion?: boolean;
  cartQuantity?: number;
  className?: string;
}

const ProductAvailabilityBadge = memo(function ProductAvailabilityBadge({
  product,
  selectedStore,
  availability,
  availabilityLoading = false,
  showStoreInfo = true,
  showSpecialtyBadge = true,
  showPromotion = true,
  cartQuantity = 0,
  className = ''
}: ProductAvailabilityBadgeProps) {
  const isAvailable = availability?.isAvailable || false;
  const isLowStock = availability?.isLowStock || false;
  const availableQuantity = availability?.quantity || 0;

  // Determine stock status
  const shouldUseStoreData = showStoreInfo && selectedStore && availability;
  const stockStatus = shouldUseStoreData 
    ? (isAvailable ? (isLowStock ? 'low_stock' : 'in_stock') : 'out_of_stock')
    : product.stock;

  return (
    <div className={`absolute top-2 left-2 flex flex-col gap-2 ${className}`}>
      {/* Specialty Product Badge */}
      {showSpecialtyBadge && product.isSpecialty && (
        <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm">
          {product.name?.toLowerCase().includes('escargot') && '🐌'}
          {product.name?.toLowerCase().includes('crabe') && '🦀'}
          Spécialité
        </span>
      )}

      {/* Promo Badge */}
      {showPromotion && product.isPromo && (
        <PromoBadge discount={product.discountPercentage || 15} />
      )}

      {/* Store Availability Badges */}
      {showStoreInfo && selectedStore && (
        <StoreAvailabilityBadges
          availabilityLoading={availabilityLoading}
          stockStatus={stockStatus}
          isLowStock={isLowStock}
          availableQuantity={availableQuantity}
          selectedStore={selectedStore}
        />
      )}

      {/* Fallback to legacy stock status if not using store data */}
      {!shouldUseStoreData && (
        <LegacyStockBadges stockStatus={product.stock} />
      )}

      {/* Cart Status Badge */}
      {cartQuantity > 0 && (
        <CartStatusBadge quantity={cartQuantity} />
      )}
    </div>
  );
});

// Sub-components for better organization

interface PromoBadgeProps {
  discount: number;
}

const PromoBadge = memo(function PromoBadge({ discount }: PromoBadgeProps) {
  return (
    <span className="bg-primary text-white text-xs px-2 py-1 rounded-full font-bold shadow-sm">
      -{discount}%
    </span>
  );
});

interface StoreAvailabilityBadgesProps {
  availabilityLoading: boolean;
  stockStatus: string;
  isLowStock: boolean;
  availableQuantity: number;
  selectedStore: StoreCode;
}

const StoreAvailabilityBadges = memo(function StoreAvailabilityBadges({
  availabilityLoading,
  stockStatus,
  isLowStock,
  availableQuantity,
  selectedStore
}: StoreAvailabilityBadgesProps) {
  if (availabilityLoading) {
    return (
      <span className="bg-gray-400 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse shadow-sm">
        Vérification...
      </span>
    );
  }

  const badges = [];

  // Main availability badge
  if (stockStatus === 'out_of_stock') {
    badges.push(
      <span key="availability" className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
        Rupture
      </span>
    );
  } else if (stockStatus === 'low_stock') {
    badges.push(
      <span key="availability" className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
        Stock limité
      </span>
    );
  } else {
    badges.push(
      <span key="availability" className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
        Disponible
      </span>
    );
  }

  // Quantity indicator for low stock
  if (isLowStock && availableQuantity > 0) {
    badges.push(
      <span key="quantity" className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
        Plus que {availableQuantity}
      </span>
    );
  }

  // Store indicator
  const storeName = selectedStore === 'COCODY' ? 'Cocody' : 'Koumassi';
  badges.push(
    <span key="store" className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
      {storeName}
    </span>
  );

  return <>{badges}</>;
});

interface LegacyStockBadgesProps {
  stockStatus?: string;
}

const LegacyStockBadges = memo(function LegacyStockBadges({ stockStatus }: LegacyStockBadgesProps) {
  if (stockStatus === 'low_stock') {
    return (
      <span className="bg-warning text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
        Stock limité
      </span>
    );
  }

  if (stockStatus === 'out_of_stock') {
    return (
      <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
        Rupture
      </span>
    );
  }

  return null;
});

interface CartStatusBadgeProps {
  quantity: number;
}

const CartStatusBadge = memo(function CartStatusBadge({ quantity }: CartStatusBadgeProps) {
  return (
    <div className="absolute top-2 right-2 bg-success text-white rounded-full p-1 shadow-lg">
      <div className="flex items-center justify-center w-6 h-6">
        {quantity > 1 ? (
          <span className="text-xs font-bold">{quantity}</span>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  );
});

export default ProductAvailabilityBadge;