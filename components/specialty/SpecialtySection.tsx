/**
 * Specialty Section Component
 * 
 * Highlights MonEpice&Riz specialty products, particularly escargots and crabes
 * from San Pedro. Features store-aware availability, cross-store comparison,
 * and premium presentation for these signature products.
 */

'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  SparklesIcon,
  MapPinIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  PhoneIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'
import { useSelectedStore } from '@/lib/stores/storeSelectionStore'
import { getSpecialtyProducts, batchCheckProductAvailability } from '@/lib/services/products'
import { STORES } from '@/lib/config/stores'
import { StoreCode, Product } from '@/lib/types'
import ProductCard from '@/components/product/ProductCard'

interface SpecialtySectionProps {
  title?: string
  subtitle?: string
  limit?: number
  showCrossStoreAvailability?: boolean
  compact?: boolean
  className?: string
}

type SpecialtyCategory = 'escargots' | 'crabes' | 'fruits-mer' | 'all'

const SPECIALTY_CATEGORIES = [
  { 
    id: 'all' as SpecialtyCategory, 
    name: 'Toutes nos spécialités', 
    emoji: '🌟',
    description: 'Découvrez tous nos produits d\'exception'
  },
  { 
    id: 'escargots' as SpecialtyCategory, 
    name: 'Escargots de San Pedro', 
    emoji: '🐌',
    description: 'Escargots frais et de qualité supérieure'
  },
  { 
    id: 'crabes' as SpecialtyCategory, 
    name: 'Crabes de San Pedro', 
    emoji: '🦀',
    description: 'Crabes vivants et préparés avec soin'
  },
  { 
    id: 'fruits-mer' as SpecialtyCategory, 
    name: 'Fruits de mer', 
    emoji: '🦐',
    description: 'Sélection premium de fruits de mer'
  }
]

