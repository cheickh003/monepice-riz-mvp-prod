'use client';

import Link from 'next/link';
import * as Icons from '@/lib/icons';
import { categories } from '@/lib/products';

const ORDER: string[] = [
  'boucherie',
  'poissonnerie',
  'volaille',
  'frais',
  'sec',
  'epices',
  'boissons',
  'entretien',
  'petits-fumes',
  'promo',
];

export default function CategoryStrip() {
  const map = new Map(categories.map(c => [c.id, c]));
  const ordered = ORDER.map(id => map.get(id)).filter(Boolean);

  if (ordered.length === 0) return null;

  return (
    <div className="bg-white border-b border-gray-200 z-30">
      {/* Mobile: grille lisible de catégories sous le header */}
      <div className="md:hidden">
        <div className="container-app py-3">
          <div className="grid grid-cols-3 gap-2">
            <Link
              href="/products/all"
              className="rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors px-2 py-3 text-center flex flex-col items-center justify-center"
            >
              <span className="text-[13px] leading-tight font-medium text-gray-800 truncate w-full">Catalogue</span>
            </Link>
            {ordered.map((cat, idx) => (
              <Link
                key={`${cat!.id}-${idx}`}
                href={`/products/${cat!.slug}`}
                className="rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors px-2 py-3 text-center flex flex-col items-center justify-center"
                title={cat!.name}
              >
                {(() => {
                  const Icon = Icons.categoryIcons[cat!.id as keyof typeof Icons.categoryIcons];
                  return Icon ? <Icon className="w-5 h-5 text-gray-700 mb-1" /> : null;
                })()}
                <span className="text-[13px] leading-tight font-medium text-gray-800 truncate w-full">
                  {cat!.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: bandeau sticky de chips */}
      <div className="hidden md:block sticky top-0">
        <div className="container-app py-2 overflow-x-auto">
          <div className="flex items-center gap-3 whitespace-nowrap">
            <Link href="/products/all" className="px-3 py-1.5 rounded-full text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors">
              Catalogue
            </Link>
            {ordered.map((cat, idx) => (
              <Link
                key={`${cat!.id}-${idx}`}
                href={`/products/${cat!.slug}`}
                className="px-3 py-1.5 rounded-full text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-2 transition-colors"
                title={cat!.name}
              >
                {(() => {
                  const Icon = Icons.categoryIcons[cat!.id as keyof typeof Icons.categoryIcons];
                  return Icon ? <Icon className="w-4 h-4" /> : null;
                })()}
                <span className="truncate">{cat!.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
