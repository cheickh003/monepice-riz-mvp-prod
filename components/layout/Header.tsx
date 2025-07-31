'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/lib/stores/cartStore';
import CartDrawer from '@/components/cart/CartDrawer';
import { MapPin, Truck, Search, ShoppingCart, User, Menu, X } from 'lucide-react';
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
              Livraison express ou retrait gratuit
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
              Livraison express ou retrait gratuit
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

            {/* Menu mobile - Hamburger minimaliste */}
            <button
              className="md:hidden relative w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              <div className="relative w-6 h-5 flex flex-col justify-between">
                <span className={`block w-full h-0.5 bg-gray-700 transform transition-all duration-300 ease-out origin-left ${
                  isMenuOpen ? 'rotate-45 translate-x-[2px]' : ''
                }`}></span>
                <span className={`block w-full h-0.5 bg-gray-700 transition-all duration-300 ease-out ${
                  isMenuOpen ? 'opacity-0 scale-x-0' : ''
                }`}></span>
                <span className={`block w-full h-0.5 bg-gray-700 transform transition-all duration-300 ease-out origin-left ${
                  isMenuOpen ? '-rotate-45 translate-x-[2px]' : ''
                }`}></span>
              </div>
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
                <span className="text-xs font-medium">Laitiers</span>
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
                href="/products/epices"
                className={`group flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
                  pathname === '/products/epices' ? 'text-primary bg-white shadow-sm' : 'text-gray-600 hover:text-primary'
                }`}
              >
                <Icons.Star className="w-6 h-6" />
                <span className="text-xs font-medium">Épices</span>
              </Link>
            </li>
            <li>
              <Link
                href="/products/petits-fumes"
                className={`group flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm ${
                  pathname === '/products/petits-fumes' ? 'text-primary bg-white shadow-sm' : 'text-gray-600 hover:text-primary'
                }`}
              >
                <Icons.Zap className="w-6 h-6" />
                <span className="text-xs font-medium">Fumées</span>
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

      {/* Menu mobile overlay - Plein écran adaptatif */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[9999] md:hidden">
          {/* Menu Panel plein écran avec vh/vw */}
          <div className="fixed top-0 left-0 w-screen h-screen bg-white animate-menu-fade overflow-hidden" style={{width: '100vw', height: '100vh', minHeight: '-webkit-fill-available'}}>
            {/* Header minimaliste */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-100">
              <h2 className="text-lg sm:text-xl font-light tracking-wide text-gray-900">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="group relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="relative w-5 h-5 sm:w-6 sm:h-6">
                  <span className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-600 transform -translate-y-1/2 rotate-45 transition-transform duration-200 group-hover:rotate-[50deg]"></span>
                  <span className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-600 transform -translate-y-1/2 -rotate-45 transition-transform duration-200 group-hover:-rotate-[50deg]"></span>
                </div>
              </button>
            </div>
            
            {/* Navigation minimaliste avec hauteur adaptative */}
            <nav className="px-4 sm:px-6 py-6 sm:py-8 overflow-y-auto bg-white" style={{height: 'calc(100vh - 65px)'}}>
              {/* Compte section */}
              <div className="mb-10">
                <Link 
                  href="/account" 
                  className="group flex items-center space-x-3 sm:space-x-4 py-2.5 sm:py-3 transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-200">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-primary transition-colors duration-200" />
                  </div>
                  <span className="text-sm sm:text-base text-gray-700 group-hover:text-gray-900 transition-colors duration-200">Mon compte</span>
                </Link>
                
                <Link 
                  href="/account/orders" 
                  className="group flex items-center space-x-3 sm:space-x-4 py-2.5 sm:py-3 transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-200">
                    <Icons.Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-primary transition-colors duration-200" />
                  </div>
                  <span className="text-sm sm:text-base text-gray-700 group-hover:text-gray-900 transition-colors duration-200">Mes commandes</span>
                </Link>
              </div>
              
              {/* Catégories */}
              <div>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Catégories</h3>
                <ul className="space-y-1">
                  {[
                    { href: '/products/frais', icon: Icons.Milk, label: 'Laitiers' },
                    { href: '/products/sec', icon: Icons.Package, label: 'Produits Secs' },
                    { href: '/products/boissons', icon: Icons.Droplets, label: 'Boissons' },
                    { href: '/products/entretien', icon: Icons.Sparkles, label: 'Hygiène & Entretien' },
                    { href: '/products/bebes', icon: Icons.Baby, label: 'Bébés' },
                    { href: '/products/epices', icon: Icons.Star, label: 'Épices' },
                    { href: '/products/petits-fumes', icon: Icons.Zap, label: 'Les petits fumées' },
                  ].map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="group flex items-center space-x-2.5 sm:space-x-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-gray-50 transition-all duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-primary transition-colors duration-200" />
                        <span className="text-sm sm:text-base text-gray-700 group-hover:text-gray-900 transition-colors duration-200">{item.label}</span>
                      </Link>
                    </li>
                  ))}
                  
                  {/* Promotions avec badge */}
                  <li>
                    <Link
                      href="/products/promo"
                      className="group flex items-center space-x-2.5 sm:space-x-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg hover:bg-primary/5 transition-all duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icons.Tag className="w-4 h-4 sm:w-5 sm:h-5 text-primary group-hover:text-primary-600 transition-colors duration-200" />
                      <span className="text-sm sm:text-base text-gray-700 group-hover:text-gray-900 transition-colors duration-200">Promotions</span>
                      <span className="ml-auto text-xs bg-primary text-white px-1.5 sm:px-2 py-0.5 rounded-full">-15%</span>
                    </Link>
                  </li>
                </ul>
              </div>
              
              {/* Contact info */}
              <div className="mt-10 pt-10 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Service client<br />
                  <a href="tel:+2250700000000" className="text-gray-700 hover:text-primary transition-colors duration-200">
                    +225 07 00 00 00 00
                  </a>
                </p>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}