export default function SpecialtySection({
  title = "🐌🦀 Nos Spécialités de San Pedro",
  subtitle = "Des produits d'exception, directement de la côte ivoirienne",
  limit = 8,
  showCrossStoreAvailability = true,
  compact = false,
  className = ''
}: SpecialtySectionProps) {
  const router = useRouter()
  const selectedStore = useSelectedStore()
  
  const [activeCategory, setActiveCategory] = useState<SpecialtyCategory>('all')
  const [showAllProducts, setShowAllProducts] = useState(false)

  // Fetch specialty products
  const { 
    data: specialtyProducts = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['specialty-products', limit],
    queryFn: () => getSpecialtyProducts(showAllProducts ? 50 : limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return specialtyProducts

    return specialtyProducts.filter(product => {
      const name = product.name?.toLowerCase() || ''
      const description = product.description?.toLowerCase() || ''
      const tags = product.tags || []

      switch (activeCategory) {
        case 'escargots':
          return name.includes('escargot') || 
                 tags.includes('escargots') || 
                 description.includes('escargot')
        case 'crabes':
          return name.includes('crabe') || 
                 tags.includes('crabes') || 
                 description.includes('crabe')
        case 'fruits-mer':
          return tags.includes('fruits-de-mer') || 
                 tags.includes('poisson') || 
                 name.includes('crevette') ||
                 name.includes('poisson') ||
                 description.includes('fruits de mer')
        default:
          return true
      }
    })
  }, [specialtyProducts, activeCategory])

  // Loading state
  if (isLoading) {
    return (
      <section className={`py-12 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SpecialtySectionSkeleton compact={compact} />
        </div>
      </section>
    )
  }

  // Error state
  if (error) {
    return (
      <section className={`py-12 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SpecialtyError onRetry={() => window.location.reload()} />
        </div>
      </section>
    )
  }

  // Empty state
  if (!specialtyProducts.length) {
    return null
  }

  if (compact) {
    return (
      <section className={`py-8 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CompactSpecialtyView
            products={filteredProducts.slice(0, 4)}
            title={title}
            onViewAll={() => router.push('/products?specialty=true')}
          />
        </div>
      </section>
    )
  }

  return (
    <section className={`py-12 bg-gradient-to-br from-amber-50 to-orange-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm mb-4">
            <SparklesIcon className="h-5 w-5 text-amber-500 mr-2" />
            <span className="text-sm font-medium text-amber-700">Produits d'Exception</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            {subtitle}
          </p>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {SPECIALTY_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`
                  flex items-center px-4 py-2 rounded-full transition-all duration-200
                  ${activeCategory === category.id
                    ? 'bg-amber-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-amber-50 hover:shadow-md'
                  }
                `}
              >
                <span className="mr-2">{category.emoji}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Store Availability Banner */}
        {selectedStore && (
          <StoreAvailabilityBanner 
            selectedStore={selectedStore} 
            className="mb-8"
          />
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {filteredProducts.slice(0, showAllProducts ? undefined : limit).map((product) => (
            <div key={product.$id} className="group">
              <ProductCard
                product={product}
                showStoreAvailability={true}
                showCrossStoreAvailability={showCrossStoreAvailability}
                showSpecialtyBadge={true}
                className="h-full transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl"
                onUnavailableAtStore={(unavailableProduct, store) => {
                  // Handle specialty product unavailability with custom messaging
                  console.log(`Specialty product ${unavailableProduct.name} unavailable at ${store}`)
                }}
              />
            </div>
          ))}
        </div>

        {/* Show More/Less Button */}
        {filteredProducts.length > limit && (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowAllProducts(!showAllProducts)}
              className="inline-flex items-center px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-lg"
            >
              {showAllProducts ? 'Voir moins' : `Voir tous les produits (${filteredProducts.length})`}
              <ArrowRightIcon className={`h-5 w-5 ml-2 transition-transform ${showAllProducts ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}

        {/* Call to Action */}
        <SpecialtyCallToAction />
      </div>
    </section>
  )
}

interface CompactSpecialtyViewProps {
  products: Product[]
  title: string
  onViewAll: () => void
}

function CompactSpecialtyView({ products, title, onViewAll }: CompactSpecialtyViewProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <SparklesIcon className="h-6 w-6 text-amber-500 mr-2" />
          {title}
        </h3>
        <button
          onClick={onViewAll}
          className="text-amber-600 hover:text-amber-700 font-medium flex items-center"
        >
          Voir tout
          <ArrowRightIcon className="h-4 w-4 ml-1" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.$id}
            product={product}
            compact={true}
            showStoreAvailability={true}
            showSpecialtyBadge={true}
          />
        ))}
      </div>
    </div>
  )
}

interface StoreAvailabilityBannerProps {
  selectedStore: StoreCode
  className?: string
}

function StoreAvailabilityBanner({ selectedStore, className = '' }: StoreAvailabilityBannerProps) {
  const store = STORES[selectedStore]

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-500 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
            <MapPinIcon className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            Disponibilité à {store.name}
            <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" />
          </h4>
          
          <p className="text-gray-600 mt-1">
            Nos spécialités sont fraîchement préparées et disponibles pour retrait ou livraison
          </p>
          
          <div className="flex items-center gap-6 mt-3 text-sm text-gray-500">
            <span className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              {store.operatingHours.open} - {store.operatingHours.close}
            </span>
            <span className="flex items-center">
              <PhoneIcon className="h-4 w-4 mr-1" />
              {store.phone}
            </span>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Ouvert
          </span>
        </div>
      </div>
    </div>
  )
}

function SpecialtyCallToAction() {
  const router = useRouter()

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-4">
          <div className="flex -space-x-2">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl">🐌</div>
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl">🦀</div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">🦐</div>
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Commandez nos spécialités dès maintenant
        </h3>
        
        <p className="text-gray-600 mb-6">
          Profitez de nos produits frais de San Pedro, préparés avec soin par nos experts. 
          Livraison en 3h à Abidjan ou retrait en magasin.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/products?specialty=true')}
            className="inline-flex items-center px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-lg"
          >
            <SparklesIcon className="h-5 w-5 mr-2" />
            Voir toutes les spécialités
          </button>
          
          <button
            onClick={() => router.push('/contact')}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <PhoneIcon className="h-5 w-5 mr-2" />
            Nous contacter
          </button>
        </div>
        
        <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
          <InformationCircleIcon className="h-4 w-4 mr-1" />
          Produits soumis à disponibilité saisonnière
        </div>
      </div>
    </div>
  )
}

function SpecialtySectionSkeleton({ compact }: { compact: boolean }) {
  const itemCount = compact ? 4 : 8

  return (
    <div className="animate-pulse">
      {!compact && (
        <div className="text-center mb-12">
          <div className="h-8 bg-gray-200 rounded w-96 mx-auto mb-4" />
          <div className="h-4 bg-gray-200 rounded w-128 mx-auto mb-8" />
          <div className="flex justify-center gap-2 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-full w-32" />
            ))}
          </div>
        </div>
      )}
      
      <div className={`grid ${compact ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} gap-6`}>
        {Array.from({ length: itemCount }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg p-4">
            <div className="h-48 bg-gray-200 rounded-lg mb-4" />
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}

function SpecialtyError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
        <ExclamationCircleIcon className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Erreur lors du chargement des spécialités
      </h3>
      <p className="text-gray-600 mb-6">
        Impossible de charger nos produits spéciaux. Veuillez réessayer.
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
      >
        Réessayer
      </button>
    </div>
  )
}