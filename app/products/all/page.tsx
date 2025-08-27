'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import { products as allProducts, categories as allCategories } from '@/lib/products';
import * as Icons from '@/lib/icons';
import { Product } from '@/lib/types';

const TOP_CATEGORY_SLUGS = ['frais', 'sec', 'boissons', 'entretien', 'epices', 'petits-fumes', 'promo'] as const;
type TopCat = typeof TOP_CATEGORY_SLUGS[number];

export default function AllProductsPage() {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<TopCat | 'all'>('all');
  const [priceMax, setPriceMax] = useState(100000);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock'>('all');
  const [sortBy, setSortBy] = useState<'pertinence' | 'price_asc' | 'price_desc' | 'rating' | 'name'>('pertinence');
  const [showFilters, setShowFilters] = useState(false);

  const categories = useMemo(() => {
    const map = new Map(allCategories.map(c => [c.slug, c]));
    return TOP_CATEGORY_SLUGS.map(slug => map.get(slug)).filter(Boolean);
  }, []);

  const products = useMemo(() => {
    let list: Product[] = allProducts as Product[];
    if (activeCat !== 'all') {
      if (activeCat === 'promo') {
        list = list.filter(p => p.isPromo);
      } else {
        list = list.filter(p => p.mainCategory === activeCat);
      }
    }
    return list;
  }, [activeCat]);

  const brands = useMemo(() => Array.from(new Set(products.map(p => p.brand))).sort(), [products]);

  const filtered = useMemo(() => {
    let list = products.slice();
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    list = list.filter(p => p.price <= priceMax);
    if (selectedBrands.length > 0) {
      list = list.filter(p => selectedBrands.includes(p.brand));
    }
    if (stockFilter === 'in_stock') {
      list = list.filter(p => p.stock === 'in_stock');
    }
    switch (sortBy) {
      case 'price_asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return list;
  }, [products, query, priceMax, selectedBrands, stockFilter, sortBy]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };

  useEffect(() => {
    // reset filters when switching category
    setSelectedBrands([]);
    setStockFilter('all');
    setPriceMax(100000);
    setQuery('');
  }, [activeCat]);

  return (
    <div className="min-h-screen">
      {/* Header + Category chips */}
      <div className="bg-gray-50 py-6">
        <div className="container-app">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Catalogue complet</h1>
          <p className="text-gray-600 mb-4">Parcourez l’ensemble du catalogue et affinez par catégorie, prix, marque et disponibilité</p>
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-1.5 rounded-full text-sm border ${activeCat === 'all' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300'}`}
              onClick={() => setActiveCat('all')}
            >
              Tous
            </button>
            {categories.map(cat => (
              <button
                key={cat!.slug}
                className={`px-3 py-1.5 rounded-full text-sm border ${activeCat === cat!.slug ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300'}`}
                onClick={() => setActiveCat(cat!.slug as TopCat)}
              >
                {cat!.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-app py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filtres (Desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Filtres</h2>

              {/* Recherche */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              {/* Prix */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Prix max</h3>
                <input type="range" min={0} max={100000} value={priceMax} onChange={(e) => setPriceMax(parseInt(e.target.value))} className="w-full" />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>0 F</span>
                  <span>{priceMax.toLocaleString('fr-FR')} F</span>
                </div>
              </div>

              {/* Marques */}
              {brands.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Marques</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {brands.map(brand => (
                      <label key={brand} className="flex items-center">
                        <input type="checkbox" className="mr-2" checked={selectedBrands.includes(brand)} onChange={() => toggleBrand(brand)} />
                        <span className="text-sm">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Disponibilité */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Disponibilité</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="radio" name="stock" value="all" className="mr-2" checked={stockFilter === 'all'} onChange={(e) => setStockFilter(e.target.value as any)} />
                    <span className="text-sm">Tous</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="stock" value="in_stock" className="mr-2" checked={stockFilter === 'in_stock'} onChange={(e) => setStockFilter(e.target.value as any)} />
                    <span className="text-sm">En stock</span>
                  </label>
                </div>
              </div>

              <button onClick={() => { setQuery(''); setPriceMax(100000); setSelectedBrands([]); setStockFilter('all'); setSortBy('pertinence'); }} className="text-primary hover:underline text-sm">
                Réinitialiser les filtres
              </button>
            </div>
          </aside>

          {/* Contenu principal */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <p className="text-sm text-gray-600">{filtered.length} produit{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden btn-outline text-sm py-2 px-4">Filtres</button>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="input-field text-sm py-2 px-4">
                  <option value="pertinence">Pertinence</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                  <option value="rating">Meilleures notes</option>
                  <option value="name">Nom A-Z</option>
                </select>
              </div>
            </div>

            {/* Filtres mobile */}
            {showFilters && (
              <div className="lg:hidden bg-gray-50 p-4 rounded-lg mb-6">
                <div className="space-y-4">
                  <input type="text" placeholder="Rechercher..." value={query} onChange={(e) => setQuery(e.target.value)} className="input-field w-full" />
                  <div>
                    <h3 className="font-medium mb-1">Prix max: {priceMax.toLocaleString('fr-FR')} F</h3>
                    <input type="range" min={0} max={100000} value={priceMax} onChange={(e) => setPriceMax(parseInt(e.target.value))} className="w-full" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Disponibilité</h3>
                    <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as any)} className="w-full input-field text-sm">
                      <option value="all">Tous</option>
                      <option value="in_stock">En stock</option>
                    </select>
                  </div>
                  <button onClick={() => setShowFilters(false)} className="btn-primary w-full text-sm">Appliquer</button>
                </div>
              </div>
            )}

            {/* Grille */}
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Aucun produit ne correspond à vos critères</p>
                <button onClick={() => { setQuery(''); setPriceMax(100000); setSelectedBrands([]); setStockFilter('all'); setSortBy('pertinence'); }} className="btn-outline">Réinitialiser</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

