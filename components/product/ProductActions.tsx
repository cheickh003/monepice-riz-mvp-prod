/**
 * ProductActions Component
 * 
 * Handles all product action buttons including add to cart, quantity controls,
 * and out of stock states. Provides optimistic UI updates and error handling.
 */

'use client';

import { memo, useState, useCallback } from 'react';
import { Product, StoreCode, ProductAvailability } from '@/lib/types';
import { useCartActions } from '@/lib/stores/cartStore';

interface ProductActionsProps {
  product: Product;
  selectedStore?: StoreCode | null;
  availability?: ProductAvailability | null;
  availabilityLoading?: boolean;
  cartQuantity?: number;
  showStoreInfo?: boolean;
  onUnavailableAtStore?: (product: Product, store: StoreCode) => void;
  onAddToCart?: (product: Product, quantity: number) => void;
  onQuantityChange?: (product: Product, newQuantity: number) => void;
  className?: string;
}

const ProductActions = memo(function ProductActions({
  product,
  selectedStore,
  availability,
  availabilityLoading = false,
  cartQuantity = 0,
  showStoreInfo = true,
  onUnavailableAtStore,
  onAddToCart,
  onQuantityChange,
  className = ''
}: ProductActionsProps) {
  const { addItem, updateQuantity } = useCartActions();
  const [isAdding, setIsAdding] = useState(false);
  const [optimisticQuantity, setOptimisticQuantity] = useState(cartQuantity);

  const isAvailable = availability?.isAvailable || false;
  const availableQuantity = availability?.quantity || 0;
  const shouldUseStoreData = showStoreInfo && selectedStore && availability;
  const stockStatus = shouldUseStoreData 
    ? (isAvailable ? 'in_stock' : 'out_of_stock')
    : product.stock;

  const effectiveAvailableQuantity = shouldUseStoreData ? availableQuantity : Infinity;
  const displayQuantity = optimisticQuantity || cartQuantity;

  const handleAddToCart = useCallback(async () => {
    if (!isAvailable && shouldUseStoreData) {
      onUnavailableAtStore?.(product, selectedStore!);
      return;
    }

    setIsAdding(true);
    setOptimisticQuantity(1);

    try {
      const success = await addItem(product, 1, selectedStore);
      if (success) {
        onAddToCart?.(product, 1);
      } else {
        setOptimisticQuantity(0);
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      setOptimisticQuantity(0);
    } finally {
      setIsAdding(false);
    }
  }, [isAvailable, shouldUseStoreData, product, selectedStore, addItem, onAddToCart, onUnavailableAtStore]);

  const handleQuantityChange = useCallback(async (newQuantity: number) => {
    const clampedQuantity = Math.max(0, Math.min(newQuantity, effectiveAvailableQuantity));
    setOptimisticQuantity(clampedQuantity);
    
    try {
      await updateQuantity(product.id || product.$id, clampedQuantity);
      onQuantityChange?.(product, clampedQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
      setOptimisticQuantity(cartQuantity);
    }
  }, [effectiveAvailableQuantity, updateQuantity, product, onQuantityChange, cartQuantity]);

  const handleIncrease = useCallback(() => {
    handleQuantityChange(displayQuantity + 1);
  }, [handleQuantityChange, displayQuantity]);

  const handleDecrease = useCallback(() => {
    handleQuantityChange(displayQuantity - 1);
  }, [handleQuantityChange, displayQuantity]);

  return (
    <div className={`mt-4 pt-4 border-t flex-shrink-0 ${className}`}>
      {/* Loading State */}
      {availabilityLoading && showStoreInfo ? (
        <LoadingButton />
      ) : 
      /* Out of Stock State */
      (shouldUseStoreData ? !isAvailable : stockStatus === 'out_of_stock') ? (
        <OutOfStockActions
          product={product}
          selectedStore={selectedStore}
          showStoreInfo={showStoreInfo}
          onUnavailableAtStore={onUnavailableAtStore}
        />
      ) : 
      /* Available - Add to Cart or Quantity Controls */
      displayQuantity === 0 ? (
        <AddToCartButton
          onAddToCart={handleAddToCart}
          isAdding={isAdding}
        />
      ) : (
        <QuantityControls
          quantity={displayQuantity}
          maxQuantity={effectiveAvailableQuantity}
          onIncrease={handleIncrease}
          onDecrease={handleDecrease}
          showQuantityWarning={shouldUseStoreData && displayQuantity >= availableQuantity && availableQuantity > 0}
          availableQuantity={availableQuantity}
        />
      )}
    </div>
  );
});

// Sub-components for better organization

const LoadingButton = memo(function LoadingButton() {
  return (
    <button disabled className="btn-primary w-full opacity-50 cursor-not-allowed">
      <div className="flex items-center justify-center">
        <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        Vérification...
      </div>
    </button>
  );
});

interface OutOfStockActionsProps {
  product: Product;
  selectedStore?: StoreCode | null;
  showStoreInfo: boolean;
  onUnavailableAtStore?: (product: Product, store: StoreCode) => void;
}

const OutOfStockActions = memo(function OutOfStockActions({
  product,
  selectedStore,
  showStoreInfo,
  onUnavailableAtStore
}: OutOfStockActionsProps) {
  return (
    <div className="space-y-2">
      <button disabled className="btn-primary w-full opacity-50 cursor-not-allowed">
        Rupture de stock
      </button>
      
      {/* Alternative Store Option */}
      {showStoreInfo && selectedStore && onUnavailableAtStore && (
        <button
          onClick={() => onUnavailableAtStore(product, selectedStore)}
          className="w-full text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium"
        >
          <div className="flex items-center justify-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Vérifier dans l'autre magasin
          </div>
        </button>
      )}

      {/* Notify When Available */}
      <button className="w-full text-xs text-gray-600 hover:text-gray-800 transition-colors">
        <div className="flex items-center justify-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5V9h-5v8z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H4l5-5v13h5V5z" />
          </svg>
          Me notifier quand disponible
        </div>
      </button>
    </div>
  );
});

interface AddToCartButtonProps {
  onAddToCart: () => void;
  isAdding: boolean;
}

const AddToCartButton = memo(function AddToCartButton({
  onAddToCart,
  isAdding
}: AddToCartButtonProps) {
  return (
    <button 
      onClick={onAddToCart} 
      disabled={isAdding}
      className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg"
    >
      {isAdding ? (
        <div className="flex items-center justify-center">
          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Ajout en cours...
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5L14 15M7 13l-2.5-5m5 8a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
          Ajouter au panier
        </div>
      )}
    </button>
  );
});

interface QuantityControlsProps {
  quantity: number;
  maxQuantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  showQuantityWarning: boolean;
  availableQuantity: number;
}

const QuantityControls = memo(function QuantityControls({
  quantity,
  maxQuantity,
  onIncrease,
  onDecrease,
  showQuantityWarning,
  availableQuantity
}: QuantityControlsProps) {
  const isMaxReached = quantity >= maxQuantity;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          onClick={onDecrease}
          className="w-10 h-10 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-200 flex items-center justify-center group"
          aria-label="Diminuer la quantité"
        >
          <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg">{quantity}</span>
          <span className="text-xs text-gray-500">dans le panier</span>
        </div>
        
        <button
          onClick={onIncrease}
          disabled={isMaxReached}
          className="w-10 h-10 rounded-full bg-primary text-white hover:bg-primary-600 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
          aria-label="Augmenter la quantité"
        >
          <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
      {/* Quantity Limit Warning */}
      {showQuantityWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
          <p className="text-xs text-amber-800 text-center flex items-center justify-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Quantité maximale atteinte ({availableQuantity} disponible{availableQuantity > 1 ? 's' : ''})
          </p>
        </div>
      )}

      {/* Quick Add More Button */}
      {!isMaxReached && quantity < 5 && (
        <button
          onClick={() => {
            const quickAddQuantity = Math.min(quantity + 2, maxQuantity);
            onIncrease();
            if (quickAddQuantity > quantity + 1) {
              setTimeout(onIncrease, 100);
            }
          }}
          className="w-full text-xs text-primary hover:text-primary-700 transition-colors font-medium"
        >
          + Ajouter 2 de plus
        </button>
      )}
    </div>
  );
});

export default ProductActions;