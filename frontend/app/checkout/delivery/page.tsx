'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCheckoutStore } from '@/lib/stores/checkoutStore';
import { useCartStore } from '@/lib/stores/cartStore';
import { DeliverySlot, Address } from '@/lib/types';

export default function DeliveryPage() {
  const router = useRouter();
  const { items } = useCartStore();
  const {
    customerInfo,
    setCustomerInfo,
    deliveryAddress,
    setDeliveryAddress,
    deliveryMethod,
    setDeliveryMethod,
    deliverySlot,
    setDeliverySlot,
    deliveryInstructions,
    setDeliveryInstructions,
  } = useCheckoutStore();

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow'>('today');

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/checkout');
    }
  }, [items, router]);

  // Générer les créneaux horaires
  const generateTimeSlots = (date: 'today' | 'tomorrow'): DeliverySlot[] => {
    const slots: DeliverySlot[] = [];
    const now = new Date();
    const isToday = date === 'today';
    const slotDate = isToday ? now : new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Créneaux de 2h de 8h à 20h
    const startHour = isToday && now.getHours() >= 8 ? Math.ceil(now.getHours() / 2) * 2 + 2 : 8;
    
    for (let hour = startHour; hour < 20; hour += 2) {
      // Vérifier si le créneau est dans au moins 3h (pour today)
      if (isToday) {
        const slotTime = new Date(slotDate);
        slotTime.setHours(hour, 0, 0, 0);
        const timeDiff = slotTime.getTime() - now.getTime();
        if (timeDiff < 3 * 60 * 60 * 1000) continue; // Skip if less than 3 hours
      }

      slots.push({
        id: `${date}-${hour}`,
        date: slotDate.toISOString().split('T')[0],
        startTime: `${hour}:00`,
        endTime: `${hour + 2}:00`,
        available: Math.random() > 0.2, // 80% availability
        price: 1500,
      });
    }

    return slots;
  };

  const todaySlots = generateTimeSlots('today');
  const tomorrowSlots = generateTimeSlots('tomorrow');
  const displaySlots = selectedDate === 'today' ? todaySlots : tomorrowSlots;

  // Express delivery slot (always available)
  const expressSlot: DeliverySlot = {
    id: 'express',
    date: new Date().toISOString().split('T')[0],
    startTime: 'Express',
    endTime: '≤3h',
    available: true,
    price: 3000,
    isExpress: true,
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!customerInfo.fullName.trim()) {
      errors.fullName = 'Le nom complet est requis';
    }

    if (!customerInfo.phoneNumber.trim()) {
      errors.phoneNumber = 'Le numéro de téléphone est requis';
    } else if (!/^[0-9]{10}$/.test(customerInfo.phoneNumber.replace(/\s/g, ''))) {
      errors.phoneNumber = 'Le numéro doit contenir 10 chiffres';
    }

    if (deliveryMethod === 'delivery') {
      if (!deliveryAddress?.street.trim()) {
        errors.street = 'L\'adresse est requise';
      }
      if (!deliveryAddress?.zone.trim()) {
        errors.zone = 'Le quartier est requis';
      }
    }

    if (!deliverySlot) {
      errors.slot = 'Veuillez sélectionner un créneau de livraison';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      router.push('/checkout/payment');
    }
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    setDeliveryAddress({
      ...deliveryAddress,
      [field]: value,
    } as Address);
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
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full text-sm font-bold">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">Livraison</span>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Informations de livraison</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Informations client */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Vos coordonnées</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.fullName}
                    onChange={(e) => setCustomerInfo({ fullName: e.target.value })}
                    className={`input-field ${formErrors.fullName ? 'border-red-500' : ''}`}
                    placeholder="Jean Kouadio"
                  />
                  {formErrors.fullName && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (optionnel)
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ email: e.target.value })}
                    className="input-field"
                    placeholder="jean@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone principal *
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phoneNumber}
                    onChange={(e) => setCustomerInfo({ phoneNumber: e.target.value })}
                    className={`input-field ${formErrors.phoneNumber ? 'border-red-500' : ''}`}
                    placeholder="07 XX XX XX XX"
                  />
                  {formErrors.phoneNumber && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.phoneNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone secondaire
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phoneNumberAlt}
                    onChange={(e) => setCustomerInfo({ phoneNumberAlt: e.target.value })}
                    className="input-field"
                    placeholder="05 XX XX XX XX"
                  />
                </div>
              </div>
            </div>

            {/* Mode de réception */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Mode de réception</h2>
              <div className="space-y-3">
                <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="delivery"
                    checked={deliveryMethod === 'delivery'}
                    onChange={() => setDeliveryMethod('delivery')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium">Livraison à domicile</p>
                    <p className="text-sm text-gray-600">
                      Recevez votre commande directement chez vous
                    </p>
                  </div>
                  <span className="text-sm font-medium text-primary">1 500 F</span>
                </label>
                <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="pickup"
                    checked={deliveryMethod === 'pickup'}
                    onChange={() => setDeliveryMethod('pickup')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium">Retrait en boutique</p>
                    <p className="text-sm text-gray-600">
                      Retirez votre commande dans l'un de nos magasins
                    </p>
                  </div>
                  <span className="text-sm font-medium text-green-600">Gratuit</span>
                </label>
              </div>
            </div>

            {/* Adresse de livraison */}
            {deliveryMethod === 'delivery' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Adresse de livraison</h2>
                <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adresse complète *
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress?.street || ''}
                        onChange={(e) => handleAddressChange('street', e.target.value)}
                        className={`input-field ${formErrors.street ? 'border-red-500' : ''}`}
                        placeholder="Rue des Jardins, Immeuble Azur"
                      />
                      {formErrors.street && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.street}</p>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quartier/Zone *
                        </label>
                        <input
                          type="text"
                          value={deliveryAddress?.zone || ''}
                          onChange={(e) => handleAddressChange('zone', e.target.value)}
                          className={`input-field ${formErrors.zone ? 'border-red-500' : ''}`}
                          placeholder="Cocody Saint-Jean"
                        />
                        {formErrors.zone && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.zone}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ville
                        </label>
                        <input
                          type="text"
                          value="Abidjan"
                          disabled
                          className="input-field bg-gray-50"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bâtiment/Villa
                        </label>
                        <input
                          type="text"
                          value={deliveryAddress?.building || ''}
                          onChange={(e) => handleAddressChange('building', e.target.value)}
                          className="input-field"
                          placeholder="Villa 12"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Appartement/Étage
                        </label>
                        <input
                          type="text"
                          value={deliveryAddress?.apartment || ''}
                          onChange={(e) => handleAddressChange('apartment', e.target.value)}
                          className="input-field"
                          placeholder="Apt 3B, 2ème étage"
                        />
                      </div>
                    </div>
                </div>
              </div>
            )}

            {/* Créneaux de livraison */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">
                {deliveryMethod === 'delivery' ? 'Créneau de livraison' : 'Créneau de retrait'}
              </h2>
              
              {/* Express option */}
              {deliveryMethod === 'delivery' && (
                <div className="mb-4">
                  <label
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                      deliverySlot?.id === 'express'
                        ? 'border-primary bg-primary-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="slot"
                        checked={deliverySlot?.id === 'express'}
                        onChange={() => setDeliverySlot(expressSlot)}
                      />
                      <div>
                        <p className="font-medium text-primary">Livraison Express</p>
                        <p className="text-sm text-gray-600">Recevez en moins de 3h</p>
                      </div>
                    </div>
                    <span className="font-medium">{expressSlot.price.toLocaleString('fr-FR')} F</span>
                  </label>
                </div>
              )}

              {/* Date selector */}
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setSelectedDate('today')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    selectedDate === 'today'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Aujourd'hui
                </button>
                <button
                  onClick={() => setSelectedDate('tomorrow')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    selectedDate === 'tomorrow'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Demain
                </button>
              </div>

              {/* Time slots grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {displaySlots.map((slot) => (
                  <label
                    key={slot.id}
                    className={`relative flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      !slot.available
                        ? 'bg-gray-50 cursor-not-allowed opacity-50'
                        : deliverySlot?.id === slot.id
                        ? 'border-primary bg-primary-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="slot"
                      value={slot.id}
                      checked={deliverySlot?.id === slot.id}
                      onChange={() => slot.available && setDeliverySlot(slot)}
                      disabled={!slot.available}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <p className={`font-medium ${!slot.available ? 'text-gray-400' : ''}`}>
                        {slot.startTime} - {slot.endTime}
                      </p>
                      {!slot.available && (
                        <p className="text-xs text-gray-500">Complet</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              {formErrors.slot && (
                <p className="text-red-500 text-sm mt-2">{formErrors.slot}</p>
              )}
            </div>

            {/* Instructions de livraison */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Instructions spéciales (optionnel)</h2>
              <textarea
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                className="input-field min-h-[100px]"
                placeholder="Ex: Sonnez au portail, laisser au gardien si absent..."
              />
            </div>
          </div>

          {/* Résumé latéral */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h3 className="font-semibold mb-4">Récapitulatif</h3>
              
              {/* Adresse sélectionnée */}
              {deliveryMethod === 'delivery' && deliveryAddress?.street && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm font-medium">Adresse de livraison:</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {deliveryAddress.street}, {deliveryAddress.zone}
                  </p>
                </div>
              )}

              {/* Créneau sélectionné */}
              {deliverySlot && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <p className="text-sm font-medium">
                    {deliveryMethod === 'delivery' ? 'Livraison' : 'Retrait'} prévu:
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {deliverySlot.isExpress
                      ? 'Express (≤3h)'
                      : `${selectedDate === 'today' ? 'Aujourd\'hui' : 'Demain'} ${deliverySlot.startTime} - ${deliverySlot.endTime}`}
                  </p>
                </div>
              )}

              <button
                onClick={handleContinue}
                className="btn-primary w-full"
              >
                Continuer vers le paiement
              </button>

              <Link
                href="/checkout"
                className="block text-center text-sm text-gray-600 hover:text-primary mt-4"
              >
                ← Retour au panier
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}