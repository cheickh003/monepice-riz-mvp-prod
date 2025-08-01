/**
 * ProductInfo Component
 * 
 * Displays product information including name, weight, price, rating,
 * and store-specific availability details. Handles price display logic
 * for promotions and store-aware information.
 */

'use client';

import { memo } from 'react';
import { Product, StoreCode, ProductAvailability } from '@/lib/types';
import { STORES } from '@/lib/config/stores';
import { useAvailabilityHelpers } from '@/lib/hooks/useProductAvailability';

interface ProductInfoProps {
  product: Product;
  selectedStore?: StoreCode | null;
  availability?: ProductAvailability | null;
  showStoreInfo?: boolean;
  showRating?: boolean;
  compact?: boolean;
  className?: string;
}

const ProductInfo = memo(function ProductInfo({
  product,
  selectedStore,
  availability,
  showStoreInfo = true,
  showRating = true,
  compact = false,
  className = ''
}: ProductInfoProps) {
  const {
    getQuantityText,
    getRestockText
  } = useAvailabilityHelpers(availability);

  const isAvailable = availability?.isAvailable || false;
  const isLowStock = availability?.isLowStock || false;

  return (
    <div className={`flex-1 flex flex-col justify-between ${className}`}>
      <div className={`space-y-${compact ? '1' : '2'}`}>
        {/* Product Name */}
        <ProductName 
          name={product.name} 
          compact={compact}
        />
        
        {/* Product Weight/Size */}
        {!compact && product.weight && (
          <ProductWeight weight={product.weight} />
        )}

        {/* Price Section */}
        <ProductPrice 
          product={product}
          compact={compact}
        />

        {/* Store Availability Info */}
        {showStoreInfo && selectedStore && availability && (
          <StoreAvailabilityInfo
            selectedStore={selectedStore}
            availability={availability}
            getQuantityText={getQuantityText}
            getRestockText={getRestockText}
            compact={compact}
          />
        )}
      </div>

      {/* Rating Section */}
      {showRating && !compact && (
        <ProductRating 
          rating={product.rating}
          reviewCount={product.reviewCount}
        />
      )}
    </div>
  );
});

// Sub-components for better organization

interface ProductNameProps {
  name: string;
  compact: boolean;
}

const ProductName = memo(function ProductName({ name, compact }: ProductNameProps) {
  return (
    <h3 className={`
      font-medium text-gray-900 group-hover:text-primary transition-colors
      ${compact ? 'text-sm line-clamp-1' : 'line-clamp-2'}
    `}>
      {name}
    </h3>
  );
});

interface ProductWeightProps {
  weight: string;
}

const ProductWeight = memo(function ProductWeight({ weight }: ProductWeightProps) {
  return (
    <p className="text-sm text-gray-600">{weight}</p>
  );
});

interface ProductPriceProps {
  product: Product;
  compact: boolean;
}

const ProductPrice = memo(function ProductPrice({ product, compact }: ProductPriceProps) {
  const hasPromotion = product.isPromo && product.promoPrice;
  const basePrice = product.basePrice || product.price;
  const promoPrice = product.promoPrice;

  return (
    <div className={`flex items-baseline space-x-2 ${compact ? 'text-sm' : ''}`}>
      {hasPromotion ? (
        <>
          <span className={`font-bold text-primary ${compact ? 'text-base' : 'text-lg'}`}>
            {promoPrice?.toLocaleString('fr-FR')} F
          </span>
          <span className={`text-gray-500 line-through ${compact ? 'text-xs' : 'text-sm'}`}>
            {basePrice?.toLocaleString('fr-FR')} F
          </span>
          {!compact && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">
              -{Math.round(((basePrice - promoPrice) / basePrice) * 100)}%
            </span>
          )}
        </>
      ) : (
        <span className={`font-bold text-primary ${compact ? 'text-base' : 'text-lg'}`}>
          {basePrice?.toLocaleString('fr-FR')} F
        </span>
      )}
    </div>
  );
});

interface StoreAvailabilityInfoProps {
  selectedStore: StoreCode;
  availability: ProductAvailability;
  getQuantityText: () => string;
  getRestockText: () => string | null;
  compact: boolean;
}

const StoreAvailabilityInfo = memo(function StoreAvailabilityInfo({
  selectedStore,
  availability,
  getQuantityText,
  getRestockText,
  compact
}: StoreAvailabilityInfoProps) {
  const isAvailable = availability.isAvailable;
  const isLowStock = availability.isLowStock;
  const store = STORES[selectedStore];

  if (compact) return null;

  return (
    <div className="mt-2 space-y-1">
      {/* Store Name */}
      <div className="flex items-center text-xs text-gray-600">
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0v-4a2 2 0 012-2h10a2 2 0 012 2v4" 
          />
        </svg>
        <span className="font-medium">{store.name}</span>
      </div>
      
      {/* Low Stock Warning */}
      {isAvailable && isLowStock && (
        <p className="text-xs text-yellow-600 font-medium flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
          {getQuantityText()}
        </p>
      )}
      
      {/* Restock Information */}
      {!isAvailable && getRestockText() && (
        <p className="text-xs text-gray-500 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          {getRestockText()}
        </p>
      )}

      {/* Delivery Info */}
      {isAvailable && (
        <p className="text-xs text-green-600 flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
          Disponible pour livraison
        </p>
      )}
    </div>
  );
});

interface ProductRatingProps {
  rating: number;
  reviewCount: number;
}

const ProductRating = memo(function ProductRating({ rating, reviewCount }: ProductRatingProps) {
  if (!rating || rating === 0) return null;

  return (
    <div className="flex items-center space-x-1 mt-2">
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${
              i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-sm text-gray-600">
        ({reviewCount > 0 ? reviewCount : 'Nouveau'})
      </span>
      {rating >= 4.5 && (
        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
          Top noté
        </span>
      )}
    </div>
  );
});

export default ProductInfo;