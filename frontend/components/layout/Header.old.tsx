'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/lib/stores/cartStore';
import CartDrawer from '@/components/cart/CartDrawer';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.getTotalItems());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Bannière supérieure */}
      <div className="bg-gradient-to-r from-accent via-tertiary to-accent text-gray-900 py-2 px-4 text-center text-sm font-medium">
        <p>📍 Abidjan Cocody Saint-Jean • 🚚 Livraison en 3h ou retrait gratuit Cocody Danga</p>
      </div>

      {/* Header principal */}
      <div className="container-app">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt="MonEpice&Riz"
              width={180}
              height={60}
              className="h-12 w-auto"
              priority
            />
          </Link>

          {/* Barre de recherche (desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un produit..."
                className="input-field pr-12"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-4 text-primary hover:text-primary-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Compte */}
            <Link
              href="/account"
              className="hidden sm:flex items-center space-x-2 text-gray-700 hover:text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden lg:inline text-sm font-medium">Mon compte</span>
            </Link>

            {/* Panier */}
            <button
              className="relative flex items-center space-x-2 text-gray-700 hover:text-primary transition-colors"
              onClick={() => setIsCartOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden lg:inline text-sm font-medium">Panier</span>
              {/* Badge nombre d'articles */}
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Menu mobile */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Barre de recherche (mobile) */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un produit..."
              className="input-field pr-12 text-sm"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 h-full px-4 text-primary hover:text-primary-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Navigation catégories */}
      <nav className="border-t border-gray-200">
        <div className="container-app">
          <ul className="flex items-center space-x-8 py-3 overflow-x-auto scrollbar-hide">
            <li>
              <Link
                href="/products/frais"
                className={`whitespace-nowrap text-sm font-medium transition-colors ${
                  pathname === '/products/frais' ? 'text-primary' : 'text-gray-700 hover:text-primary'
                }`}
              >
                🥛 Frais
              </Link>
            </li>
            <li>
              <Link
                href="/products/sec"
                className={`whitespace-nowrap text-sm font-medium transition-colors ${
                  pathname === '/products/sec' ? 'text-primary' : 'text-gray-700 hover:text-primary'
                }`}
              >
                🥖 Sec
              </Link>
            </li>
            <li>
              <Link
                href="/products/boissons"
                className={`whitespace-nowrap text-sm font-medium transition-colors ${
                  pathname === '/products/boissons' ? 'text-primary' : 'text-gray-700 hover:text-primary'
                }`}
              >
                🥤 Boissons
              </Link>
            </li>
            <li>
              <Link
                href="/products/entretien"
                className={`whitespace-nowrap text-sm font-medium transition-colors ${
                  pathname === '/products/entretien' ? 'text-primary' : 'text-gray-700 hover:text-primary'
                }`}
              >
                🧼 Entretien
              </Link>
            </li>
            <li>
              <Link
                href="/products/bebes"
                className={`whitespace-nowrap text-sm font-medium transition-colors ${
                  pathname === '/products/bebes' ? 'text-primary' : 'text-gray-700 hover:text-primary'
                }`}
              >
                👶 Bébés
              </Link>
            </li>
            <li>
              <Link
                href="/products/promo"
                className={`whitespace-nowrap text-sm font-medium transition-colors ${
                  pathname === '/products/promo' ? 'text-primary' : 'text-gray-700 hover:text-primary'
                }`}
              >
                <span className="flex items-center space-x-1">
                  <span>🏷️ Promo</span>
                  <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">-15%</span>
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Menu mobile overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl">
            <div className="p-4 border-b">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="absolute right-4 top-4 p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold">Menu</h2>
            </div>
            <nav className="p-4">
              <ul className="space-y-4">
                <li>
                  <Link href="/account" className="flex items-center space-x-3 text-gray-700 hover:text-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Mon compte</span>
                  </Link>
                </li>
                <li>
                  <Link href="/account/orders" className="flex items-center space-x-3 text-gray-700 hover:text-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Mes commandes</span>
                  </Link>
                </li>
                <li className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Catégories</h3>
                  <ul className="space-y-2">
                    <li><Link href="/products/frais" className="block py-2 text-gray-700 hover:text-primary">🥛 Produits Frais</Link></li>
                    <li><Link href="/products/sec" className="block py-2 text-gray-700 hover:text-primary">🥖 Produits Secs</Link></li>
                    <li><Link href="/products/boissons" className="block py-2 text-gray-700 hover:text-primary">🥤 Boissons</Link></li>
                    <li><Link href="/products/entretien" className="block py-2 text-gray-700 hover:text-primary">🧼 Hygiène & Entretien</Link></li>
                    <li><Link href="/products/bebes" className="block py-2 text-gray-700 hover:text-primary">👶 Bébés</Link></li>
                    <li><Link href="/products/promo" className="block py-2 text-gray-700 hover:text-primary">🏷️ Promotions</Link></li>
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}