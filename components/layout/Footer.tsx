'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import CartDrawer from '@/components/cart/CartDrawer';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
    <footer className="bg-gray-100 border-t border-gray-200 mt-16">
      <div className="container-app py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-2">
            <Image
              src="/logo.png"
              alt="MonEpice&Riz"
              width={180}
              height={60}
              className="h-12 w-auto mb-4"
            />
            <p className="text-gray-600 text-sm">
              Votre épicerie en ligne à Abidjan. Spécialistes des escargots & crabes 🐌🦀. Livraison rapide en 3h ou retrait gratuit.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm text-gray-700 font-medium flex items-center mb-1">
                  <MapPin className="w-4 h-4 mr-1" /> MonEpice&Riz Cocody
                </p>
                <p className="text-sm text-gray-600 flex items-center">
                  <Phone className="w-4 h-4 mr-1" /> 0161 888 888
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700 font-medium flex items-center mb-1">
                  <MapPin className="w-4 h-4 mr-1" /> MonEpice&Riz Koumassi
                </p>
                <p className="text-sm text-gray-600 flex items-center">
                  <Phone className="w-4 h-4 mr-1" /> 0172 089 090
                </p>
                <p className="text-xs text-gray-500 ml-5">
                  Centre commercial CONDOR, Boulevard du 7 décembre<br />
                  En face du marché Djè Konan
                </p>
              </div>
              <p className="text-sm text-gray-700 flex items-center">
                <Mail className="w-4 h-4 mr-1" /> contact@monepiceriz.ci
              </p>
            </div>
          </div>

          {/* Liens utiles */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Liens utiles</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-primary text-sm transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="text-gray-600 hover:text-primary text-sm transition-colors">
                  Livraison
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-primary text-sm transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-primary text-sm transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Horaires */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Horaires</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Lundi - Samedi: 8h - 20h</li>
              <li>Dimanche: 9h - 18h</li>
              <li className="pt-2 font-medium text-gray-700">
                Livraison disponible tous les jours
              </li>
            </ul>
          </div>
        </div>

        {/* Moyens de paiement */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Moyens de paiement acceptés</h4>
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded border">Orange Money</span>
            <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded border">MTN Money</span>
            <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded border">Moov Money</span>
            <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded border">Wave</span>
            <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded border">Visa/Mastercard</span>
            <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded border">Paiement à la livraison</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} MonEpice&Riz. Tous droits réservés.
          </p>
        </div>
      </div>

    </footer>
    
    
    {/* Cart Drawer */}
    <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}