/**
 * ProductImage Component
 * 
 * Handles product image display with fallback icons and hover effects.
 * Optimized for performance with lazy loading and error handling.
 */

'use client';

import { memo, useState } from 'react';
import { Product } from '@/lib/types';
import * as Icons from '@/lib/icons';

interface ProductImageProps {
  product: Product;
  className?: string;
  showHoverEffect?: boolean;
  priority?: boolean;
}

const ProductImage = memo(function ProductImage({ 
  product, 
  className = '',
  showHoverEffect = true,
  priority = false
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getProductIcon = () => {
    const Icon = Icons.categoryIcons[product.mainCategory as keyof typeof Icons.categoryIcons] || Icons.Package;
    return Icon;
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  return (
    <div className={`w-full aspect-square bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      {product.imageUrl && !imageError ? (
        <div className="relative w-full h-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse bg-gray-200 w-full h-full" />
            </div>
          )}
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`
              w-full h-full object-cover transition-transform duration-200
              ${showHoverEffect ? 'group-hover:scale-110' : ''}
              ${isLoading ? 'opacity-0' : 'opacity-100'}
            `}
            loading={priority ? 'eager' : 'lazy'}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
      ) : (
        <div className={`
          w-full h-full flex items-center justify-center p-4 transition-transform duration-200
          ${showHoverEffect ? 'group-hover:scale-110' : ''}
        `}>
          {(() => {
            const Icon = getProductIcon();
            return <Icon className="w-12 h-12 text-gray-400" />;
          })()}
        </div>
      )}
    </div>
  );
});

export default ProductImage;