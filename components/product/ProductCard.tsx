'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/stores/cartStore';
import * as Icons from '@/lib/icons';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { addItem, updateQuantity, getItemQuantity } = useCartStore();
  const quantity = getItemQuantity(product.id);

  const handleAddToCart = () => {
    addItem(product);
  };

  const handleIncrease = () => {
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrease = () => {
    if (quantity > 0) {
      updateQuantity(product.id, quantity - 1);
    }
  };

  const getProductIcon = () => {
    const Icon = Icons.categoryIcons[product.mainCategory as keyof typeof Icons.categoryIcons] || Icons.Package;
    return Icon;
  };

  return (
    <div 
      className="card h-full flex flex-col group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/product/${product.slug}`} className="flex-1 flex flex-col">
        <div className="relative flex-shrink-0">
          {/* Image produit */}
          <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
            <div className="w-full h-full flex items-center justify-center p-4 transition-transform duration-200 group-hover:scale-110">
              {(() => {
                const Icon = getProductIcon();
                return <Icon className="w-12 h-12 text-gray-400" />;
              })()}
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-2">
            {product.isPromo && (
              <span className="bg-primary text-white text-xs px-2 py-1 rounded-full font-bold">
                -15%
              </span>
            )}
            {product.stock === 'low_stock' && (
              <span className="bg-warning text-white text-xs px-2 py-1 rounded-full font-medium">
                Stock limité
              </span>
            )}
            {product.stock === 'out_of_stock' && (
              <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Rupture
              </span>
            )}
          </div>

          {/* Badge dans le panier */}
          {quantity > 0 && (
            <div className="absolute top-2 right-2 bg-success text-white rounded-full p-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Informations produit */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            
            {product.weight && (
              <p className="text-sm text-gray-600">{product.weight}</p>
            )}

            {/* Prix */}
            <div className="flex items-baseline space-x-2">
              {product.isPromo && product.promoPrice ? (
                <>
                  <span className="text-lg font-bold text-primary">
                    {product.promoPrice.toLocaleString('fr-FR')} F
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {product.price.toLocaleString('fr-FR')} F
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-primary">
                  {product.price.toLocaleString('fr-FR')} F
                </span>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-1 mt-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-600">({product.reviewCount})</span>
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t flex-shrink-0">
        {product.stock === 'out_of_stock' ? (
          <button disabled className="btn-primary w-full opacity-50 cursor-not-allowed">
            Rupture de stock
          </button>
        ) : quantity === 0 ? (
          <button onClick={handleAddToCart} className="btn-primary w-full">
            Ajouter au panier
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <button
              onClick={handleDecrease}
              className="w-10 h-10 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="font-bold text-lg">{quantity}</span>
            <button
              onClick={handleIncrease}
              className="w-10 h-10 rounded-full bg-primary text-white hover:bg-primary-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}