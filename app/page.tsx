'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Truck, CheckCircle, CreditCard, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import * as Icons from '@/lib/icons';
import { 
  getFeaturedProducts, 
  getCategories, 
  listProducts 
} from '@/lib/services/products';
import { useSelectedStore } from '@/lib/stores/storeSelectionStore';
import ProductCard from '@/components/product/ProductCard';
import SpecialtySection from '@/components/specialty/SpecialtySection';
import StoreSelector from '@/components/store/StoreSelector';

export default function Home() {
  const selectedStore = useSelectedStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showStoreSelector, setShowStoreSelector] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(true),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch featured products
  const { data: featuredProducts = [] } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => getFeaturedProducts(8),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch products by category for daily selection
  const { data: boucherieProducts = [] } = useQuery({
    queryKey: ['category-products', 'boucherie'],
    queryFn: async () => {
      const boucherieCategory = categories.find(c => c.slug === 'boucherie');
      if (!boucherieCategory) return [];
      const result = await listProducts({ categoryId: boucherieCategory.$id }, { limit: 4 });
      return result.documents;
    },
    enabled: categories.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const { data: poissonnerieProducts = [] } = useQuery({
    queryKey: ['category-products', 'poissonnerie'],
    queryFn: async () => {
      const poissonnerieCategory = categories.find(c => c.slug === 'poissonnerie');
      if (!poissonnerieCategory) return [];
      const result = await listProducts({ categoryId: poissonnerieCategory.$id }, { limit: 4 });
      return result.documents;
    },
    enabled: categories.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const { data: volailleProducts = [] } = useQuery({
    queryKey: ['category-products', 'volaille'],
    queryFn: async () => {
      const volailleCategory = categories.find(c => c.slug === 'volaille');
      if (!volailleCategory) return [];
      const result = await listProducts({ categoryId: volailleCategory.$id }, { limit: 4 });
      return result.documents;
    },
    enabled: categories.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const { data: epicesProducts = [] } = useQuery({
    queryKey: ['category-products', 'epices'],
    queryFn: async () => {
      const epicesCategory = categories.find(c => c.slug === 'epices');
      if (!epicesCategory) return [];
      const result = await listProducts({ categoryId: epicesCategory.$id }, { limit: 4 });
      return result.documents;
    },
    enabled: categories.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const { data: petitsFumesProducts = [] } = useQuery({
    queryKey: ['category-products', 'petits-fumes'],
    queryFn: async () => {
      const petitsFumesCategory = categories.find(c => c.slug === 'petits-fumes');
      if (!petitsFumesCategory) return [];
      const result = await listProducts({ categoryId: petitsFumesCategory.$id }, { limit: 4 });
      return result.documents;
    },
    enabled: categories.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch promotional products (featured + discounted)
  const { data: promoProducts = [] } = useQuery({
    queryKey: ['promo-products'],
    queryFn: async () => {
      const result = await listProducts({ featured: true }, { limit: 8 });
      return result.documents;
    },
    staleTime: 5 * 60 * 1000,
  });

  const slides = [
    {
      id: 1,
      title: "🐌🦀 Spécialités de San Pedro",
      subtitle: selectedStore 
        ? `Escargots & crabes frais disponibles à ${selectedStore === 'COCODY' ? 'Cocody' : 'Koumassi'}`
        : "Escargots & crabes frais • Livraison express",
      buttonText: "Découvrir nos spécialités",
      buttonLink: "/products?specialty=true",
      bgColor: "from-amber-500 to-orange-500",
      icon: Icons.Fish
    },
    {
      id: 2,
      title: "🥩 Boucherie, Poissonnerie & Volaille",
      subtitle: selectedStore 
        ? `Produits frais du jour à ${selectedStore === 'COCODY' ? 'Cocody' : 'Koumassi'}`
        : "Livraison quotidienne • Poissons de San Pedro",
      buttonText: "Voir la sélection",
      buttonLink: "#selection-jour",
      bgColor: "from-red-500 to-pink-500",
      icon: Icons.Beef
    },
    {
      id: 3,
      title: selectedStore ? `Livraison express depuis ${selectedStore}` : "Livraison express 3h",
      subtitle: selectedStore 
        ? "Commandez avant 10h pour une livraison le jour même"
        : "Choisissez votre magasin pour commander",
      buttonText: selectedStore ? "Commander maintenant" : "Choisir un magasin",
      buttonLink: selectedStore ? "/products" : "#store-selector",
      bgColor: "from-blue-500 to-cyan-500",
      icon: Truck
    },
    {
      id: 4,
      title: "Produits d'exception",
      subtitle: "Sélection premium • Qualité garantie • Prix compétitifs",
      buttonText: "Découvrir",
      buttonLink: "/products?featured=true",
      bgColor: "from-purple-500 to-indigo-500",
      icon: Icons.Star
    },
    {
      id: 5,
      title: "Deux magasins à Abidjan",
      subtitle: "Cocody & Koumassi • Retrait en magasin ou livraison",
      buttonText: "Nos magasins",
      buttonLink: "/stores",
      bgColor: "from-emerald-500 to-teal-500",
      icon: Icons.MapPin
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleSlideButtonClick = (buttonLink: string) => {
    if (buttonLink === "#store-selector") {
      setShowStoreSelector(true);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Carousel de promotions */}
      <section className="relative h-52 sm:h-64 md:h-80 overflow-hidden">
        <div className="relative w-full h-full">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
                index === currentSlide ? 'translate-x-0' : 
                index < currentSlide ? '-translate-x-full' : 'translate-x-full'
              }`}
            >
              <div className={`w-full h-full bg-gradient-to-r ${slide.bgColor} text-white`}>
                <div className="container-app h-full flex items-center py-4">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex-1 pr-4">
                      <h1 className="text-lg sm:text-xl md:text-3xl lg:text-4xl font-bold mb-2 leading-tight">
                        {slide.title}
                      </h1>
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 md:mb-6 opacity-90 leading-relaxed">
                        {slide.subtitle}
                      </p>
                      {slide.buttonLink.startsWith('#') ? (
                        <button
                          onClick={() => handleSlideButtonClick(slide.buttonLink)}
                          className="inline-flex items-center bg-white text-gray-900 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm sm:text-base"
                        >
                          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          <span className="truncate">{slide.buttonText}</span>
                        </button>
                      ) : (
                        <Link 
                          href={slide.buttonLink} 
                          className="inline-flex items-center bg-white text-gray-900 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm sm:text-base"
                        >
                          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          <span className="truncate">{slide.buttonText}</span>
                        </Link>
                      )}
                    </div>
                    <div className="hidden sm:block ml-4 md:ml-8 flex-shrink-0">
                      <slide.icon className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 opacity-20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-200 transition-all duration-200 z-10 p-2 hover:scale-110"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 drop-shadow-lg" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 text-white hover:text-gray-200 transition-all duration-200 z-10 p-2 hover:scale-110"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 drop-shadow-lg" />
        </button>

      </section>

      {/* Section Sélection du Jour - Mise en avant */}
      <section className="py-12 bg-gradient-to-b from-green-50 to-white">
        <div className="container-app">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              🥩 Sélection du Jour 🐟
            </h2>
            <p className="text-lg text-gray-600">
              Viandes, poissons de San Pedro, volailles et nos spécialités escargots & crabes
            </p>
          </div>

          {/* Boucherie */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Icons.Beef className="w-8 h-8 text-red-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">Boucherie</h3>
              </div>
              <Link href="/products/boucherie" className="text-red-600 hover:text-red-700 font-medium">
                Voir tout →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {boucherieProducts.map((product) => (
                <ProductCard 
                  key={product.$id} 
                  product={product}
                  showStoreAvailability={true}
                  compact={true}
                />
              ))}
            </div>
          </div>

          {/* Poissonnerie */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Icons.Fish className="w-8 h-8 text-blue-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">Poissonnerie</h3>
              </div>
              <Link href="/products/poissonnerie" className="text-blue-600 hover:text-blue-700 font-medium">
                Voir tout →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {poissonnerieProducts.map((product) => (
                <ProductCard 
                  key={product.$id} 
                  product={product}
                  showStoreAvailability={true}
                  compact={true}
                />
              ))}
            </div>
          </div>

          {/* Volaille */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Icons.Bird className="w-8 h-8 text-orange-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">Volaille</h3>
              </div>
              <Link href="/products/volaille" className="text-orange-600 hover:text-orange-700 font-medium">
                Voir tout →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {volailleProducts.map((product) => (
                <ProductCard 
                  key={product.$id} 
                  product={product}
                  showStoreAvailability={true}
                  compact={true}
                />
              ))}
            </div>
          </div>

          {/* Épices */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Icons.Star className="w-8 h-8 text-yellow-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">Épices</h3>
              </div>
              <Link href="/products/epices" className="text-yellow-600 hover:text-yellow-700 font-medium">
                Voir tout →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {epicesProducts.map((product) => (
                <ProductCard 
                  key={product.$id} 
                  product={product}
                  showStoreAvailability={true}
                  compact={true}
                />
              ))}
            </div>
          </div>

          {/* Les petits fumées */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Icons.Zap className="w-8 h-8 text-gray-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">Les petits fumées</h3>
              </div>
              <Link href="/products/petits-fumes" className="text-gray-600 hover:text-gray-700 font-medium">
                Voir tout →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {petitsFumesProducts.map((product) => (
                <ProductCard 
                  key={product.$id} 
                  product={product}
                  showStoreAvailability={true}
                  compact={true}
                />
              ))}
            </div>
          </div>


          {/* Bannière d'information */}
          <div className="bg-gradient-to-r from-primary to-primary-600 text-white rounded-lg p-6 text-center">
            <h4 className="text-xl font-bold mb-2">
              🚚 Livraison Express
            </h4>
            <p className="mb-4">
              Commandez avant 10h pour une livraison le jour même
            </p>
            <Link href="/products" className="inline-flex items-center bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Commander maintenant
            </Link>
          </div>
        </div>
      </section>

      {/* Specialty Section - Escargots & Crabes */}
      <SpecialtySection 
        limit={6}
        showCrossStoreAvailability={true}
        compact={false}
      />

      {/* Grille des catégories */}
      <section className="py-12">
        <div className="container-app">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            Nos Catégories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.$id}
                href={`/products/${category.slug}`}
                className="card hover:scale-105 transition-transform duration-200 text-center group"
              >
                <div className="mb-3">
                  {Icons.categoryIcons[category.slug as keyof typeof Icons.categoryIcons] && (
                    <div className="w-10 h-10 mx-auto">
                      {(() => {
                        const Icon = Icons.categoryIcons[category.slug as keyof typeof Icons.categoryIcons];
                        return <Icon className="w-full h-full text-gray-700" />;
                      })()}
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {category.description || 'Disponible'}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section Achats précédents (simulée) */}
      <section className="py-12 bg-gray-50">
        <div className="container-app">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Vos achats fréquents
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {featuredProducts.slice(0, 8).map((product) => (
              <div key={product.$id} className="flex flex-col h-full">
                <Link href={`/product/${product.slug}`} className="block group flex-1 flex flex-col">
                  <div className="w-full aspect-square bg-white rounded-lg shadow-sm overflow-hidden mb-2 group-hover:shadow-md transition-shadow flex-shrink-0">
                    <div className="w-full h-full flex items-center justify-center p-4">
                      {(() => {
                        const Icon = Icons.categoryIcons[product.categorySlug as keyof typeof Icons.categoryIcons] || Icons.Package;
                        return <Icon className="w-8 h-8 text-gray-400" />;
                      })()}
                    </div>
                  </div>
                  <div className="text-center flex-1 flex flex-col justify-between">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-primary transition-colors mb-2">
                      {product.name}
                    </h3>
                    <p className="text-sm font-bold text-primary">
                      {product.basePrice?.toLocaleString('fr-FR')} F
                    </p>
                  </div>
                </Link>
                <button className="btn-primary text-xs py-2 px-3 mt-2 w-full flex-shrink-0">
                  + Ajouter
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Promotions */}
      {promoProducts.length > 0 && (
        <section className="py-12">
          <div className="container-app">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                <Icons.Tag className="w-5 h-5 inline mr-1" />
                Promotions
              </h2>
              <Link href="/products/promo" className="text-primary hover:text-primary-600 font-medium">
                Voir tout →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {promoProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.$id}
                  product={product}
                  showStoreAvailability={true}
                  showPromotion={true}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section Avantages */}
      <section className="py-12 bg-gradient-to-br from-secondary-50 to-tertiary-50">
        <div className="container-app">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            Pourquoi choisir MonEpice&Riz ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Livraison Express</h3>
              <p className="text-gray-600">
                Recevez vos courses rapidement dans tout Abidjan
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Produits de Qualité</h3>
              <p className="text-gray-600">
                Sélection rigoureuse et marques reconnues
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4 text-gray-900">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Paiement Flexible</h3>
              <p className="text-gray-600">
                Mobile Money, cartes bancaires ou paiement à la livraison
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Store Selector Modal */}
      {showStoreSelector && (
        <StoreSelector
          onClose={() => setShowStoreSelector(false)}
          variant="modal"
        />
      )}
    </div>
  );
}