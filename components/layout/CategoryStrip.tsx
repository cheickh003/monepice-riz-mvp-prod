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
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="container-app py-2 overflow-x-auto">
        <div className="flex items-center gap-2 md:gap-3 whitespace-nowrap">
          <Link href="/products/all" className="px-3 py-1.5 rounded-full text-sm bg-primary text-white hover:bg-primary-600 transition-colors">
            Catalogue
          </Link>
          {ordered.map(cat => (
            <Link
              key={cat!.id}
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
  );
}

