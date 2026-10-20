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
import { CollectionService } from "@/services/collection.service";

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
      if (mappedSort) {
        apiParams.sort = mappedSort;
      } else if (filters?.newArrivals) {
        apiParams.sort = "newest";
      } else if (filters?.bestSellers) {
        apiParams.sort = "bestselling";
      }

      // Dynamic attribute filters supported by backend
      if (filters?.color) apiParams.color = filters.color;
      if (filters?.size) apiParams.size = filters.size;
      if (filters?.fabric) apiParams.fabric = filters.fabric;
      if (filters?.occasion) apiParams.occasion = filters.occasion;

      const { products } = await fetchProducts(apiParams);

      if (products) {
        let transformed = products.map(transformApiCardToProduct);

        // Apply client-side filters if needed (e.g. inStockOnly, collection)
        if (filters?.inStockOnly) {
          transformed = transformed.filter((p) => p.stock > 0);
        }

        return transformed;
      }
      return [];
    } catch {
      // Live database data only — do not inject hardcoded mock products for showcase
      return [];
    }
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
    if (fallback) return ensureProductData(fallback);

    const all = await this.getAllProducts();
    const match = all.find((p) => p.slug === slug);
    return match ? ensureProductData(match) : null;
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
    try {
      const live = await CollectionService.getCollections();
      if (live && live.length > 0) {
        return live.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || "",
          image: c.imageUrl || null,
          itemCount: c.productsCount ? `${c.productsCount} Masterpieces` : "Curated Capsule",
        }));
      }
    } catch {
      // Live database collections only
    }
    return [];
  }

  static async getCollectionBySlug(slug: string) {
    try {
      const live = await CollectionService.getCollectionBySlug(slug);
      if (live) {
        return {
          id: live.id,
          name: live.name,
          slug: live.slug,
          description: live.description || "",
          image: live.imageUrl || null,
          itemCount: live.productsCount ? `${live.productsCount} Masterpieces` : "Curated Capsule",
          products: live.products || [],
        };
      }
    } catch {
      // Live database collections only
    }
    return null;
  }
}
