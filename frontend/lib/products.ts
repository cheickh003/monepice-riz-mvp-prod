import { Product, Category } from './types';
import productsData from './data/products.json';
import categoriesData from './data/categories.json';

export const products: Product[] = productsData as Product[];
export const categories: Category[] = categoriesData as Category[];

export function getProductById(id: number): Product | undefined {
  return products.find(p => p.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find(p => p.slug === slug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  if (categorySlug === 'promo') {
    return products.filter(p => p.isPromo);
  }
  return products.filter(p => p.mainCategory === categorySlug);
}

export function getFeaturedProducts(limit: number = 8): Product[] {
  return products
    .filter(p => p.isFeatured)
    .slice(0, limit);
}

export function getPromoProducts(limit: number = 8): Product[] {
  return products
    .filter(p => p.isPromo)
    .slice(0, limit);
}

export function searchProducts(query: string): Product[] {
  const searchTerm = query.toLowerCase();
  return products.filter(p => 
    p.name.toLowerCase().includes(searchTerm) ||
    p.category.toLowerCase().includes(searchTerm) ||
    p.brand.toLowerCase().includes(searchTerm) ||
    p.description.toLowerCase().includes(searchTerm)
  );
}

export function getRelatedProducts(product: Product, limit: number = 4): Product[] {
  return products
    .filter(p => 
      p.id !== product.id && 
      (p.mainCategory === product.mainCategory || p.category === product.category)
    )
    .slice(0, limit);
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find(c => c.id === id);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find(c => c.slug === slug);
}