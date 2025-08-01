/**
 * Refactored ProductCard Component
 * 
 * Main product card component composed of smaller, focused sub-components:
 * - ProductImage: Handles image display and fallbacks
 * - ProductAvailabilityBadge: Manages all badges and status indicators
 * - ProductInfo: Displays product information and pricing
 * - ProductActions: Handles cart interactions and controls
 * 
 * Enhanced with error boundaries for robust error handling.
 */

'use client';

import Link from 'next/link';
import { memo, useMemo } from 'react';
import { Product, StoreCode } from '@/lib/types';
import { useCartActions, useCartStore } from '@/lib/stores/cartStore';
import { useSelectedStore } from '@/lib/stores/storeSelectionStore';
import { useProductAvailability } from '@/lib/hooks/useProductAvailability';

// Sub-components
import ProductImage from './ProductImage';
import ProductAvailabilityBadge from './ProductAvailabilityBadge';
import ProductInfo from './ProductInfo';
import ProductActions from './ProductActions';

// Error boundaries
import ProductAvailabilityErrorBoundary from '../errors/ProductAvailabilityErrorBoundary';

interface ProductCardProps {
  product: Product;
  variant?: 'vertical' | 'horizontal' | 'compact';
  showStoreAvailability?: boolean;
  showSpecialtyBadge?: boolean;
  showPromotion?: boolean;
  showRating?: boolean;
  showCrossStoreAvailability?: boolean;
  compact?: boolean;
  priority?: boolean;
  onUnavailableAtStore?: (product: Product, store: StoreCode) => void;
  onAddToCart?: (product: Product, quantity: number) => void;
  onQuantityChange?: (product: Product, newQuantity: number) => void;
  className?: string;
}

const ProductCard = memo(function ProductCard({ 
  product, 
  variant = 'vertical',
  showStoreAvailability = true,
  showSpecialtyBadge = true,
  showPromotion = true,
  showRating = true,
  showCrossStoreAvailability = false,
  compact = false,
  priority = false,
  onUnavailableAtStore,
  onAddToCart,
  onQuantityChange,
  className = ''
}: ProductCardProps) {
  const selectedStore = useSelectedStore();
  const { getItemQuantity } = useCartActions();
  
  // Get cart quantity for this product
  const cartQuantity = getItemQuantity(product.$id || product.id);

  // Get product availability for selected store
  const productId = product.$id || product.id?.toString();
  const { 
    availability, 
    isAvailable, 
    quantity: availableQuantity, 
    isLowStock,
    isLoading: availabilityLoading 
  } = useProductAvailability(productId, selectedStore, {
    enabled: showStoreAvailability && !!selectedStore,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  });

  // Memoized layout classes
  const layoutClasses = useMemo(() => {
    const baseClasses = 'group bg-white rounded-lg border hover:shadow-lg transition-all duration-200';
    
    switch (variant) {
      case 'horizontal':
        return `${baseClasses} flex gap-4 p-4 ${className}`;
      case 'compact':
        return `${baseClasses} p-3 ${className}`;
      default:
        return `${baseClasses} h-full flex flex-col p-4 ${className}`;
    }
  }, [variant, className]);

  // Memoized content layout
  const ContentLayout = useMemo(() => {
    if (variant === 'horizontal') {
      return HorizontalLayout;
    }
    return VerticalLayout;
  }, [variant]);

  return (
    <ProductAvailabilityErrorBoundary
      product={product}
      selectedStore={selectedStore}
      fallbackMode="legacy"
    >
      <div className={layoutClasses}>
        <ContentLayout
          product={product}
          selectedStore={selectedStore}
          availability={availability}
          availabilityLoading={availabilityLoading}
          cartQuantity={cartQuantity}
          showStoreAvailability={showStoreAvailability}
          showSpecialtyBadge={showSpecialtyBadge}
          showPromotion={showPromotion}
          showRating={showRating}
          compact={compact}
          priority={priority}
          onUnavailableAtStore={onUnavailableAtStore}
          onAddToCart={onAddToCart}
          onQuantityChange={onQuantityChange}
        />
      </div>
    </ProductAvailabilityErrorBoundary>
  );
});

// Layout Components

interface LayoutProps {
  product: Product;
  selectedStore?: StoreCode | null;
  availability?: any;
  availabilityLoading: boolean;
  cartQuantity: number;
  showStoreAvailability: boolean;
  showSpecialtyBadge: boolean;
  showPromotion: boolean;
  showRating: boolean;
  compact: boolean;
  priority: boolean;
  onUnavailableAtStore?: (product: Product, store: StoreCode) => void;
  onAddToCart?: (product: Product, quantity: number) => void;
  onQuantityChange?: (product: Product, newQuantity: number) => void;
}

