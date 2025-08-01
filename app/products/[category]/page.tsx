/**
 * Category Page with Store-Aware Features
 * 
 * Dynamic category-specific product listing with advanced search, filtering,
 * and store-aware inventory display. Integrates with the search system
 * and maintains consistency with the products page.
 */

'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useSelectedStore, checkAndPromptStoreUpdate } from '@/lib/stores/storeSelectionStore';
import {
  listProducts,
  getCategories,
  searchProductsWithStore
} from '@/lib/services/products';
import StoreSelectionErrorBoundary from '@/components/errors/StoreSelectionErrorBoundary';
import AdvancedSearch from '@/components/search/AdvancedSearch';
import SearchResults from '@/components/search/SearchResults';
import SpecialtySection from '@/components/specialty/SpecialtySection';
import ProductCard from '@/components/product/ProductCard';
import { Product } from '@/lib/types';
import * as Icons from '@/lib/icons';

interface SearchFilters {
  query: string;
  categoryId?: string;
  priceRange: { min: number; max: number };
  storeFilter: string;
  availabilityFilter: string;
  specialtyOnly: boolean;
  featuredOnly: boolean;
  tags: string[];
  sortBy: string;
}

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  priceRange: { min: 0, max: 50000 },
  storeFilter: 'selected',
  availabilityFilter: 'available',
  specialtyOnly: false,
  featuredOnly: false,
  tags: [],
  sortBy: 'relevance'
};

function CategoryPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedStore = useSelectedStore();
  const categorySlug = params.category as string;
  
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [hasSearched, setHasSearched] = useState(false);

  // Load categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(true),
    staleTime: 10 * 60 * 1000,
  });

  // Find current category
  const currentCategory = useMemo(() => {
    return categories.find(cat => cat.slug === categorySlug);
  }, [categories, categorySlug]);

  // Initialize filters from URL params and category
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    const urlMinPrice = parseInt(searchParams.get('min_price') || '0');
    const urlMaxPrice = parseInt(searchParams.get('max_price') || '50000');
    const urlStore = searchParams.get('store') || 'selected';
    const urlSort = searchParams.get('sort') || 'relevance';
    const urlSpecialty = searchParams.get('specialty') === 'true';
    const urlFeatured = searchParams.get('featured') === 'true';

    setFilters({
      query: urlQuery,
      categoryId: currentCategory?.$id,
      priceRange: { min: urlMinPrice, max: urlMaxPrice },
      storeFilter: urlStore,
      availabilityFilter: 'available',
      specialtyOnly: urlSpecialty,
      featuredOnly: urlFeatured,
      tags: [],
      sortBy: urlSort
    });

    setHasSearched(Boolean(urlQuery || urlSpecialty || urlFeatured));
  }, [searchParams, currentCategory]);

  // Check for store updates on page load
  useEffect(() => {
    const checkStoreUpdate = async () => {
      try {
        const updateInfo = await checkAndPromptStoreUpdate();
        if (updateInfo.shouldUpdate) {
          console.log('Store update recommended:', updateInfo.reason);
        }
      } catch (error) {
        console.warn('Store update check failed:', error);
      }
    };

    checkStoreUpdate();
  }, []);

  // Search/filter products for this category
  const {
    data: searchResults,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts
  } = useQuery({
    queryKey: ['category-products', categorySlug, filters, currentPage, selectedStore],
    queryFn: async () => {
      const targetStore = filters.storeFilter === 'selected' ? selectedStore :
                         filters.storeFilter === 'all' ? undefined : filters.storeFilter;

      if (filters.query) {
        // Use search functionality with category filter
        return await searchProductsWithStore(
          filters.query,
          targetStore,
          {
            categoryId: currentCategory?.$id,
            limit: 24,
            offset: (currentPage - 1) * 24,
            orderBy: filters.sortBy === 'price_asc' ? 'basePrice' :
                    filters.sortBy === 'price_desc' ? 'basePrice' :
                    filters.sortBy === 'name' ? 'name' : '$createdAt',
            orderDirection: filters.sortBy === 'price_desc' ? 'desc' : 'asc'
          }
        );
      } else {
        // Use regular listing with category filter
        return await listProducts(
          {
            categoryId: currentCategory?.$id,
            featured: filters.featuredOnly || undefined,
            specialty: filters.specialtyOnly || undefined,
            priceRange: filters.priceRange.min > 0 || filters.priceRange.max < 50000 ?
              filters.priceRange : undefined,
            active: true
          },
          {
            limit: 24,
            offset: (currentPage - 1) * 24,
            orderBy: filters.sortBy === 'price_asc' ? 'basePrice' :
                    filters.sortBy === 'price_desc' ? 'basePrice' :
                    filters.sortBy === 'name' ? 'name' : '$createdAt',
            orderDirection: filters.sortBy === 'price_desc' ? 'desc' : 'asc'
          }
        );
      }
    },
    enabled: Boolean(currentCategory),
    staleTime: 2 * 60 * 1000,
  });

  // Handle search
  const handleSearch = useCallback((newFilters: SearchFilters) => {
    setFilters({
      ...newFilters,
      categoryId: currentCategory?.$id // Ensure category filter is maintained
    });
    setCurrentPage(1);
    setHasSearched(Boolean(newFilters.query || newFilters.specialtyOnly || newFilters.featuredOnly));
  }, [currentCategory]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    const newFilters = {
      ...DEFAULT_FILTERS,
      categoryId: currentCategory?.$id // Keep category filter
    };
    setFilters(newFilters);
    setCurrentPage(1);
    setHasSearched(false);
    router.push(`/products/${categorySlug}`);
  }, [router, categorySlug, currentCategory]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (!searchResults) return 0;
    return Math.ceil(searchResults.total / 24);
  }, [searchResults]);

  if (categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentCategory) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Catégorie non trouvée</h1>
        <p className="text-gray-600 mb-6">La catégorie "{categorySlug}" n'existe pas ou n'est plus disponible.</p>
        <Link href="/products" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Retour aux produits
        </Link>
      </div>
    );
  }

  return (
    <StoreSelectionErrorBoundary>
      <div className="min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-gray-50 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors whitespace-nowrap">
                Accueil
              </Link>
              <span className="text-gray-400 flex-shrink-0">/</span>
              <Link href="/products" className="text-gray-600 hover:text-blue-600 transition-colors whitespace-nowrap">
                Produits
              </Link>
              <span className="text-gray-400 flex-shrink-0">/</span>
              <span className="text-gray-900 font-medium break-words">{currentCategory.name}</span>
            </nav>
          </div>
        </div>

        {/* Category Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center">
                {(() => {
                  const Icon = Icons.categoryIcons[currentCategory.slug as keyof typeof Icons.categoryIcons];
                  return Icon ? <Icon className="w-10 h-10 mr-3" /> : null;
                })()}
                {currentCategory.name}
                {selectedStore && (
                  <span className="ml-3 text-lg text-blue-600 font-normal">
                    • {selectedStore === 'COCODY' ? 'Cocody' : 'Koumassi'}
                  </span>
                )}
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                {currentCategory.description || `Découvrez notre sélection ${currentCategory.name.toLowerCase()} avec disponibilité en temps réel`}
              </p>
            </div>

            {/* Search Component */}
            <div className="max-w-4xl mx-auto">
              <AdvancedSearch
                onSearch={handleSearch}
                onClear={handleClearFilters}
                initialFilters={filters}
                isLoading={productsLoading}
                compact={false}
              />
            </div>
          </div>
        </section>

        {/* Category-Specific Promotional Banners */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Bannières promotionnelles pour les catégories fraîches */}
          {categorySlug === 'boucherie' && (
            <div className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">🥩 Qualité Boucherie Garantie</h3>
                  <p className="mb-3">Viandes fraîches livrées tous les jours • Découpe sur mesure</p>
                  {selectedStore && (
                    <p className="text-sm opacity-90 mb-3">
                      Disponible maintenant à {selectedStore === 'COCODY' ? 'Cocody' : 'Koumassi'}
                    </p>
                  )}
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
                    {selectedStore && (
                      <p className="text-sm opacity-90 mb-3">
                        Arrivage frais à {selectedStore === 'COCODY' ? 'Cocody' : 'Koumassi'}
                      </p>
                    )}
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
                    {selectedStore && (
                      <p className="text-sm opacity-90 mb-3">
                        Spécialités disponibles à {selectedStore === 'COCODY' ? 'Cocody' : 'Koumassi'}
                      </p>
                    )}
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
                  {selectedStore && (
                    <p className="text-sm opacity-90 mb-3">
                      Volailles fraîches à {selectedStore === 'COCODY' ? 'Cocody' : 'Koumassi'}
                    </p>
                  )}
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
                  {selectedStore && (
                    <p className="text-sm opacity-90 mb-3">
                      Charcuterie artisanale à {selectedStore === 'COCODY' ? 'Cocody' : 'Koumassi'}
                    </p>
                  )}
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
        </div>

        {/* Search Results or Default Category View */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {hasSearched || filters.specialtyOnly || filters.featuredOnly ? (
              <SearchResults
                results={searchResults?.documents || []}
                totalResults={searchResults?.total || 0}
                currentPage={currentPage}
                totalPages={totalPages}
                searchQuery={filters.query}
                isLoading={productsLoading}
                hasError={Boolean(productsError)}
                onPageChange={handlePageChange}
                onRetry={refetchProducts}
                onSortChange={(sortBy) => handleSearch({ ...filters, sortBy })}
                onViewModeChange={setViewMode}
                categoryName={currentCategory.name}
              />
            ) : (
              <>
                {/* Default Category Products Display */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Tous les produits {currentCategory.name}
                  </h2>
                  <p className="text-gray-600">
                    {searchResults?.total || 0} produit{(searchResults?.total || 0) > 1 ? 's' : ''} disponible{(searchResults?.total || 0) > 1 ? 's' : ''}
                    {selectedStore && ` à ${selectedStore === 'COCODY' ? 'Cocody' : 'Koumassi'}`}
                  </p>
                </div>

                {productsLoading ? (
                  <ProductsSkeleton />
                ) : searchResults?.documents?.length ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {searchResults.documents.map((product: Product) => (
                        <ProductCard key={product.$id} product={product} />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-center mt-8">
                        <nav className="flex items-center space-x-2">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Précédent
                          </button>
                          
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = i + 1;
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-2 text-sm font-medium rounded-md ${
                                  currentPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Suivant
                          </button>
                        </nav>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Aucun produit dans cette catégorie
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Nous travaillons pour enrichir notre catalogue {currentCategory.name.toLowerCase()}.
                    </p>
                    <Link
                      href="/products"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Voir tous les produits
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Specialty Section for specialty categories */}
        {(categorySlug === 'poissonnerie' || filters.specialtyOnly) && !hasSearched && (
          <SpecialtySection
            limit={8}
            showCrossStoreAvailability={true}
            compact={false}
            className="py-8 bg-gray-50"
          />
        )}

        {/* Navigation catégories */}
        <section className="bg-gray-50 py-12 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Autres catégories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories
                .filter(cat => cat.$id !== currentCategory.$id)
                .map(cat => (
                  <Link
                    key={cat.$id}
                    href={`/products/${cat.slug}`}
                    className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group hover:scale-[1.02]"
                  >
                    <div className="text-center">
                      <div className="mb-3">
                        {(() => {
                          const Icon = Icons.categoryIcons[cat.slug as keyof typeof Icons.categoryIcons];
                          return Icon ? (
                            <Icon className="w-12 h-12 mx-auto text-gray-600 group-hover:text-blue-600 transition-colors" />
                          ) : (
                            <div className="w-12 h-12 mx-auto bg-gray-200 rounded-lg flex items-center justify-center text-2xl">
                              📦
                            </div>
                          );
                        })()}
                      </div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Découvrir
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </section>

        {/* Help CTA */}
        <section className="py-12 bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Besoin d'aide pour vos courses {currentCategory.name.toLowerCase()} ?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Notre équipe est là pour vous conseiller sur nos produits {currentCategory.name.toLowerCase()}.
              {selectedStore && ` Contactez directement notre magasin de ${selectedStore === 'COCODY' ? 'Cocody' : 'Koumassi'}.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`tel:${selectedStore === 'KOUMASSI' ? '+2250172089090' : '+2250161888888'}`}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Appelez-nous
              </a>
              <button
                onClick={() => window.open('/contact', '_blank')}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Contactez-nous
              </button>
            </div>
          </div>
        </section>
      </div>
    </StoreSelectionErrorBoundary>
  );
}

// Loading skeleton for products
function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
          <div className="h-4 bg-gray-200 rounded mb-2" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CategoryPageContent />
    </Suspense>
  );
}