'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCheckoutStore } from '@/lib/stores/checkoutStore';
import { Check, Phone, MessageCircle, Lightbulb } from 'lucide-react';

export default function ConfirmationPage() {
  // Générer un numéro de commande basé sur le timestamp
  const orderNumber = `MEP${Date.now().toString().slice(-8)}`;
  const { resetCheckout } = useCheckoutStore();

  useEffect(() => {
    // Reset checkout store after successful order
    resetCheckout();
  }, [resetCheckout]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full">
              <Check className="w-12 h-12 text-green-600" />
            </div>
          </div>

          {/* Confirmation Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Commande confirmée!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Merci pour votre commande. Nous préparons vos produits avec soin.
          </p>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Numéro de commande</p>
                <p className="text-2xl font-bold text-primary">{orderNumber}</p>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Un email de confirmation a été envoyé avec tous les détails de votre commande.
                </p>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Prochaines étapes</h2>
            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gray-300"></div>
              
              <div className="space-y-6">
                <div className="relative flex items-center">
                  <div className="flex-1 text-right pr-4">
                    <p className="font-medium">Commande reçue</p>
                    <p className="text-sm text-gray-500">Maintenant</p>
                  </div>
                  <div className="w-4 h-4 bg-green-600 rounded-full z-10"></div>
                  <div className="flex-1"></div>
                </div>

                <div className="relative flex items-center">
                  <div className="flex-1"></div>
                  <div className="w-4 h-4 bg-gray-300 rounded-full z-10"></div>
                  <div className="flex-1 text-left pl-4">
                    <p className="font-medium">Préparation</p>
                    <p className="text-sm text-gray-500">15-30 min</p>
                  </div>
                </div>

                <div className="relative flex items-center">
                  <div className="flex-1 text-right pr-4">
                    <p className="font-medium">En livraison</p>
                    <p className="text-sm text-gray-500">1-2h</p>
                  </div>
                  <div className="w-4 h-4 bg-gray-300 rounded-full z-10"></div>
                  <div className="flex-1"></div>
                </div>

                <div className="relative flex items-center">
                  <div className="flex-1"></div>
                  <div className="w-4 h-4 bg-gray-300 rounded-full z-10"></div>
                  <div className="flex-1 text-left pl-4">
                    <p className="font-medium">Livrée</p>
                    <p className="text-sm text-gray-500">Dans 3h max</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Link
              href="/account/orders"
              className="btn-primary w-full inline-block"
            >
              Suivre ma commande
            </Link>
            
            <Link
              href="/"
              className="btn-outline w-full inline-block"
            >
              Retour à l'accueil
            </Link>
          </div>

          {/* Contact Info */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              Besoin d'aide avec votre commande?
            </p>
            <div className="flex items-center justify-center space-x-6">
              <a href="tel:+2250700000000" className="text-primary hover:underline flex items-center">
                <Phone className="w-4 h-4 mr-1" /> Appelez-nous
              </a>
              <a href="https://wa.me/2250700000000" className="text-primary hover:underline flex items-center">
                <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            <span className="flex items-center justify-center">
              <Lightbulb className="w-4 h-4 mr-1" /> Astuce: Créez un compte pour retrouver facilement vos commandes et accélérer vos prochains achats.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}