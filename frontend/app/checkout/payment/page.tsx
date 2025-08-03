'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCheckoutStore } from '@/lib/stores/checkoutStore';
import { useCartStore } from '@/lib/stores/cartStore';
import { CheckCircle, XCircle } from 'lucide-react';

export default function PaymentPage() {
  const router = useRouter();
  const { items, getCart } = useCartStore();
  const cart = getCart();
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
  const [showPaymentSimulation, setShowPaymentSimulation] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'init' | 'otp' | 'processing' | 'success' | 'error'>('init');
  const [otpCode, setOtpCode] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  // Redirect if no delivery info
  useEffect(() => {
    if (items.length === 0 || !deliverySlot) {
      router.push('/checkout');
    }
  }, [items, deliverySlot, router]);

  const handlePayment = () => {
    if (paymentMethod === 'cash_on_delivery' || paymentMethod === 'cash_on_order') {
      // Direct confirmation for cash payments
      completeOrder();
    } else if (paymentMethod === 'mobile_money' && !mobileMoneyProvider) {
      alert('Veuillez sélectionner un opérateur Mobile Money');
    } else {
      // Simulate payment process
      setShowPaymentSimulation(true);
      setPaymentStep('init');
    }
  };

  const simulatePaymentProcess = () => {
    setIsProcessing(true);
    setPaymentStep('otp');
  };

  const verifyOTP = () => {
    if (otpCode.length !== 6) {
      alert('Le code OTP doit contenir 6 chiffres');
      return;
    }

    setPaymentStep('processing');
    
    // Simulate processing
    setTimeout(() => {
      // Random success/failure (90% success rate)
      if (Math.random() > 0.1) {
        setPaymentStep('success');
        setTimeout(() => {
          completeOrder();
        }, 2000);
      } else {
        setPaymentStep('error');
      }
    }, 3000);
  };

  const completeOrder = () => {
    // Generate order number
    const orderNumber = `MEP${Date.now().toString().slice(-8)}`;
    
    // Redirect to processing page (cart will be cleared there)
    router.push(`/checkout/processing?order=${orderNumber}`);
  };

  const getMobileMoneyLogo = (provider: string) => {
    switch (provider) {
      case 'orange':
        return '/images/payment-logos/logo orange money.png';
      case 'mtn':
        return '/images/payment-logos/mtn money.png';
      case 'moov':
        return '/images/payment-logos/logo moov money.webp';
      case 'wave':
        return '/images/payment-logos/Logo vague.png';
      default:
        return '/images/payment-logos/logo moov money.webp';
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
                  <div className="ml-12 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro de carte
                      </label>
                      <input
                        type="text"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                        className="input-field"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom sur la carte
                      </label>
                      <input
                        type="text"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                        className="input-field"
                        placeholder="JEAN KOUADIO"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date d'expiration
                        </label>
                        <input
                          type="text"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                          className="input-field"
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                          className="input-field"
                          placeholder="123"
                          maxLength={3}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Cash on Delivery */}
                <label className="block">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash_on_delivery"
                      checked={paymentMethod === 'cash_on_delivery'}
                      onChange={() => setPaymentMethod('cash_on_delivery')}
                    />
                    <div className="flex-1">
                      <p className="font-medium">Paiement à la livraison</p>
                      <p className="text-sm text-gray-600">Payez en espèces à la réception</p>
                    </div>
                    <span className="text-2xl">💵</span>
                  </div>
                </label>

                {/* Cash on Order */}
                <label className="block">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash_on_order"
                      checked={paymentMethod === 'cash_on_order'}
                      onChange={() => setPaymentMethod('cash_on_order')}
                    />
                    <div className="flex-1">
                      <p className="font-medium">Paiement à la commande</p>
                      <p className="text-sm text-gray-600">Payez en espèces lors de la préparation de votre commande</p>
                    </div>
                    <span className="text-2xl">💰</span>
                  </div>
                </label>
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
                  <span>{cart.subtotal.toLocaleString('fr-FR')} F</span>
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
                  <span>{cart.preparationFee.toLocaleString('fr-FR')} F</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total à payer</span>
                    <span className="text-primary">
                      {(cart.total + (deliverySlot?.price || 0) - cart.deliveryFee).toLocaleString('fr-FR')} F CFA
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="btn-primary w-full"
              >
                {isProcessing ? 'Traitement...' : 'Confirmer et payer'}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                En confirmant, vous acceptez nos conditions générales de vente
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Simulation Modal */}
      {showPaymentSimulation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              {/* CinetPay Logo Simulation */}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500 text-white rounded-full text-3xl font-bold">
                  CP
                </div>
                <h3 className="text-xl font-semibold mt-3">CinetPay</h3>
              </div>

              {paymentStep === 'init' && (
                <>
                  <p className="text-gray-600 mb-6">
                    Montant à payer: <span className="font-bold">{(cart.total + (deliverySlot?.price || 0) - cart.deliveryFee).toLocaleString('fr-FR')} F CFA</span>
                  </p>
                  {paymentMethod === 'mobile_money' && (
                    <div className="mb-6">
                      <p className="text-sm text-gray-600 mb-2">Paiement via:</p>
                      <div className="w-16 h-16 relative mx-auto mb-2">
                        <Image
                          src={getMobileMoneyLogo(mobileMoneyProvider || '')}
                          alt={`${mobileMoneyProvider} logo`}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <p className="font-medium capitalize">{mobileMoneyProvider?.replace('_', ' ')}</p>
                    </div>
                  )}
                  <button
                    onClick={simulatePaymentProcess}
                    className="btn-primary w-full"
                  >
                    Procéder au paiement
                  </button>
                </>
              )}

              {paymentStep === 'otp' && (
                <>
                  <p className="text-gray-600 mb-6">
                    Un code de validation a été envoyé au <strong>{customerInfo.phoneNumber}</strong>
                  </p>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="input-field text-center text-2xl font-bold mb-6"
                    placeholder="000000"
                    maxLength={6}
                  />
                  <button
                    onClick={verifyOTP}
                    className="btn-primary w-full"
                  >
                    Valider
                  </button>
                  <p className="text-sm text-gray-500 mt-4">
                    Code de test: 123456
                  </p>
                </>
              )}

              {paymentStep === 'processing' && (
                <>
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-6"></div>
                  <p className="text-gray-600">Traitement en cours...</p>
                </>
              )}

              {paymentStep === 'success' && (
                <>
                  <div className="text-green-500 mb-4">
                    <CheckCircle className="w-16 h-16 mx-auto" />
                  </div>
                  <p className="text-lg font-semibold text-green-600 mb-2">Paiement réussi!</p>
                  <p className="text-gray-600">Redirection en cours...</p>
                </>
              )}

              {paymentStep === 'error' && (
                <>
                  <div className="text-red-500 mb-4">
                    <XCircle className="w-16 h-16 mx-auto" />
                  </div>
                  <p className="text-lg font-semibold text-red-600 mb-2">Échec du paiement</p>
                  <p className="text-gray-600 mb-6">Solde insuffisant ou erreur technique</p>
                  <button
                    onClick={() => {
                      setShowPaymentSimulation(false);
                      setPaymentStep('init');
                      setIsProcessing(false);
                      setOtpCode('');
                    }}
                    className="btn-outline"
                  >
                    Réessayer
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}