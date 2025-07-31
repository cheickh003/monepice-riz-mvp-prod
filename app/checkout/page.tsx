'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/lib/stores/cartStore';
import { useState } from 'react';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import * as Icons from '@/lib/icons';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getCart } = useCartStore();
  const cart = getCart();
  const [isGuest, setIsGuest] = useState(true);

  const getProductIcon = (mainCategory: string) => {
    return Icons.categoryIcons[mainCategory as keyof typeof Icons.categoryIcons] || Icons.Package;
  };

  const handleContinue = () => {
    router.push('/checkout/delivery');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="mx-auto h-24 w-24 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Votre panier est vide</h1>
          <p className="text-gray-600 mb-6">Ajoutez des produits pour continuer</p>
          <Link href="/products" className="btn-primary">
            Commencer mes courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="container-app py-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full text-sm font-bold">
                1
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Panier</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-300 text-gray-600 rounded-full text-sm font-bold">
                2
              </div>
              <span className="ml-2 text-sm text-gray-600">Livraison</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-300 text-gray-600 rounded-full text-sm font-bold">
                3
              </div>
              <span className="ml-2 text-sm text-gray-600">Paiement</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-app py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Récapitulatif de votre commande</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Panier */}
          <div className="lg:col-span-2 space-y-4">
            {/* Option compte */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Comment souhaitez-vous commander ?</h2>
              <div className="space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="accountType"
                    checked={isGuest}
                    onChange={() => setIsGuest(true)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium">Commander en tant qu'invité</p>
                    <p className="text-sm text-gray-600">
                      Commandez rapidement sans créer de compte. Vous pourrez créer un compte après votre commande.
                    </p>
                  </div>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="accountType"
                    checked={!isGuest}
                    onChange={() => setIsGuest(false)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium">Se connecter ou créer un compte</p>
                    <p className="text-sm text-gray-600">
                      Accédez à votre historique de commandes et vos adresses enregistrées.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Liste des produits */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Votre panier ({cart.totalItems} article{cart.totalItems > 1 ? 's' : ''})
                </h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex items-start space-x-4 py-4 border-b last:border-0">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {(() => {
                          const Icon = getProductIcon(item.product.mainCategory);
                          return <Icon className="w-8 h-8 text-gray-400" />;
                        })()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                        {item.product.weight && (
                          <p className="text-sm text-gray-600">{item.product.weight}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-primary"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-primary"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {((item.product.isPromo && item.product.promoPrice ? item.product.promoPrice : item.product.price) * item.quantity).toLocaleString('fr-FR')} F
                            </p>
                            {item.product.isPromo && (
                              <p className="text-sm text-gray-500 line-through">
                                {(item.product.price * item.quantity).toLocaleString('fr-FR')} F
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="text-sm text-primary hover:text-primary-600 mt-2"
                        >
                          Retirer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Résumé commande */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Résumé de la commande</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Sous-total ({cart.totalItems} article{cart.totalItems > 1 ? 's' : ''})</span>
                  <span>{cart.subtotal.toLocaleString('fr-FR')} F</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais de livraison</span>
                  <span>{cart.deliveryFee.toLocaleString('fr-FR')} F</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais de préparation</span>
                  <span>{cart.preparationFee.toLocaleString('fr-FR')} F</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total TTC</span>
                    <span className="text-primary">{cart.total.toLocaleString('fr-FR')} F CFA</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">TVA incluse</p>
                </div>
              </div>

              <button
                onClick={handleContinue}
                className="btn-primary w-full mt-6"
              >
                Continuer vers la livraison
              </button>

              <div className="mt-4 text-center">
                <Link href="/products" className="text-sm text-primary hover:underline">
                  Continuer mes achats
                </Link>
              </div>

              {/* Avantages */}
              <div className="mt-6 pt-6 border-t space-y-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-xs text-gray-600">Livraison en 3h maximum</p>
                </div>
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-xs text-gray-600">Retrait gratuit disponible</p>
                </div>
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-xs text-gray-600">Paiement sécurisé</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}