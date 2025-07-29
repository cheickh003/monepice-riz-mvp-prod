import Link from 'next/link';
import { categories } from '@/lib/products';

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
                  <div className="text-5xl flex-shrink-0">{category.icon}</div>
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
            <a href="tel:+2250700000000" className="btn-primary">
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