const VerticalLayout = memo(function VerticalLayout(props: LayoutProps) {
  const {
    product,
    selectedStore,
    availability,
    availabilityLoading,
    cartQuantity,
    showStoreAvailability,
    showSpecialtyBadge,
    showPromotion,
    showRating,
    compact,
    priority,
    onUnavailableAtStore,
    onAddToCart,
    onQuantityChange
  } = props;

  return (
    <>
      {/* Product Link */}
      <Link href={`/product/${product.slug}`} className="flex-1 flex flex-col">
        {/* Image Container */}
        <div className="relative flex-shrink-0 mb-3">
          <ProductImage
            product={product}
            showHoverEffect={true}
            priority={priority}
          />

          {/* Badges Overlay */}
          <ProductAvailabilityBadge
            product={product}
            selectedStore={selectedStore}
            availability={availability}
            availabilityLoading={availabilityLoading}
            showStoreInfo={showStoreAvailability}
            showSpecialtyBadge={showSpecialtyBadge}
            showPromotion={showPromotion}
            cartQuantity={cartQuantity}
          />
        </div>

        {/* Product Information */}
        <ProductInfo
          product={product}
          selectedStore={selectedStore}
          availability={availability}
          showStoreInfo={showStoreAvailability}
          showRating={showRating}
          compact={compact}
        />
      </Link>

      {/* Actions Section */}
      <ProductActions
        product={product}
        selectedStore={selectedStore}
        availability={availability}
        availabilityLoading={availabilityLoading}
        cartQuantity={cartQuantity}
        showStoreInfo={showStoreAvailability}
        onUnavailableAtStore={onUnavailableAtStore}
        onAddToCart={onAddToCart}
        onQuantityChange={onQuantityChange}
      />
    </>
  );
});

const HorizontalLayout = memo(function HorizontalLayout(props: LayoutProps) {
  const {
    product,
    selectedStore,
    availability,
    availabilityLoading,
    cartQuantity,
    showStoreAvailability,
    showSpecialtyBadge,
    showPromotion,
    showRating,
    compact,
    priority,
    onUnavailableAtStore,
    onAddToCart,
    onQuantityChange
  } = props;

  return (
    <>
      {/* Image Section */}
      <div className="relative w-24 h-24 flex-shrink-0">
        <ProductImage
          product={product}
          showHoverEffect={true}
          priority={priority}
          className="w-full h-full"
        />

        {/* Compact Badges */}
        <ProductAvailabilityBadge
          product={product}
          selectedStore={selectedStore}
          availability={availability}
          availabilityLoading={availabilityLoading}
          showStoreInfo={showStoreAvailability}
          showSpecialtyBadge={showSpecialtyBadge}
          showPromotion={showPromotion}
          cartQuantity={cartQuantity}
          className="scale-75 origin-top-left"
        />
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <Link href={`/product/${product.slug}`} className="flex-1 min-w-0">
          <ProductInfo
            product={product}
            selectedStore={selectedStore}
            availability={availability}
            showStoreInfo={showStoreAvailability}
            showRating={showRating}
            compact={true}
          />
        </Link>

        {/* Compact Actions */}
        <div className="mt-3 flex-shrink-0">
          <ProductActions
            product={product}
            selectedStore={selectedStore}
            availability={availability}
            availabilityLoading={availabilityLoading}
            cartQuantity={cartQuantity}
            showStoreInfo={showStoreAvailability}
            onUnavailableAtStore={onUnavailableAtStore}
            onAddToCart={onAddToCart}
            onQuantityChange={onQuantityChange}
            className="mt-0 pt-0 border-t-0"
          />
        </div>
      </div>
    </>
  );
});

// Enhanced ProductCard with additional features
interface EnhancedProductCardProps extends ProductCardProps {
  showQuickView?: boolean;
  showCompare?: boolean;
  showWishlist?: boolean;
}

export const EnhancedProductCard = memo(function EnhancedProductCard({
  showQuickView = false,
  showCompare = false,
  showWishlist = false,
  ...props
}: EnhancedProductCardProps) {
  return (
    <div className="relative group">
      <ProductCard {...props} />
      
      {/* Enhanced Actions Overlay */}
      {(showQuickView || showCompare || showWishlist) && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex flex-col gap-1">
            {showQuickView && (
              <button
                className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                title="Aperçu rapide"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            )}
            
            {showWishlist && (
              <button
                className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                title="Ajouter aux favoris"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}
            
            {showCompare && (
              <button
                className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                title="Comparer"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default ProductCard;