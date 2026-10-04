import {
  FALLBACK_PRODUCTS,
  FALLBACK_COLLECTIONS,
  ProductData,
  ProductVariantData,
  ensureProductData,
} from "@/data/products.data";
import {
  fetchProducts,
  fetchProductBySlug as apiFetchProductBySlug,
  fetchCategoryProducts as apiFetchCategoryProducts,
  fetchCategoryTree as apiFetchCategoryTree,
  fetchCategoryBySlug as apiFetchCategoryBySlug,
  transformApiCardToProduct,
  transformApiDetailToProduct,
  ApiPagination,
  ApiCategory,
} from "@/services/catalogApi";

export { FALLBACK_PRODUCTS, FALLBACK_COLLECTIONS };
export type { ProductData, ProductVariantData };

function mapSortToApi(sort?: string): string | undefined {
  if (!sort) return undefined;
  switch (sort) {
    case "price-low":
      return "price_asc";
    case "price-high":
      return "price_desc";
    case "best-selling":
      return "bestselling";
    case "highest-rated":
      return "rating";
    case "discount":
      return "best_deals";
    case "newest":
      return "newest";
    default:
      return sort;
  }
}

export class ProductService {
  /**
   * Fetch all products with live API integration and resilient fallback
   */
  static async getAllProducts(filters?: {
    category?: string;
    gender?: string;
    size?: string;
    color?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    collection?: string;
    occasion?: string;
    fabric?: string;
    sort?: string;
    search?: string;
    featured?: boolean;
    newArrivals?: boolean;
    bestSellers?: boolean;
    brand?: string;
    page?: number;
    limit?: number;
  }): Promise<ProductData[]> {
    try {
      // Build API query parameters
      const apiParams: Record<string, any> = {};
      if (filters?.search) apiParams.search = filters.search;
      if (filters?.category) apiParams.category = filters.category;
      if (filters?.brand) apiParams.brand = filters.brand;
      if (filters?.minPrice !== undefined) apiParams.minPrice = filters.minPrice;
      if (filters?.maxPrice !== undefined) apiParams.maxPrice = filters.maxPrice;
      if (filters?.featured) apiParams.isFeatured = true;
      if (filters?.page) apiParams.page = filters.page;
      if (filters?.limit) apiParams.limit = filters.limit;

      const mappedSort = mapSortToApi(filters?.sort);
      if (mappedSort) apiParams.sort = mappedSort;

      // Dynamic attribute filters supported by backend
      if (filters?.color) apiParams.color = filters.color;
      if (filters?.size) apiParams.size = filters.size;
      if (filters?.fabric) apiParams.fabric = filters.fabric;
      if (filters?.occasion) apiParams.occasion = filters.occasion;

      const { products } = await fetchProducts(apiParams);

      if (products && products.length > 0) {
        let transformed = products.map(transformApiCardToProduct);

        // Apply client-side filters if needed (e.g. inStockOnly, collection)
        if (filters?.inStockOnly) {
          transformed = transformed.filter((p) => p.stock > 0);
        }

        return transformed;
      }
    } catch {
      // Silent catch -> fallback seamlessly to local products
    }

    // Fallback: Local dataset filtering
    let products = FALLBACK_PRODUCTS.map(ensureProductData);

    if (filters?.category) {
      products = products.filter(
        (p) =>
          p.categorySlug === filters.category ||
          p.categoryName.toLowerCase() === filters.category?.toLowerCase()
      );
    }
    if (filters?.gender) {
      products = products.filter(
        (p) => p.gender.toLowerCase() === filters.gender?.toLowerCase() || p.gender === "UNISEX"
      );
    }
    if (filters?.collection) {
      products = products.filter(
        (p) => p.collectionSlugs && p.collectionSlugs.includes(filters.collection!)
      );
    }
    if (filters?.occasion) {
      products = products.filter(
        (p) => p.occasionSlugs && p.occasionSlugs.includes(filters.occasion!)
      );
    }
    if (filters?.fabric) {
      products = products.filter(
        (p) => p.fabric && p.fabric.toLowerCase().includes(filters.fabric!.toLowerCase())
      );
    }
    if (filters?.size) {
      products = products.filter((p) =>
        p.variants.some((v) => v.size.toLowerCase() === filters.size?.toLowerCase())
      );
    }
    if (filters?.color) {
      products = products.filter((p) =>
        p.variants.some((v) => v.colorName.toLowerCase().includes(filters.color!.toLowerCase()))
      );
    }
    if (filters?.minPrice !== undefined) {
      products = products.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters?.maxPrice !== undefined) {
      products = products.filter((p) => p.price <= filters.maxPrice!);
    }
    if (filters?.inStockOnly) {
      products = products.filter((p) => p.variants.some((v) => v.stock > 0));
    }
    if (filters?.featured) {
      products = products.filter((p) => p.isFeatured);
    }
    if (filters?.newArrivals) {
      products = products.filter((p) => p.isNewArrival);
    }
    if (filters?.bestSellers) {
      products = products.filter((p) => p.isBestSeller);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.categoryName.toLowerCase().includes(q)
      );
    }

