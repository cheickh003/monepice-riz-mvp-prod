'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import { getProductsByCategory, getCategoryBySlug, categories } from '@/lib/products';
import { Product } from '@/lib/types';
import * as Icons from '@/lib/icons';

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState(getCategoryBySlug(categorySlug));
  
  // États des filtres
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('pertinence');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const categoryProducts = getProductsByCategory(categorySlug);
    setProducts(categoryProducts);
    setFilteredProducts(categoryProducts);
    setCategory(getCategoryBySlug(categorySlug));
  }, [categorySlug]);

  // Obtenir les marques uniques
  const brands = Array.from(new Set(products.map(p => p.brand))).sort();

  // Appliquer les filtres
  useEffect(() => {
    let filtered = [...products];

    // Filtre par prix
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Filtre par marque
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(p => selectedBrands.includes(p.brand));
    }

    // Filtre par stock
    if (stockFilter !== 'all') {
      filtered = filtered.filter(p => p.stock === stockFilter);
    }

    // Tri
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredProducts(filtered);
  }, [products, priceRange, selectedBrands, stockFilter, sortBy]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  if (!category) {
    return (
      <div className="container-app py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Catégorie non trouvée</h1>
        <Link href="/products" className="text-primary hover:underline">
          Retour aux catégories
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4">
        <div className="container-app">
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-primary transition-colors whitespace-nowrap">
              Accueil
            </Link>
            <span className="text-gray-400 flex-shrink-0">/</span>
            <span className="text-gray-900 font-medium break-words">{category.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-app py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filtres (Desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Filtres</h2>
              
              {/* Filtre Prix */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Prix</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="50000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>0 F</span>
                    <span>{priceRange[1].toLocaleString('fr-FR')} F</span>
                  </div>
                </div>
              </div>

              {/* Filtre Marques */}
              {brands.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Marques</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {brands.map(brand => (
                      <label key={brand} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          className="mr-2"
                        />
                        <span className="text-sm">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Filtre Stock */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Disponibilité</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="stock"
                      value="all"
                      checked={stockFilter === 'all'}
                      onChange={(e) => setStockFilter(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Tous les produits</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="stock"
                      value="in_stock"
                      checked={stockFilter === 'in_stock'}
                      onChange={(e) => setStockFilter(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">En stock</span>
                  </label>
                </div>
              </div>

              {/* Réinitialiser */}
              <button
                onClick={() => {
                  setPriceRange([0, 50000]);
                  setSelectedBrands([]);
                  setStockFilter('all');
                }}
                className="text-primary hover:underline text-sm"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </aside>

          {/* Contenu principal */}
          <div className="flex-1">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center">
                {(() => {
                  const Icon = Icons.categoryIcons[category.id as keyof typeof Icons.categoryIcons];
                  return Icon ? <Icon className="w-8 h-8 mr-3" /> : null;
                })()}
                {category.name}
              </h1>
              <p className="text-gray-600">{category.description}</p>
            </div>

            {/* Bannières promotionnelles pour les catégories fraîches */}
            {categorySlug === 'boucherie' && (
              <div className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">🥩 Qualité Boucherie Garantie</h3>
                    <p className="mb-3">Viandes fraîches livrées tous les jours • Découpe sur mesure</p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="bg-white/20 px-3 py-1 rounded-full">✓ Bœuf premium</span>
                      <span className="bg-white/20 px-3 py-1 rounded-full">✓ Agneau tendre</span>
                      <span className="bg-white/20 px-3 py-1 rounded-full">✓ Veau de qualité</span>
                    </div>
                  </div>
                  <div className="hidden md:block text-6xl opacity-20">🥩</div>
                </div>
              </div>
            )}

            {categorySlug === 'poissonnerie' && (
              <div className="space-y-4 mb-6">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-2">🐟 Poissons de San Pedro</h3>
                      <p className="mb-3">Arrivage quotidien direct du port • Fraîcheur incomparable</p>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="bg-white/20 px-3 py-1 rounded-full">✓ Pêche du jour</span>
                        <span className="bg-white/20 px-3 py-1 rounded-full">✓ Fruits de mer</span>
                        <span className="bg-white/20 px-3 py-1 rounded-full">✓ Livraison glacée</span>
                      </div>
                    </div>
                    <div className="hidden md:block text-6xl opacity-20">🐟</div>
                  </div>
                </div>
                
                {/* Bannière spéciale Escargots & Crabes */}
                <div className="bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-2 flex items-center">
                        🐌🦀 Nos Spécialités Phares
                        <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">★ EXCLUSIF</span>
                      </h3>
                      <p className="mb-3">Escargots et crabes de qualité premium • Préparation traditionnelle</p>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="bg-white/20 px-3 py-1 rounded-full">✓ Escargots sélectionnés</span>
                        <span className="bg-white/20 px-3 py-1 rounded-full">✓ Crabes vivants</span>
                        <span className="bg-white/20 px-3 py-1 rounded-full">✓ Préparation sur demande</span>
                      </div>
                    </div>
                    <div className="hidden md:block text-6xl opacity-20">🐌</div>
                  </div>
                </div>
              </div>
            )}

            {categorySlug === 'volaille' && (
              <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">🐔 Volailles d'Élevage Local</h3>
                    <p className="mb-3">Poulets fermiers élevés en plein air • Sans hormones</p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="bg-white/20 px-3 py-1 rounded-full">✓ Poulet fermier</span>
                      <span className="bg-white/20 px-3 py-1 rounded-full">✓ Dinde fraîche</span>
                      <span className="bg-white/20 px-3 py-1 rounded-full">✓ Canard savoureux</span>
                    </div>
                  </div>
                  <div className="hidden md:block text-6xl opacity-20">🐔</div>
                </div>
              </div>
            )}

            {categorySlug === 'charcuterie' && (
              <div className="bg-gradient-to-r from-pink-600 to-pink-500 text-white rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">🥓 Charcuterie Fine Sélectionnée</h3>
                    <p className="mb-3">Jambons et saucissons de qualité • Conservation optimale</p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="bg-white/20 px-3 py-1 rounded-full">✓ Jambon premium</span>
                      <span className="bg-white/20 px-3 py-1 rounded-full">✓ Saucissons artisanaux</span>
                      <span className="bg-white/20 px-3 py-1 rounded-full">✓ Pâtés maison</span>
                    </div>
                  </div>
                  <div className="hidden md:block text-6xl opacity-20">🥓</div>
                </div>
              </div>
            )}

            {/* Barre de tri et filtres mobile */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <p className="text-sm text-gray-600">
                {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
              </p>
              
              <div className="flex items-center gap-4">
                {/* Bouton filtres mobile */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden btn-outline text-sm py-2 px-4"
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filtres
                </button>

                {/* Tri */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field text-sm py-2 px-4"
                >
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
                {/* Contenu des filtres similaire à la sidebar */}
                <div className="space-y-4">
                  {/* Prix */}
                  <div>
                    <h3 className="font-medium mb-2">Prix max: {priceRange[1].toLocaleString('fr-FR')} F</h3>
                    <input
                      type="range"
                      min="0"
                      max="50000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                      className="w-full"
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <h3 className="font-medium mb-2">Disponibilité</h3>
                    <select
                      value={stockFilter}
                      onChange={(e) => setStockFilter(e.target.value)}
                      className="w-full input-field text-sm"
                    >
                      <option value="all">Tous</option>
                      <option value="in_stock">En stock</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setPriceRange([0, 50000]);
                      setStockFilter('all');
                      setShowFilters(false);
                    }}
                    className="btn-primary w-full text-sm"
                  >
                    Appliquer les filtres
                  </button>
                </div>
              </div>
            )}

            {/* Grille de produits */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Aucun produit ne correspond à vos critères</p>
                <button
                  onClick={() => {
                    setPriceRange([0, 50000]);
                    setSelectedBrands([]);
                    setStockFilter('all');
                  }}
                  className="btn-outline"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation catégories */}
      <section className="bg-gray-50 py-12 mt-12">
        <div className="container-app">
          <h2 className="text-xl font-semibold mb-6 text-center">Autres catégories</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {categories
              .filter(c => c.id !== categorySlug)
              .map(cat => (
                <Link
                  key={cat.id}
                  href={`/products/${cat.slug}`}
                  className="bg-white px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center space-x-2"
                >
                  {(() => {
                    const Icon = Icons.categoryIcons[cat.id as keyof typeof Icons.categoryIcons];
                    return Icon ? <Icon className="w-6 h-6" /> : null;
                  })()}
                  <span className="font-medium">{cat.name}</span>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}