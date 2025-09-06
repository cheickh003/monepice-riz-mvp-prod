'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCheckoutStore } from '@/lib/stores/checkoutStore';
import { useCartStore } from '@/lib/stores/cartStore';
import Image from 'next/image';
export default function PaymentPage() {
  const router = useRouter();
  const { items, getCart, getTotalWithDelivery } = useCartStore();
  const {
    customerInfo,
    deliveryMethod,
    deliverySlot,
    paymentMethod,
    setPaymentMethod,
    mobileMoneyProvider,
    setMobileMoneyProvider,
  } = useCheckoutStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [totalCalculation, setTotalCalculation] = useState<{
    total: number;
    roundedTotal: number;
  } | null>(null);
  const [cartData, setCartData] = useState<{
    subtotal: number;
    preparationFee: number;
  } | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Redirect if no delivery info
  useEffect(() => {
    if (items.length === 0 || !deliverySlot) {
      router.push('/checkout');
    }
  }, [items, deliverySlot, router]);

  // Set client flag and calculate total on client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
    const cart = getCart();
    setCartData({
      subtotal: cart.subtotal,
      preparationFee: cart.preparationFee,
    });
    const calc = getTotalWithDelivery(deliveryMethod, deliverySlot?.price || 0);
    setTotalCalculation(calc);
  }, [deliveryMethod, deliverySlot?.price, getTotalWithDelivery, getCart]);

  const handlePayment = async () => {
    if (paymentMethod === 'mobile_money' && !mobileMoneyProvider) {
      alert('Veuillez sélectionner un opérateur Mobile Money');
    } else {
      // Initiate real CinetPay payment
      await initiateCinetPayPayment();
    }
  };

  const initiateCinetPayPayment = async () => {
    try {
      setIsProcessing(true);

      // Generate order number
      const orderNumber = `MEP${Date.now().toString().slice(-8)}`;

      // Use calculated total from state
      if (!isClient || !totalCalculation) {
        throw new Error('Calcul du total en cours...');
      }

      // Use rounded total for CinetPay
      const totalAmount = totalCalculation.roundedTotal;

      // Prepare payment payload
      const paymentPayload = {
        orderNumber,
        amount: totalAmount,
        currency: 'XOF',
        paymentMethod,
        channel: paymentMethod === 'mobile_money' ? 'MOBILE_MONEY' : 'CREDIT_CARD',
        customer: {
          fullName: customerInfo.fullName,
          email: customerInfo.email,
          phoneNumber: customerInfo.phoneNumber,
        },
        returnPath: '/checkout/processing',
      };

      // Call our API to initiate CinetPay payment
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Erreur lors de l\'initiation du paiement');
      }

      // Redirect to CinetPay payment page
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        throw new Error('URL de paiement non reçue');
      }

    } catch (error) {
      console.error('Erreur de paiement:', error);
      alert(`Erreur lors de l'initiation du paiement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setIsProcessing(false);
    }
  };




  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="container-app py-4">
          <div className="flex items-center justify-center space-x-4">
            <Link href="/checkout" className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-bold">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Panier</span>
            </Link>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <Link href="/checkout/delivery" className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-bold">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Livraison</span>
            </Link>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full text-sm font-bold">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Paiement</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-app py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Paiement</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Méthodes de paiement */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Choisissez votre mode de paiement</h2>

              {/* Mobile Money */}
              <div className="space-y-4">
                <label className="block">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mobile_money"
                      checked={paymentMethod === 'mobile_money'}
                      onChange={() => setPaymentMethod('mobile_money')}
                    />
                    <div className="flex-1">
                      <p className="font-medium">Mobile Money</p>
                      <p className="text-sm text-gray-600">Orange, MTN, Moov, Wave</p>
                    </div>
                  </div>
                </label>

                {paymentMethod === 'mobile_money' && (
                  <div className="ml-12 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'orange', name: 'Orange Money', logo: '/images/payment-logos/logo orange money.png' },
                      { id: 'mtn', name: 'MTN Money', logo: '/images/payment-logos/mtn money.png' },
                      { id: 'moov', name: 'Moov Money', logo: '/images/payment-logos/logo moov money.webp' },
                      { id: 'wave', name: 'Wave', logo: '/images/payment-logos/Logo vague.png' },
                    ].map((provider) => (
                      <label
                        key={provider.id}
                        className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          mobileMoneyProvider === provider.id
                            ? 'border-primary bg-primary-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="mobileMoneyProvider"
                          value={provider.id}
                          checked={mobileMoneyProvider === provider.id}
                          onChange={() => setMobileMoneyProvider(provider.id as 'orange' | 'mtn' | 'moov' | 'wave')}
                          className="sr-only"
                        />
                        <div className="w-12 h-12 mb-1 relative">
                          <Image
                            src={provider.logo}
                            alt={provider.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <span className="text-xs text-center">{provider.name}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Card Payment */}
                <label className="block">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                    />
                    <div className="flex-1">
                      <p className="font-medium">Carte bancaire</p>
                      <p className="text-sm text-gray-600">Visa, Mastercard</p>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-8 h-5 relative">
                        <Image
                          src="/images/payment-logos/visa logo.webp"
                          alt="Visa"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="w-8 h-5 relative">
                        <Image
                          src="/images/payment-logos/Logo Mastercard.svg"
                          alt="Mastercard"
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </label>

                {paymentMethod === 'card' && (
                  <div className="ml-12 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm">
                        <p className="font-medium text-blue-900">Saisie sécurisée</p>
                        <p className="text-blue-700">
                          Vous serez redirigé vers la plateforme sécurisée de CinetPay pour saisir vos informations de carte bancaire.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Informations de sécurité */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Paiement 100% sécurisé</p>
                  <p className="text-blue-700">
                    Vos informations de paiement sont protégées et ne sont jamais stockées sur nos serveurs.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Résumé de commande */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h3 className="font-semibold mb-4">Résumé de la commande</h3>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{isClient && cartData ? cartData.subtotal.toLocaleString('fr-FR') : '0'} F</span>
                </div>
                <div className="flex justify-between">
                  <span>Livraison</span>
                  <span>
                    {deliveryMethod === 'pickup'
                      ? 'Gratuit'
                      : `${(deliverySlot?.price || 0).toLocaleString('fr-FR')} F`
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Frais de préparation</span>
                  <span>{isClient && cartData ? cartData.preparationFee.toLocaleString('fr-FR') : '0'} F</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total à payer</span>
                    <span className="text-primary">
                      {isClient ? (totalCalculation?.total || 0).toLocaleString('fr-FR') : '0'} F CFA
                    </span>
                  </div>
                  {isClient && (paymentMethod === 'mobile_money' || paymentMethod === 'card') && totalCalculation && (() => {
                    const rounded = totalCalculation.roundedTotal;
                    const original = totalCalculation.total;
                    return rounded !== original ? (
                      <div className="text-xs text-gray-500 mt-2">
                        * Montant arrondi: {rounded.toLocaleString('fr-FR')} F CFA (au lieu de {original.toLocaleString('fr-FR')} F CFA)
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing || !isClient || !totalCalculation}
                className="btn-primary w-full"
              >
                {isProcessing ? 'Traitement...' : !isClient || !totalCalculation ? 'Chargement...' : 'Confirmer et payer'}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                En confirmant, vous acceptez nos conditions générales de vente
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
