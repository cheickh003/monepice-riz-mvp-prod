'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import { searchProducts, products as allProducts } from '@/lib/products';
import { Product } from '@/lib/types';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    const term = (searchParams.get('q') || '').trim();
    setQ(term);
    setResults(term ? (searchProducts(term) as Product[]) : []);
  }, [searchParams]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/search?q=${encodeURIComponent(term)}` : '/search');
  };

  const suggestions = useMemo(() => {
    return (allProducts as Product[]).slice(0, 8);
  }, []);

  return (
    <>
      {/* Header */}
      <div className="bg-gray-50 py-6">
        <div className="container-app">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Rechercher</h1>
          <form onSubmit={onSubmit} className="flex gap-2">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit, une marque..."
              className="input-field flex-1"
            />
            <button type="submit" className="btn-primary">Rechercher</button>
          </form>
        </div>
      </div>

      <div className="container-app py-8">
        {q ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              {results.length} résultat{results.length > 1 ? 's' : ''} pour « {q} »
            </p>
            {results.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Aucun produit ne correspond à votre recherche.</p>
                <p className="text-sm text-gray-500">Essayez avec un autre mot-clé ou parcourez le <Link href="/products/all" className="text-primary hover:underline">catalogue</Link>.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">Suggestions</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {suggestions.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<div className="container-app py-12">Chargement…</div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
