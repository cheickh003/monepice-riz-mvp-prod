/**
 * Products Page with Advanced Search
 * 
 * Comprehensive products listing with store-aware search, filtering, and pagination.
 * Features enhanced search functionality, category browsing, and real-time availability.
 */

'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedStore = useSelectedStore();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [hasSearched, setHasSearched] = useState(false);

  // Initialize filters from URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    const urlCategory = searchParams.get('category') || undefined;
    const urlMinPrice = parseInt(searchParams.get('min_price') || '0');
    const urlMaxPrice = parseInt(searchParams.get('max_price') || '50000');
    const urlStore = searchParams.get('store') || 'selected';
    const urlSort = searchParams.get('sort') || 'relevance';
    const urlSpecialty = searchParams.get('specialty') === 'true';
    const urlFeatured = searchParams.get('featured') === 'true';

    setFilters({
      query: urlQuery,
      categoryId: urlCategory,
      priceRange: { min: urlMinPrice, max: urlMaxPrice },
      storeFilter: urlStore,
      availabilityFilter: 'available',
      specialtyOnly: urlSpecialty,
      featuredOnly: urlFeatured,
      tags: [],
      sortBy: urlSort
    });

    setHasSearched(Boolean(urlQuery || urlCategory || urlSpecialty || urlFeatured));
  }, [searchParams]);

  // Check for store updates on page load
  useEffect(() => {
    const checkStoreUpdate = async () => {
      try {
        const updateInfo = await checkAndPromptStoreUpdate();
        if (updateInfo.shouldUpdate) {
          console.log('Store update recommended:', updateInfo.reason);
          // You could show a notification here if needed
        }
      } catch (error) {
        console.warn('Store update check failed:', error);
      }
    };

    checkStoreUpdate();
  }, []);

  // Load categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(true),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Search/filter products
  const { 
    data: searchResults, 
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts
  } = useQuery({
    queryKey: ['products-search', filters, currentPage, selectedStore],
    queryFn: async () => {
      const targetStore = filters.storeFilter === 'selected' ? selectedStore : 
                         filters.storeFilter === 'all' ? undefined : filters.storeFilter;

      if (filters.query) {
        // Use search functionality
        return await searchProductsWithStore(
          filters.query,
          targetStore,
          {
            limit: 24,
            offset: (currentPage - 1) * 24,
            orderBy: filters.sortBy === 'price_asc' ? 'basePrice' : 
                    filters.sortBy === 'price_desc' ? 'basePrice' : 
                    filters.sortBy === 'name' ? 'name' : '$createdAt',
            orderDirection: filters.sortBy === 'price_desc' ? 'desc' : 'asc'
          }
        );
      } else {
        // Use regular listing with filters
        return await listProducts(
          {
            categoryId: filters.categoryId,
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
    enabled: hasSearched || Boolean(filters.categoryId || filters.specialtyOnly || filters.featuredOnly),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Handle search
  const handleSearch = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setHasSearched(true);
  }, []);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
    setHasSearched(false);
    router.push('/products');
  }, [router]);

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

  // Fresh categories for the hero section
  const freshCategories = useMemo(() => {
    return categories.filter(cat => 
      ['boucherie', 'poissonnerie', 'volaille', 'charcuterie'].includes(cat.slug)
    );
  }, [categories]);

  return (
    <StoreSelectionErrorBoundary>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {selectedStore ? `Produits disponibles à ${selectedStore === 'COCODY' ? 'Cocody' : 'Koumassi'}` : 'Nos Produits'}
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Découvrez notre sélection de produits de qualité avec disponibilité en temps réel
              </p>
            </div>

            {/* Search Component */}
            <div className="max-w-4xl mx-auto">
              <AdvancedSearch
                onSearch={handleSearch}
                onClear={handleClearFilters}
                initialFilters={filters}
                isLoading={productsLoading}
              />
            </div>
          </div>
        </section>

        {/* Fresh Products Banner - Only show if no active search */}
        {!hasSearched && (
          <section className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  🥩 Sélection Fraîche du Jour 🐟
                </h2>
                <p className="text-lg opacity-90">
                  Boucherie • Poissonnerie • Volaille • Charcuterie
                </p>
                {selectedStore && (
                  <p className="text-sm opacity-80 mt-2">
                    Disponible à {selectedStore === 'COCODY' ? 'Cocody' : 'Koumassi'}
                  </p>
                )}
              </div>
              
              {!categoriesLoading && freshCategories.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {freshCategories.map((category) => (
                    <button
                      key={category.$id}
                      onClick={() => handleSearch({
                        ...DEFAULT_FILTERS,
                        categoryId: category.$id,
                        storeFilter: selectedStore || 'all'
                      })}
                      className="bg-white/10 backdrop-blur hover:bg-white/20 rounded-lg p-4 text-center transition-all group"
                    >
                      <div className="text-4xl mb-2">
                        {(() => {
                          const Icon = Icons.categoryIcons[category.slug as keyof typeof Icons.categoryIcons];
                          return Icon ? <Icon className="w-10 h-10 mx-auto text-white" /> : '📦';
                        })()}
                      </div>
                      <h3 className="font-semibold group-hover:scale-105 transition-transform">
                        {category.name}
                      </h3>
                      <p className="text-sm opacity-90 mt-1">
                        Disponible maintenant
                      </p>
                    </button>
                  ))}
                </div>
              )}
              
              <div className="text-center mt-6">
                <span className="inline-flex items-center bg-white/20 px-4 py-2 rounded-full text-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Livraison express garantie
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Search Results or Categories */}
        {hasSearched ? (
          <section className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              />
            </div>
          </section>
        ) : (
          <>
            {/* Specialty Section */}
            <SpecialtySection 
              limit={8}
              showCrossStoreAvailability={true}
              compact={false}
              className="py-8"
            />

            {/* All Categories */}
            <section className="py-12 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Toutes nos Catégories
                  </h2>
                  <p className="text-lg text-gray-600">
                    Explorez notre gamme complète de produits
                  </p>
                </div>

                {categoriesLoading ? (
                  <CategoriesSkeleton />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => (
                      <button
                        key={category.$id}
                        onClick={() => handleSearch({
                          ...DEFAULT_FILTERS,
                          categoryId: category.$id,
                          storeFilter: selectedStore || 'all'
                        })}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-6 text-left group hover:scale-[1.02]"
                      >
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            {(() => {
                              const Icon = Icons.categoryIcons[category.slug as keyof typeof Icons.categoryIcons];
                              return Icon ? (
                                <Icon className="w-12 h-12 text-gray-700 group-hover:text-blue-600 transition-colors" />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">
                                  📦
                                </div>
                              );
                            })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                              {category.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {category.description || 'Découvrez notre sélection'}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-blue-600">
                                Voir les produits
                              </span>
                              <span className="text-blue-600 group-hover:translate-x-1 transition-transform">
                                →
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* Help CTA */}
        <section className="py-12 bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Besoin d'aide pour vos courses ?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Notre équipe est là pour vous conseiller et vous accompagner dans vos achats. 
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

// Loading skeleton for categories
function CategoriesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}