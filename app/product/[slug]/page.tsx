'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getProductBySlug, getRelatedProducts, getCategoryBySlug } from '@/lib/products';
import { useCartStore } from '@/lib/stores/cartStore';
import ProductCard from '@/components/product/ProductCard';
import * as Icons from '@/lib/icons';

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState(getProductBySlug(slug));
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  
  const { addItem, updateQuantity, getItemQuantity } = useCartStore();
  const quantity = product ? getItemQuantity(product.id) : 0;

  useEffect(() => {
    setProduct(getProductBySlug(slug));
  }, [slug]);

  if (!product) {
    return (
      <div className="container-app py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Produit non trouvé</h1>
        <Link href="/products" className="text-primary hover:underline">
          Retour aux produits
        </Link>
      </div>
    );
  }

  const category = getCategoryBySlug(product.mainCategory);
  const relatedProducts = getRelatedProducts(product, 4);

  const getProductIcon = () => {
    return Icons.categoryIcons[product.mainCategory as keyof typeof Icons.categoryIcons] || Icons.Package;
  };

  const handleAddToCart = () => {
    addItem(product);
  };

  const handleIncrease = () => {
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrease = () => {
    if (quantity > 0) {
      updateQuantity(product.id, quantity - 1);
    }
  };

  // Simuler plusieurs images
  const ProductIcon = getProductIcon();
  const productImages = [
    { id: 1, icon: ProductIcon },
    { id: 2, icon: ProductIcon },
    { id: 3, icon: ProductIcon },
  ];

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4">
        <div className="container-app">
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/" className="text-gray-600 hover:text-primary transition-colors whitespace-nowrap">
              Accueil
            </Link>
            <span className="text-gray-400 flex-shrink-0">/</span>
            <Link href={`/products/${product.mainCategory}`} className="text-gray-600 hover:text-primary transition-colors whitespace-nowrap">
              {category?.name}
            </Link>
            <span className="text-gray-400 flex-shrink-0">/</span>
            <span className="text-gray-900 font-medium break-words min-w-0 flex-1">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="container-app py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Galerie d'images */}
          <div className="space-y-4">
            {/* Image principale */}
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
              <div className="w-full h-full flex items-center justify-center p-8">
                {(() => {
                  const Icon = productImages[selectedImage].icon;
                  return <Icon className="w-48 h-48 text-gray-400" />;
                })()}
              </div>
            </div>

            {/* Miniatures */}
            <div className="grid grid-cols-3 gap-4">
              {productImages.map((img, index) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <div className="w-full h-full flex items-center justify-center p-4">
                    {(() => {
                      const Icon = img.icon;
                      return <Icon className="w-12 h-12 text-gray-400" />;
                    })()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Informations produit */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product.stock === 'in_stock' && (
                <span className="badge badge-success">En stock</span>
              )}
              {product.stock === 'low_stock' && (
                <span className="badge badge-warning">Stock limité</span>
              )}
              {product.stock === 'out_of_stock' && (
                <span className="badge badge-error">Rupture de stock</span>
              )}
              {product.isPromo && (
                <span className="badge bg-primary text-white">-15% Promo</span>
              )}
            </div>

            {/* Titre et infos */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Réf: {product.ref}</span>
                <span>Code barre: {product.barcode}</span>
              </div>
            </div>

            {/* Prix */}
            <div className="space-y-2">
              <div className="flex items-baseline space-x-4">
                {product.isPromo && product.promoPrice ? (
                  <>
                    <span className="text-3xl font-bold text-primary">
                      {product.promoPrice.toLocaleString('fr-FR')} F CFA
                    </span>
                    <span className="text-xl text-gray-500 line-through">
                      {product.price.toLocaleString('fr-FR')} F CFA
                    </span>
                    <span className="text-sm bg-primary text-white px-2 py-1 rounded">
                      -15%
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-primary">
                    {product.price.toLocaleString('fr-FR')} F CFA
                  </span>
                )}
              </div>
              {product.weight && (
                <p className="text-gray-600">Format: {product.weight}</p>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-gray-600">
                ({product.reviewCount} avis)
              </span>
            </div>

            {/* Livraison */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-2 text-green-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Livraison disponible</span>
              </div>
              <p className="text-sm text-gray-600">
                🚚 Livraison en 3h maximum à Abidjan
              </p>
              <p className="text-sm text-gray-600">
                📍 Retrait gratuit dans nos magasins
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              {product.stock === 'out_of_stock' ? (
                <button disabled className="btn-primary w-full opacity-50 cursor-not-allowed">
                  Rupture de stock
                </button>
              ) : quantity === 0 ? (
                <button onClick={handleAddToCart} className="btn-primary w-full">
                  Ajouter au panier
                </button>
              ) : (
                <div className="flex items-center justify-center space-x-4 bg-gray-50 rounded-lg p-4">
                  <button
                    onClick={handleDecrease}
                    className="w-12 h-12 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="font-bold text-2xl w-16 text-center">{quantity}</span>
                  <button
                    onClick={handleIncrease}
                    className="w-12 h-12 rounded-full bg-primary text-white hover:bg-primary-600 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Description / Avis */}
        <div className="mt-12">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('description')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'description'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reviews'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Avis ({product.reviewCount})
              </button>
            </nav>
          </div>

          <div className="py-8">
            {activeTab === 'description' ? (
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-4">Description du produit</h3>
                <p className="text-gray-600">{product.description}</p>
                
                <h4 className="text-lg font-semibold mt-6 mb-3">Caractéristiques</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Marque: {product.brand}</li>
                  {product.weight && <li>Poids/Format: {product.weight}</li>}
                  <li>Catégorie: {category?.name}</li>
                  <li>Référence: {product.ref}</li>
                </ul>

                <h4 className="text-lg font-semibold mt-6 mb-3">Conservation</h4>
                <p className="text-gray-600">
                  Conserver dans un endroit frais et sec. Voir les instructions sur l'emballage.
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-6">Avis clients</h3>
                
                {/* Résumé des avis */}
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                  <div className="flex items-center space-x-8">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-gray-900">{product.rating.toFixed(1)}</p>
                      <div className="flex mt-2">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{product.reviewCount} avis</p>
                    </div>
                  </div>
                </div>

                {/* Liste des avis (simulés) */}
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border-b border-gray-200 pb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {[...Array(5)].map((_, j) => (
                              <svg
                                key={j}
                                className={`w-4 h-4 ${
                                  j < 4 ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="font-medium">Client{i}</span>
                        </div>
                        <span className="text-sm text-gray-500">Il y a {i} jour{i > 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-gray-600">
                        Très bon produit, conforme à la description. La livraison a été rapide et le produit était bien emballé.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Produits similaires */}
        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Produits similaires
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}