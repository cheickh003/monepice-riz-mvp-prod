import { Product, Category } from './types';
import productsData from './data/products.json';
import categoriesData from './data/categories.json';
import { productService } from './services/products';

// Feature flag to switch between JSON and Appwrite data sources
const USE_APPWRITE = process.env.NEXT_PUBLIC_USE_APPWRITE === 'true';

export const products: Product[] = productsData as Product[];
export const categories: Category[] = categoriesData as Category[];

export async function getProductById(id: number | string): Promise<Product | undefined> {
  if (USE_APPWRITE) {
    try {
      // Try Appwrite first
      const appwriteProduct = typeof id === 'string' 
        ? await productService.getProductById(id)
        : await productService.getProductByLegacyId(id.toString());
      
      if (appwriteProduct) {
        return transformAppwriteProduct(appwriteProduct);
      }
    } catch (error) {
      console.warn('Appwrite product fetch failed, falling back to JSON:', error);
    }
  }
  
  // Fallback to JSON data
  return products.find(p => p.id === Number(id));
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  if (USE_APPWRITE) {
    try {
      const appwriteProduct = await productService.getProductBySlug(slug);
      if (appwriteProduct) {
        return transformAppwriteProduct(appwriteProduct);
      }
    } catch (error) {
      console.warn('Appwrite product fetch failed, falling back to JSON:', error);
    }
  }
  
  // Fallback to JSON data
  return products.find(p => p.slug === slug);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  if (USE_APPWRITE) {
    try {
      // First get category by slug
      const category = await productService.getCategoryBySlug(categorySlug);
      if (category) {
        const result = await productService.getProductsByCategory(category.$id);
        return result.documents.map(transformAppwriteProduct);
      }
    } catch (error) {
      console.warn('Appwrite category products fetch failed, falling back to JSON:', error);
    }
  }
  
  // Fallback to JSON data
  if (categorySlug === 'promo') {
    return products.filter(p => p.isPromo);
  }
  return products.filter(p => p.mainCategory === categorySlug);
}

export async function getFeaturedProducts(limit: number = 8): Promise<Product[]> {
  if (USE_APPWRITE) {
    try {
      const appwriteProducts = await productService.getFeaturedProducts(limit);
      return appwriteProducts.map(transformAppwriteProduct);
    } catch (error) {
      console.warn('Appwrite featured products fetch failed, falling back to JSON:', error);
    }
  }
  
  // Fallback to JSON data
  return products
    .filter(p => p.isFeatured)
    .slice(0, limit);
}

export async function getPromoProducts(limit: number = 8): Promise<Product[]> {
  if (USE_APPWRITE) {
    try {
      const result = await productService.listProducts(
        { promoPrice: true }, // Products with promotional pricing
        { limit }
      );
      return result.documents.map(transformAppwriteProduct);
    } catch (error) {
      console.warn('Appwrite promo products fetch failed, falling back to JSON:', error);
    }
  }
  
  // Fallback to JSON data
  return products
    .filter(p => p.isPromo)
    .slice(0, limit);
}

export async function searchProducts(query: string): Promise<Product[]> {
  if (USE_APPWRITE) {
    try {
      const result = await productService.searchProducts(query);
      return result.documents.map(transformAppwriteProduct);
    } catch (error) {
      console.warn('Appwrite search failed, falling back to JSON:', error);
    }
  }
  
  // Fallback to JSON data
  const searchTerm = query.toLowerCase();
  return products.filter(p => 
    p.name.toLowerCase().includes(searchTerm) ||
    p.category.toLowerCase().includes(searchTerm) ||
    p.brand.toLowerCase().includes(searchTerm) ||
    p.description.toLowerCase().includes(searchTerm)
  );
}

