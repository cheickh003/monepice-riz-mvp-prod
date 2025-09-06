'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import ProductCard from '@/components/product/ProductCard';
import { getPromoProducts } from '@/lib/products';
import { Product } from '@/lib/types';
import * as Icons from '@/lib/icons';

export default function PromoProductsPage() {
  const [sortBy, setSortBy] = useState<'pertinence' | 'price_asc' | 'price_desc' | 'rating' | 'name'>('pertinence');
  const products = getPromoProducts(999) as Product[];

  const sorted = useMemo(() => {
    const list = products.slice();
    switch (sortBy) {
      case 'price_asc':
        list.sort((a, b) => (a.promoPrice ?? a.price) - (b.promoPrice ?? b.price));
        break;
      case 'price_desc':
        list.sort((a, b) => (b.promoPrice ?? b.price) - (a.promoPrice ?? a.price));
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return list;
  }, [products, sortBy]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gray-50 py-6">
        <div className="container-app">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                <Icons.Tag className="w-6 h-6 inline mr-2" />
                Promotions
              </h1>
              <p className="text-gray-600">Découvrez nos offres du moment</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Trier</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="input-field text-sm py-2 px-3">
                <option value="pertinence">Pertinence</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="rating">Meilleures notes</option>
                <option value="name">Nom A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="container-app py-8">
        {sorted.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Aucune promotion pour le moment.</p>
            <Link className="btn-primary" href="/products/all">Parcourir le catalogue</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sorted.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

