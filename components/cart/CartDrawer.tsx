'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import { useCartStore } from '@/lib/stores/cartStore';
import { X, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import * as Icons from '@/lib/icons';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, getCart } = useCartStore();
  const cart = getCart();

  const getProductIcon = (mainCategory: string) => {
    return Icons.categoryIcons[mainCategory as keyof typeof Icons.categoryIcons] || Icons.Package;
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-lg font-medium text-gray-900">
                          Votre panier
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="-m-2 p-2 text-gray-400 hover:text-gray-500"
                            onClick={onClose}
                          >
                            <span className="sr-only">Fermer le panier</span>
                            <X className="h-6 w-6" />
                          </button>
                        </div>
                      </div>

                      {items.length === 0 ? (
                        <div className="mt-8 text-center">
                          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-4 text-gray-500">Votre panier est vide</p>
                          <Link
                            href="/products"
                            className="mt-6 inline-block btn-primary"
                            onClick={onClose}
                          >
                            Commencer mes courses
                          </Link>
                        </div>
                      ) : (
                        <div className="mt-8">
                          <div className="flow-root">
                            <ul className="-my-6 divide-y divide-gray-200">
                              {items.map((item) => (
                                <li key={item.product.id} className="flex py-6">
                                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                                    <div className="h-full w-full flex items-center justify-center">
                                      {(() => {
                                        const Icon = getProductIcon(item.product.mainCategory);
                                        return <Icon className="w-8 h-8 text-gray-400" />;
                                      })()}
                                    </div>
                                  </div>

                                  <div className="ml-4 flex flex-1 flex-col">
                                    <div>
                                      <div className="flex justify-between text-base font-medium text-gray-900">
                                        <h3 className="line-clamp-2">
                                          <Link href={`/product/${item.product.slug}`} onClick={onClose}>
                                            {item.product.name}
                                          </Link>
                                        </h3>
                                        <p className="ml-4">
                                          {(item.product.isPromo && item.product.promoPrice
                                            ? item.product.promoPrice
                                            : item.product.price
                                          ).toLocaleString('fr-FR')} F
                                        </p>
                                      </div>
                                      {item.product.weight && (
                                        <p className="mt-1 text-sm text-gray-500">{item.product.weight}</p>
                                      )}
                                    </div>
                                    <div className="flex flex-1 items-end justify-between text-sm">
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                          className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-primary"
                                        >
                                          <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                                        <button
                                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                          className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-primary"
                                        >
                                          <Plus className="h-4 w-4" />
                                        </button>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => removeItem(item.product.id)}
                                        className="font-medium text-primary hover:text-primary-600"
                                      >
                                        Retirer
                                      </button>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    {items.length > 0 && (
                      <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Sous-total</span>
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
                          <div className="flex justify-between text-base font-medium text-gray-900 pt-2 border-t">
                            <span>Total</span>
                            <span>{cart.total.toLocaleString('fr-FR')} F</span>
                          </div>
                        </div>
                        <p className="mt-4 text-xs text-gray-500 text-center">
                          Livraison en 3h ou retrait gratuit à Cocody Danga
                        </p>
                        <div className="mt-6">
                          <Link
                            href="/checkout"
                            className="btn-primary w-full text-center"
                            onClick={onClose}
                          >
                            Commander
                          </Link>
                        </div>
                        <div className="mt-4 flex justify-center text-center text-sm text-gray-500">
                          <p>
                            ou{' '}
                            <button
                              type="button"
                              className="font-medium text-primary hover:text-primary-600"
                              onClick={onClose}
                            >
                              Continuer mes achats
                              <span aria-hidden="true"> &rarr;</span>
                            </button>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}