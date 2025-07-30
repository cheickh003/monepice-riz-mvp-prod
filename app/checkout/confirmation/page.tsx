'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCheckoutStore } from '@/lib/stores/checkoutStore';
import { Check, Phone, MessageCircle, Lightbulb, MapPin, Clock } from 'lucide-react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || `MEP${Date.now().toString().slice(-8)}`;
  const { resetCheckout, deliveryMethod, deliveryAddress, customerInfo } = useCheckoutStore();

  useEffect(() => {
    // Reset checkout store after successful order
    resetCheckout();
  }, [resetCheckout]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-lg rounded-lg p-6">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-3">
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          {/* Success Message */}
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Commande confirmée !
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Merci pour votre commande
          </p>
          
          {/* Order Details */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Numéro de commande</span>
              <span className="font-mono font-semibold text-primary">
                {orderNumber}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Date</span>
              <span className="text-sm text-gray-900">
                {new Date().toLocaleString('fr-FR', { 
                  day: '2-digit',
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200 mt-4">
            <p className="text-sm text-gray-600 mb-4">
              Un SMS de confirmation a été envoyé au {customerInfo?.phoneNumber || '+225 XX XX XX XX'}.
            </p>
            
            {/* Delivery Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {deliveryMethod === 'pickup' ? 'Retrait en magasin' : 'Livraison à domicile'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {deliveryMethod === 'pickup' 
                      ? 'Allocodrome, Av. Jean Mermoz, Abidjan'
                      : deliveryAddress?.street || 'Adresse de livraison'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Délai estimé
                  </p>
                  <p className="text-sm text-gray-600">
                    {deliveryMethod === 'pickup' ? '30-45 min' : '45-60 min'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tips Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex space-x-3">
              <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Bon à savoir
                </p>
                <p className="text-sm text-blue-700">
                  Vous pouvez suivre votre commande en temps réel via SMS.
                  {deliveryMethod === 'pickup' && 
                    " Nous vous notifierons dès que votre commande sera prête."
                  }
                </p>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full bg-primary text-white text-center py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Continuer vos achats
            </Link>
            
            <div className="flex items-center justify-center space-x-4 text-sm">
              <a
                href="tel:+2250700000000"
                className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Appeler</span>
              </a>
              
              <a
                href="https://wa.me/2250700000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}