    // Sorting
    const s = filters?.sort;
    if (s === "price-low" || s === "price_asc") {
      products.sort((a, b) => a.price - b.price);
    } else if (s === "price-high" || s === "price_desc") {
      products.sort((a, b) => b.price - a.price);
    } else if (s === "best-selling" || s === "bestselling") {
      products.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    } else if (s === "highest-rated" || s === "rating") {
      products.sort((a, b) => (b.averageRating || 5) - (a.averageRating || 5));
    } else if (s === "discount" || s === "best_deals") {
      products.sort((a, b) => {
        const discA = a.compareAtPrice ? a.compareAtPrice - a.price : 0;
        const discB = b.compareAtPrice ? b.compareAtPrice - b.price : 0;
        return discB - discA;
      });
    } else if (s === "name_asc") {
      products.sort((a, b) => a.name.localeCompare(b.name));
    } else if (s === "name_desc") {
      products.sort((a, b) => b.name.localeCompare(a.name));
    }

    return products;
  }

  /**
   * Fetch discovery products with full pagination metadata
   */
  static async getProductsWithPagination(params: Record<string, any> = {}): Promise<{
    products: ProductData[];
    pagination: ApiPagination;
  }> {
    try {
      const mappedSort = mapSortToApi(params.sort);
      const apiParams = { ...params };
      if (mappedSort) apiParams.sort = mappedSort;

      const { products, pagination } = await fetchProducts(apiParams);
      if (products && products.length > 0) {
        return {
          products: products.map(transformApiCardToProduct),
          pagination,
        };
      }
    } catch {
      // Fallback
    }

    const all = await this.getAllProducts(params);
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 24;
    const start = (page - 1) * limit;
    const paginated = all.slice(start, start + limit);

    return {
      products: paginated,
      pagination: {
        page,
        limit,
        total: all.length,
        totalPages: Math.ceil(all.length / limit) || 1,
        hasNextPage: start + limit < all.length,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get single product by slug (PDP)
   */
  static async getProductBySlug(slug: string): Promise<ProductData | null> {
    try {
      const detail = await apiFetchProductBySlug(slug);
      if (detail) {
        return transformApiDetailToProduct(detail);
      }
    } catch {
      // Fallback
    }

    const fallback = FALLBACK_PRODUCTS.find((p) => p.slug === slug);
    return fallback ? ensureProductData(fallback) : null;
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: string): Promise<ProductData | null> {
    const product = FALLBACK_PRODUCTS.find((p) => p.id === id);
    if (product) return ensureProductData(product);

    // If not found in fallback, try to search in all products
    const all = await this.getAllProducts();
    const match = all.find((p) => p.id === id);
    return match || null;
  }

  /**
   * Category API integration
   */
  static async getCategoryTree(options?: { tree?: boolean; rootOnly?: boolean }): Promise<ApiCategory[]> {
    try {
      return await apiFetchCategoryTree(options);
    } catch {
      return [];
    }
  }

  static async getCategoryBySlug(slug: string): Promise<ApiCategory | null> {
    try {
      return await apiFetchCategoryBySlug(slug);
    } catch {
      return null;
    }
  }

  static async getCategoryProducts(
    slug: string,
    params: Record<string, any> = {}
  ): Promise<{
    category: ApiCategory | null;
    products: ProductData[];
    pagination: ApiPagination;
  }> {
    try {
      const res = await apiFetchCategoryProducts(slug, params);
      return {
        category: res.category,
        products: (res.products || []).map(transformApiCardToProduct),
        pagination: res.pagination,
      };
    } catch {
      const products = await this.getAllProducts({ category: slug, ...params });
      return {
        category: null,
        products,
        pagination: {
          page: 1,
          limit: 24,
          total: products.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }
  }

  static async getAllCollections() {
    return FALLBACK_COLLECTIONS;
  }

  static async getCollectionBySlug(slug: string) {
    return FALLBACK_COLLECTIONS.find((c) => c.slug === slug) || null;
  }
}
