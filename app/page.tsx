import Link from 'next/link';
import { categories, getFeaturedProducts, getPromoProducts } from '@/lib/products';
import { ShoppingCart, MapPin, Truck, CheckCircle, CreditCard, Zap } from 'lucide-react';
import * as Icons from '@/lib/icons';

export default function Home() {
  const featuredProducts = getFeaturedProducts(8);
  const promoProducts = getPromoProducts(8);

  return (
    <div className="min-h-screen">
      {/* Hero Section avec localisation */}
      <section className="bg-gradient-to-br from-primary-50 to-accent-50 py-8 md:py-12">
        <div className="container-app">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Bienvenue chez MonEpice&Riz
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-6">
              Votre épicerie de confiance à <span className="font-semibold text-primary">Abidjan</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products" className="btn-primary inline-flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Commencer mes courses
              </Link>
              <Link href="/delivery" className="btn-outline">
                En savoir plus sur la livraison
              </Link>
            </div>
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
              <div key={product.id} className="text-center">
                <Link href={`/product/${product.slug}`} className="block group">
                  <div className="w-full aspect-square bg-white rounded-lg shadow-sm overflow-hidden mb-2 group-hover:shadow-md transition-shadow">
                    <div className="w-full h-full flex items-center justify-center p-4">
                      {(() => {
                        const Icon = Icons.categoryIcons[product.mainCategory as keyof typeof Icons.categoryIcons] || Icons.Package;
                        return <Icon className="w-8 h-8 text-gray-400" />;
                      })()}
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm font-bold text-primary mt-1">
                    {product.price.toLocaleString('fr-FR')} F
                  </p>
                </Link>
                <button className="btn-primary text-xs py-2 px-3 mt-2 w-full">
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
                <div key={product.id} className="card group">
                  <Link href={`/product/${product.slug}`}>
                    <div className="relative">
                      <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
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
                  </Link>
                  <button className="btn-accent w-full mt-3 text-sm">
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
                Recevez vos courses en 3h maximum dans tout Abidjan
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