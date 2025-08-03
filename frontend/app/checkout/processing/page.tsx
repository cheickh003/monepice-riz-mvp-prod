'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/lib/stores/cartStore';
import { useCheckoutStore } from '@/lib/stores/checkoutStore';
import { CheckCircle, Loader2, ShoppingBag, CreditCard, Truck } from 'lucide-react';

function ProcessingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || `MEP${Date.now().toString().slice(-8)}`;
  const { clearCart } = useCartStore();
  const { resetCheckout } = useCheckoutStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    {
      icon: CreditCard,
      title: "Validation du paiement",
      subtitle: "Vérification de votre transaction...",
      duration: 2000
    },
    {
      icon: ShoppingBag,
      title: "Confirmation de commande",
      subtitle: "Enregistrement de votre commande...",
      duration: 1500
    },
    {
      icon: Truck,
      title: "Préparation en cours",
      subtitle: "Transmission à notre équipe...",
      duration: 1500
    }
  ];

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    let totalDuration = 0;

    const stepData = [
      {
        icon: CreditCard,
        title: "Validation du paiement",
        subtitle: "Vérification de votre transaction...",
        duration: 2000
      },
      {
        icon: ShoppingBag,
        title: "Confirmation de commande",
        subtitle: "Enregistrement de votre commande...",
        duration: 1500
      },
      {
        icon: Truck,
        title: "Préparation en cours",
        subtitle: "Transmission à notre équipe...",
        duration: 1500
      }
    ];

    stepData.forEach((step, index) => {
      const timeout = setTimeout(() => {
        setCurrentStep(index);
      }, totalDuration);
      
      timeouts.push(timeout);
      totalDuration += step.duration;
    });

    // Final step - completion
    const completionTimeout = setTimeout(() => {
      setIsComplete(true);
      // Clear cart and checkout data
      clearCart();
      resetCheckout();
      
      // Redirect to confirmation after showing success
      setTimeout(() => {
        router.push(`/checkout/confirmation?order=${orderNumber}`);
      }, 1500);
    }, totalDuration);

    timeouts.push(completionTimeout);

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [clearCart, resetCheckout, router, orderNumber]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-4">
              <ShoppingBag className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Traitement en cours
            </h1>
            <p className="text-gray-600">
              Commande #{orderNumber}
            </p>
          </div>

          {!isComplete ? (
            <>
              {/* Current Step */}
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4 animate-pulse">
                  {currentStep < steps.length && (
                    <>
                      {steps[currentStep].icon === CreditCard && <CreditCard className="w-8 h-8 text-primary" />}
                      {steps[currentStep].icon === ShoppingBag && <ShoppingBag className="w-8 h-8 text-primary" />}
                      {steps[currentStep].icon === Truck && <Truck className="w-8 h-8 text-primary" />}
                    </>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {currentStep < steps.length ? steps[currentStep].title : "Finalisation..."}
                </h2>
                <p className="text-gray-600">
                  {currentStep < steps.length ? steps[currentStep].subtitle : "Dernières vérifications..."}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary to-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${((currentStep + 1) / steps.length) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Étape {Math.min(currentStep + 1, steps.length)} sur {steps.length}
                </p>
              </div>

              {/* Loading Spinner */}
              <div className="flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>

              {/* Steps List */}
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div 
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                      index <= currentStep 
                        ? 'bg-primary-50 border border-primary-200' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      index < currentStep
                        ? 'bg-green-500 text-white'
                        : index === currentStep
                        ? 'bg-primary text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {index < currentStep ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : index === currentStep ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${
                        index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Success State */
            <div className="animate-fade-in">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Commande confirmée !
              </h2>
              <p className="text-gray-600 mb-6">
                Votre commande a été traitée avec succès.
                <br />
                Redirection en cours...
              </p>
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Fun Fact */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            💡 Saviez-vous ? Nos équipes préparent en moyenne 150 commandes par jour !
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <ProcessingContent />
    </Suspense>
  );
}