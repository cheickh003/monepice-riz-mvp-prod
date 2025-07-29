import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page non trouvée | MonEpice&Riz',
  description: 'La page que vous recherchez n\'existe pas. Retournez à l\'accueil pour continuer vos achats.',
};

export default function NotFound() {
  const popularCategories = [
    { name: 'Épices & Condiments', href: '/categories/epices-condiments' },
    { name: 'Riz & Céréales', href: '/categories/riz-cereales' },
    { name: 'Légumes Frais', href: '/categories/legumes-frais' },
    { name: 'Fruits Tropicaux', href: '/categories/fruits-tropicaux' },
    { name: 'Produits Locaux', href: '/categories/produits-locaux' },
    { name: 'Boissons', href: '/categories/boissons' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="container-app">
        <div className="max-w-2xl mx-auto text-center">
          {/* Logo/Brand Section */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-primary to-tertiary rounded-full mb-6">
              <span className="text-3xl font-bold text-white">M&R</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Oops! Page introuvable
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              La page que vous recherchez n'existe pas ou a été déplacée.
              <br />
              Pas de souci, nous allons vous aider à retrouver votre chemin !
            </p>
          </div>

          {/* Error Code */}
          <div className="mb-12">
            <span className="inline-block text-8xl md:text-9xl font-bold bg-gradient-to-r from-primary via-tertiary to-accent bg-clip-text text-transparent">
              404
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/" className="btn-primary inline-flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Retour à l'accueil
            </Link>
            
            <Link href="/search" className="btn-outline inline-flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Rechercher un produit
            </Link>
          </div>

          {/* Popular Categories */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Explorez nos catégories populaires
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {popularCategories.map((category) => (
                <Link
                  key={category.name}
                  href={category.href}
                  className="group p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-50 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-primary"
                >
                  <span className="group-hover:underline">{category.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-12 p-6 bg-gradient-to-r from-accent-50 to-tertiary-50 rounded-xl border border-accent-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Besoin d'aide ?
            </h3>
            <p className="text-gray-600 mb-4">
              Notre équipe est là pour vous accompagner dans vos achats.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                href="/contact" 
                className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Nous contacter
              </Link>
              
              <a 
                href="tel:+2250707000000" 
                className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Appeler
              </a>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-sm text-gray-500">
            <p>
              MonEpice&Riz - Votre épicerie en ligne à Abidjan
              <br />
              Livraison en 3h ou retrait gratuit à Cocody Danga
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}