export async function getRelatedProducts(product: Product, limit: number = 4): Promise<Product[]> {
  if (USE_APPWRITE && product.$id) {
    try {
      const appwriteProducts = await productService.getRelatedProducts(
        product.$id, 
        product.categoryId || '', 
        limit
      );
      return appwriteProducts.map(transformAppwriteProduct);
    } catch (error) {
      console.warn('Appwrite related products fetch failed, falling back to JSON:', error);
    }
  }
  
  // Fallback to JSON data
  return products
    .filter(p => 
      p.id !== product.id && 
      (p.mainCategory === product.mainCategory || p.category === product.category)
    )
    .slice(0, limit);
}

// Transform Appwrite product to legacy Product interface
function transformAppwriteProduct(appwriteProduct: any): Product {
  return {
    // Legacy fields
    id: Number(appwriteProduct.legacyId) || 0,
    name: appwriteProduct.name,
    slug: appwriteProduct.slug,
    description: appwriteProduct.description || '',
    price: appwriteProduct.basePrice,
    originalPrice: appwriteProduct.promoPrice || appwriteProduct.basePrice,
    image: appwriteProduct.imageUrl,
    images: appwriteProduct.images || [],
    category: appwriteProduct.categoryId, // This might need category name lookup
    mainCategory: appwriteProduct.categoryId,
    brand: '', // Not in Appwrite schema
    unit: appwriteProduct.unit,
    weight: appwriteProduct.weight,
    inStock: appwriteProduct.isActive,
    isFeatured: appwriteProduct.isFeatured,
    isPromo: !!appwriteProduct.promoPrice,
    
    // New Appwrite fields
    $id: appwriteProduct.$id,
    $createdAt: appwriteProduct.$createdAt,
    $updatedAt: appwriteProduct.$updatedAt,
    categoryId: appwriteProduct.categoryId,
    shortDescription: appwriteProduct.shortDescription,
    sku: appwriteProduct.sku,
    isSpecialty: appwriteProduct.isSpecialty,
    tags: appwriteProduct.tags || [],
    nutrition: appwriteProduct.nutrition,
    storage: appwriteProduct.storage,
    origin: appwriteProduct.origin,
  };
}

export async function getCategoryById(id: string): Promise<Category | undefined> {
  if (USE_APPWRITE) {
    try {
      const appwriteCategory = await productService.getCategoryById(id);
      if (appwriteCategory) {
        return transformAppwriteCategory(appwriteCategory);
      }
    } catch (error) {
      console.warn('Appwrite category fetch failed, falling back to JSON:', error);
    }
  }
  
  // Fallback to JSON data
  return categories.find(c => c.id === id);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  if (USE_APPWRITE) {
    try {
      const appwriteCategory = await productService.getCategoryBySlug(slug);
      if (appwriteCategory) {
        return transformAppwriteCategory(appwriteCategory);
      }
    } catch (error) {
      console.warn('Appwrite category fetch failed, falling back to JSON:', error);
    }
  }
  
  // Fallback to JSON data
  return categories.find(c => c.slug === slug);
}

export async function getCategories(): Promise<Category[]> {
  if (USE_APPWRITE) {
    try {
      const appwriteCategories = await productService.getCategories();
      return appwriteCategories.map(transformAppwriteCategory);
    } catch (error) {
      console.warn('Appwrite categories fetch failed, falling back to JSON:', error);
    }
  }
  
  // Fallback to JSON data
  return categories;
}

// Transform Appwrite category to legacy Category interface
function transformAppwriteCategory(appwriteCategory: any): Category {
  return {
    // Legacy fields
    id: appwriteCategory.legacyId || appwriteCategory.$id,
    name: appwriteCategory.name,
    slug: appwriteCategory.slug,
    description: appwriteCategory.description || '',
    image: appwriteCategory.imageUrl || '',
    
    // New Appwrite fields
    $id: appwriteCategory.$id,
    $createdAt: appwriteCategory.$createdAt,
    $updatedAt: appwriteCategory.$updatedAt,
    parentId: appwriteCategory.parentId,
    displayOrder: appwriteCategory.displayOrder,
    isActive: appwriteCategory.isActive,
    isFeatured: appwriteCategory.isFeatured,
  };
}