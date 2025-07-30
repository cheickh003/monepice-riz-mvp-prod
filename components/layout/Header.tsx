'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/lib/stores/cartStore';
import CartDrawer from '@/components/cart/CartDrawer';
import { MapPin, Truck, Search, ShoppingCart, User, Menu, X, ChevronRight } from 'lucide-react';
import * as Icons from '@/lib/icons';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Header disparaît quand on scroll vers le bas et réapparaît quand on scroll vers le haut
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className={`sticky top-0 z-50 bg-white shadow-sm transition-transform duration-300 ${
      isScrolled ? '-translate-y-full' : 'translate-y-0'
    }`}>
      {/* Bannière supérieure défilante */}
      <div className="bg-gradient-to-r from-accent via-tertiary to-accent text-gray-900 py-2 overflow-hidden">
        <div className="flex animate-scroll whitespace-nowrap">
          <div className="flex items-center space-x-8 px-4">
            <span className="flex items-center text-sm font-medium">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              Votre épicerie de confiance à Abidjan
            </span>
            <span className="text-sm">•</span>
            <span className="flex items-center text-sm font-medium">
              <Truck className="w-4 h-4 mr-2 flex-shrink-0" />
              Livraison en 3h ou retrait gratuit
            </span>
            <span className="text-sm">•</span>
            <span className="text-sm font-medium">
              Commande minimum: 5 000 F
            </span>
            <span className="text-sm">•</span>
            <span className="text-sm font-medium">
              Frais de livraison: 1 500 F
            </span>
          </div>
          {/* Duplication pour effet loop continu */}
          <div className="flex items-center space-x-8 px-4">
            <span className="flex items-center text-sm font-medium">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              Votre épicerie de confiance à Abidjan
            </span>
            <span className="text-sm">•</span>
            <span className="flex items-center text-sm font-medium">
              <Truck className="w-4 h-4 mr-2 flex-shrink-0" />
              Livraison en 3h ou retrait gratuit
            </span>
            <span className="text-sm">•</span>
            <span className="text-sm font-medium">
              Commande minimum: 5 000 F
            </span>
            <span className="text-sm">•</span>
            <span className="text-sm font-medium">
              Frais de livraison: 1 500 F
            </span>
          </div>
        </div>
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
                <Search className="w-5 h-5" />
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
              <User className="w-6 h-6" />
              <span className="hidden lg:inline text-sm font-medium">Mon compte</span>
            </Link>

            {/* Panier */}
            <button
              className="relative flex items-center space-x-2 text-gray-700 hover:text-primary transition-colors"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="hidden lg:inline text-sm font-medium">Panier</span>
              {/* Badge nombre d'articles */}
              {mounted && totalItems > 0 && (
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
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Navigation catégories - Desktop uniquement */}
      <nav className="hidden md:block bg-gray-50 border-t border-gray-200">
        <div className="container-app">
          <ul className="flex items-center justify-center space-x-8 py-4">
            <li>
              <Link
                href="/products/frais"
                className={`group flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
                  pathname === '/products/frais' ? 'text-primary bg-white shadow-sm' : 'text-gray-600 hover:text-primary'
                }`}
              >
                <Icons.Milk className="w-6 h-6" />
                <span className="text-xs font-medium">Frais</span>
              </Link>
            </li>
            <li>
              <Link
                href="/products/sec"
                className={`group flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
                  pathname === '/products/sec' ? 'text-primary bg-white shadow-sm' : 'text-gray-600 hover:text-primary'
                }`}
              >
                <Icons.Package className="w-6 h-6" />
                <span className="text-xs font-medium">Sec</span>
              </Link>
            </li>
            <li>
              <Link
                href="/products/boissons"
                className={`group flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
                  pathname === '/products/boissons' ? 'text-primary bg-white shadow-sm' : 'text-gray-600 hover:text-primary'
                }`}
              >
                <Icons.Droplets className="w-6 h-6" />
                <span className="text-xs font-medium">Boissons</span>
              </Link>
            </li>
            <li>
              <Link
                href="/products/entretien"
                className={`group flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
                  pathname === '/products/entretien' ? 'text-primary bg-white shadow-sm' : 'text-gray-600 hover:text-primary'
                }`}
              >
                <Icons.Sparkles className="w-6 h-6" />
                <span className="text-xs font-medium">Entretien</span>
              </Link>
            </li>
            <li>
              <Link
                href="/products/bebes"
                className={`group flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
                  pathname === '/products/bebes' ? 'text-primary bg-white shadow-sm' : 'text-gray-600 hover:text-primary'
                }`}
              >
                <Icons.Baby className="w-6 h-6" />
                <span className="text-xs font-medium">Bébés</span>
              </Link>
            </li>
            <li>
              <Link
                href="/products/promo"
                className={`group flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm relative ${
                  pathname === '/products/promo' ? 'text-primary bg-white shadow-sm' : 'text-gray-600 hover:text-primary'
                }`}
              >
                <div className="relative">
                  <Icons.Tag className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs px-1.5 py-0.5 rounded-full font-bold leading-none">-15%</span>
                </div>
                <span className="text-xs font-medium">Promo</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Menu mobile overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 animate-fade-in" 
            onClick={() => setIsMenuOpen(false)} 
          />
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl animate-slide-in-right">
            <div className="p-4 border-b">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="absolute right-4 top-4 p-2"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-semibold">Menu</h2>
            </div>
            <nav className="p-4">
              <ul className="space-y-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <li>
                  <Link href="/account" className="flex items-center space-x-3 text-gray-700 hover:text-primary">
                    <User className="w-5 h-5" />
                    <span>Mon compte</span>
                  </Link>
                </li>
                <li>
                  <Link href="/account/orders" className="flex items-center space-x-3 text-gray-700 hover:text-primary">
                    <Icons.Grid3X3 className="w-5 h-5" />
                    <span>Mes commandes</span>
                  </Link>
                </li>
                <li className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Catégories</h3>
                  <ul className="space-y-2">
                    <li>
                      <Link href="/products/frais" className="flex items-center py-2 text-gray-700 hover:text-primary">
                        <Icons.Milk className="w-4 h-4 mr-2" /> Produits Frais
                      </Link>
                    </li>
                    <li>
                      <Link href="/products/sec" className="flex items-center py-2 text-gray-700 hover:text-primary">
                        <Icons.Package className="w-4 h-4 mr-2" /> Produits Secs
                      </Link>
                    </li>
                    <li>
                      <Link href="/products/boissons" className="flex items-center py-2 text-gray-700 hover:text-primary">
                        <Icons.Droplets className="w-4 h-4 mr-2" /> Boissons
                      </Link>
                    </li>
                    <li>
                      <Link href="/products/entretien" className="flex items-center py-2 text-gray-700 hover:text-primary">
                        <Icons.Sparkles className="w-4 h-4 mr-2" /> Hygiène & Entretien
                      </Link>
                    </li>
                    <li>
                      <Link href="/products/bebes" className="flex items-center py-2 text-gray-700 hover:text-primary">
                        <Icons.Baby className="w-4 h-4 mr-2" /> Bébés
                      </Link>
                    </li>
                    <li>
                      <Link href="/products/promo" className="flex items-center py-2 text-gray-700 hover:text-primary">
                        <Icons.Tag className="w-4 h-4 mr-2" /> Promotions
                      </Link>
                    </li>
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