import Link from 'next/link';
import { categories } from '@/lib/products';
import * as Icons from '@/lib/icons';

export default function ProductsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 to-accent-50 py-12">
        <div className="container-app text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nos Produits
          </h1>
          <p className="text-lg text-gray-700">
            Découvrez notre sélection de produits de qualité
          </p>
        </div>
      </section>

      {/* Bannière promotionnelle pour produits frais */}
      <section className="bg-gradient-to-r from-green-500 to-green-600 text-white py-8">
        <div className="container-app">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              🥩 Nouveau : Sélection du Jour Disponible ! 🐟
            </h2>
            <p className="text-lg opacity-90">
              Boucherie • Poissonnerie • Volaille • Charcuterie
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories
              .filter(cat => ['boucherie', 'poissonnerie', 'volaille', 'charcuterie'].includes(cat.id))
              .map((category) => (
                <Link
                  key={category.id}
                  href={`/products/${category.slug}`}
                  className="bg-white/10 backdrop-blur hover:bg-white/20 rounded-lg p-4 text-center transition-all group"
                >
                  <div className="text-4xl mb-2">
                    {(() => {
                      const Icon = Icons.categoryIcons[category.id as keyof typeof Icons.categoryIcons];
                      return Icon ? <Icon className="w-10 h-10 mx-auto" /> : null;
                    })()}
                  </div>
                  <h3 className="font-semibold group-hover:scale-105 transition-transform">
                    {category.name}
                  </h3>
                  <p className="text-sm opacity-90 mt-1">
                    {category.productCount} produits
                  </p>
                </Link>
              ))}
          </div>
          <div className="text-center mt-6">
            <span className="inline-flex items-center bg-white/20 px-4 py-2 rounded-full text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Livraison express garantie pour toute notre sélection
            </span>
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="py-12">
        <div className="container-app">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products/${category.slug}`}
                className="card hover:scale-[1.02] transition-transform duration-200 group"
              >
                <div className="flex items-start space-x-4">
                  <div className="text-5xl flex-shrink-0">
                    {(() => {
                      const Icon = Icons.categoryIcons[category.id as keyof typeof Icons.categoryIcons];
                      return Icon ? <Icon className="w-12 h-12" /> : null;
                    })()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                      {category.name}
                    </h2>
                    <p className="text-gray-600 text-sm mb-3">
                      {category.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary">
                        {category.productCount} produits
                      </span>
                      <span className="text-primary group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gray-50">
        <div className="container-app text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Besoin d'aide pour vos courses ?
          </h2>
          <p className="text-gray-600 mb-6">
            Notre équipe est là pour vous conseiller et vous accompagner
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:+2250161888888" className="btn-primary">
              <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Appelez-nous
            </a>
            <Link href="/contact" className="btn-outline">
              Contactez-nous
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}