'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { categories, getFeaturedProducts, getPromoProducts, getProductsByCategory } from '@/lib/products';
import { ShoppingCart, MapPin, Truck, CheckCircle, CreditCard, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import * as Icons from '@/lib/icons';
import ProductCard from '@/components/product/ProductCard';

export default function Home() {
  const featuredProducts = getFeaturedProducts(8);
  const promoProducts = getPromoProducts(8);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Récupérer les produits frais du jour
  const boucherieProducts = getProductsByCategory('boucherie').slice(0, 4);
  const poissonnerieProducts = getProductsByCategory('poissonnerie').slice(0, 4);
  const volailleProducts = getProductsByCategory('volaille').slice(0, 4);
  const epicesProducts = getProductsByCategory('epices').slice(0, 4);
  const petitsFumesProducts = getProductsByCategory('petits-fumes').slice(0, 4);

  const slides = [
    {
      id: 1,
      title: "🥩 Nouveau ! Boucherie, Poissonnerie & Volaille",
      subtitle: "Produits frais livrés tous les jours • Poissons de San Pedro",
      buttonText: "Découvrir nos produits frais",
      buttonLink: "#produits-frais",
      bgColor: "from-red-500 to-orange-500",
      icon: Icons.Beef
    },
    {
      id: 2,
      title: "Promotion -15% sur tous les produits frais !",
      subtitle: "Fromages, lait, beurre et plus encore",
      buttonText: "Voir les promotions",
      buttonLink: "/products/promo",
      bgColor: "from-primary to-primary-600",
      icon: Icons.Milk
    },
    {
      id: 3,
      title: "Livraison express",
      subtitle: "Commandez maintenant, recevez rapidement",
      buttonText: "Commander maintenant",
      buttonLink: "/products",
      bgColor: "from-secondary to-secondary-600",
      icon: Truck
    },
    {
      id: 4,
      title: "Nouveaux produits pour bébés",
      subtitle: "Découvrez notre sélection spécialisée",
      buttonText: "Découvrir",
      buttonLink: "/products/bebes",
      bgColor: "from-accent to-yellow-500",
      icon: Icons.Baby
    },
    {
      id: 5,
      title: "Produits d'entretien à prix réduits",
      subtitle: "Jusqu'à -20% sur votre hygiène quotidienne",
      buttonText: "Profiter des offres",
      buttonLink: "/products/entretien",
      bgColor: "from-tertiary to-orange-400",
      icon: Icons.Sparkles
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
                      <Link 
                        href={slide.buttonLink} 
                        className="inline-flex items-center bg-white text-gray-900 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm sm:text-base"
                      >
                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        <span className="truncate">{slide.buttonText}</span>
                      </Link>
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

      {/* Section Produits Frais du Jour - Mise en avant */}
      <section className="py-12 bg-gradient-to-b from-green-50 to-white">
        <div className="container-app">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              🥩 Produits Frais du Jour 🐟
            </h2>
            <p className="text-lg text-gray-600">
              Viandes fraîches, poissons de San Pedro et volailles de qualité
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
                <ProductCard key={product.id} product={product} />
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
                <ProductCard key={product.id} product={product} />
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
                <ProductCard key={product.id} product={product} />
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
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>

          {/* Les petits fumées */}
          <div className="mb-8">
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
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>

          {/* Bannière d'information */}
          <div className="bg-gradient-to-r from-primary to-primary-600 text-white rounded-lg p-6 text-center">
            <h4 className="text-xl font-bold mb-2">
              🚚 Livraison Express de Produits Frais
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

      {/* Grille des catégories */}
      <section className="py-12">
        <div className="container-app">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            Nos Catégories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products/${category.slug}`}
                className="card hover:scale-105 transition-transform duration-200 text-center group"
              >
                <div className="mb-3">
                {Icons.categoryIcons[category.id as keyof typeof Icons.categoryIcons] && (
                  <div className="w-10 h-10 mx-auto">
                    {(() => {
                      const Icon = Icons.categoryIcons[category.id as keyof typeof Icons.categoryIcons];
                      return <Icon className="w-full h-full text-gray-700" />;
                    })()}
                  </div>
                )}
              </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {category.productCount} produits
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
              <div key={product.id} className="flex flex-col h-full">
                <Link href={`/product/${product.slug}`} className="block group flex-1 flex flex-col">
                  <div className="w-full aspect-square bg-white rounded-lg shadow-sm overflow-hidden mb-2 group-hover:shadow-md transition-shadow flex-shrink-0">
                    <div className="w-full h-full flex items-center justify-center p-4">
                      {(() => {
                        const Icon = Icons.categoryIcons[product.mainCategory as keyof typeof Icons.categoryIcons] || Icons.Package;
                        return <Icon className="w-8 h-8 text-gray-400" />;
                      })()}
                    </div>
                  </div>
                  <div className="text-center flex-1 flex flex-col justify-between">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-primary transition-colors mb-2">
                      {product.name}
                    </h3>
                    <p className="text-sm font-bold text-primary">
                      {product.price.toLocaleString('fr-FR')} F
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
                <div key={product.id} className="card group h-full flex flex-col">
                  <Link href={`/product/${product.slug}`} className="flex-1 flex flex-col">
                    <div className="relative">
                      <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3 flex-shrink-0">
                        <div className="w-full h-full flex items-center justify-center p-4">
                          {(() => {
                            const Icon = Icons.categoryIcons[product.mainCategory as keyof typeof Icons.categoryIcons] || Icons.Package;
                            return <Icon className="w-12 h-12 text-gray-400" />;
                          })()}
                        </div>
                      </div>
                      <span className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-bold">
                        -15%
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-primary">
                          {product.promoPrice?.toLocaleString('fr-FR')} F
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          {product.price.toLocaleString('fr-FR')} F
                        </span>
                      </div>
                    </div>
                  </Link>
                  <button className="btn-accent w-full mt-3 text-sm flex-shrink-0">
                    Ajouter au panier
                  </button>
                </div>
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
                Sélection rigoureuse de produits frais et de marques reconnues
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
    </div>
  );
}