import {
  FALLBACK_PRODUCTS,
  FALLBACK_COLLECTIONS,
  ProductData,
  ProductVariantData,
  ensureProductData,
} from "@/data/products.data";
import {
  fetchProducts,
  fetchAllProducts,
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
import { AdminService } from "@/services/admin.service";
import { AdminProduct } from "@/types/admin.types";

export { FALLBACK_PRODUCTS, FALLBACK_COLLECTIONS };
export type { ProductData, ProductVariantData };

/**
 * Transforms an AdminProduct (from Admin panel or local admin storage)
 * into the complete customer-facing ProductData schema.
 */
export function transformAdminProductToProductData(adminProd: AdminProduct): ProductData {
  const regPrice = Number(adminProd.regularPrice || adminProd.basePrice || 0);
  const salePrice = adminProd.salePrice != null ? Number(adminProd.salePrice) : null;
  const offerPrice = adminProd.offerPrice != null ? Number(adminProd.offerPrice) : null;
  const effectivePrice = offerPrice !== null ? offerPrice : salePrice !== null ? salePrice : regPrice;
  const compareAtPrice = regPrice > effectivePrice ? regPrice : null;
  const discountPercentage =
    regPrice > effectivePrice ? Math.round(((regPrice - effectivePrice) / regPrice) * 100) : 0;

  const images = (adminProd.images || []).map((img, idx) => ({
    id: img.id || `img-${idx}`,
    url: img.url,
    altText: img.altText || adminProd.name,
    isPrimary: Boolean(img.isPrimary || img.isThumbnail || idx === 0),
  }));

  if (images.length === 0 && adminProd.thumbnail) {
    images.push({
      id: "img-thumb",
      url: adminProd.thumbnail,
      altText: adminProd.name,
      isPrimary: true,
    });
  }

  if (images.length === 0) {
    images.push({
      id: "img-default",
      url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
      altText: adminProd.name,
      isPrimary: true,
    });
  }

  const variants: ProductVariantData[] = (adminProd.variants || []).map((v) => {
    const vReg = Number(v.regularPrice || v.compareAtPrice || regPrice);
    const vSale = v.salePrice != null ? Number(v.salePrice) : null;
    const vOffer = v.offerPrice != null ? Number(v.offerPrice) : null;
    const vEffective = vOffer !== null ? vOffer : vSale !== null ? vSale : vReg;
    const vStock = Number(v.stockQuantity ?? v.stock ?? 0);

    return {
      id: v.id,
      sku: v.sku,
      price: vEffective,
      compareAtPrice: vReg > vEffective ? vReg : null,
      stock: vStock,
      lowStockThreshold: v.lowStockThreshold || 5,
      size: v.size || "Free Size",
      colorName: v.colorName || v.color || "Standard",
      colorHex: v.colorHex || "#111111",
      imageUrl: images[0]?.url || null,
      isActive: v.isActive !== false,
      name: v.name || `${v.size || ""} ${v.color || ""}`.trim() || adminProd.name,
      inStock: vStock > 0,
      priceObject: {
        regular: vReg,
        sale: vSale,
        offer: vOffer,
        effective: vEffective,
        discountPercentage:
          vReg > vEffective ? Math.round(((vReg - vEffective) / vReg) * 100) : 0,
      },
      attributes: (v.attributes || []).map((a) => ({
        attribute: a.attributeName || "Attribute",
        attributeSlug: a.slug || a.attributeName?.toLowerCase() || "",
        value: a.value || "",
        valueSlug: a.slug || a.value?.toLowerCase() || "",
      })),
    };
  });

  const totalStock = Number(adminProd.stockQuantity ?? adminProd.totalStock ?? 0);
  const categorySlug = adminProd.category?.slug || adminProd.categorySlug || "";
  const categoryName = adminProd.category?.name || adminProd.categoryName || "Apparel";

  return ensureProductData({
    id: adminProd.id,
    name: adminProd.name,
    slug: adminProd.slug,
    description: adminProd.description || "",
    shortDescription: adminProd.shortDescription || null,
    price: effectivePrice,
    compareAtPrice,
    costPrice: adminProd.costPrice != null ? Number(adminProd.costPrice) : null,
    sku: adminProd.sku || null,
    brand: adminProd.brand || "Maison Luxe",
    gender: adminProd.gender || "WOMEN",
    tags: adminProd.tags || ["Apparel", "Luxury"],
    categorySlug,
    categoryName,
    status: adminProd.isActive ? "ACTIVE" : "ARCHIVED",
    isFeatured: Boolean(adminProd.isFeatured),
    stock: totalStock,
    stockQuantity: totalStock,
    inStock: totalStock > 0,
    images,
    thumbnail: images[0]?.url || adminProd.thumbnail || "",
    variants,
    hasVariants: variants.length > 0,
    requiresConfiguration: variants.length > 1,
    averageRating: Number(adminProd.rating || 5.0),
    reviewsCount: Number(adminProd.reviewCount || 0),
    priceObject: {
      regular: regPrice,
      sale: salePrice,
      offer: offerPrice,
      effective: effectivePrice,
      discountPercentage,
    },
  });
}

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
    let transformed: ProductData[] = [];

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

      if (filters?.page) {
        const { products } = await fetchProducts(apiParams);
        if (products && Array.isArray(products)) {
          transformed = products.map(transformApiCardToProduct);
        }
      } else {
        const products = await fetchAllProducts(apiParams);
        if (products && Array.isArray(products)) {
          transformed = products.map(transformApiCardToProduct);
        }
      }
    } catch (err) {
      console.warn("[ProductService.getAllProducts] Live fetch failed:", err);
    }

    // Merge live database items with active admin-added/updated products
    if (typeof window !== "undefined") {
      try {
        const localAdmin = AdminService.getLocalProducts();
        if (localAdmin && localAdmin.length > 0) {
          const inactiveIds = new Set(
            localAdmin
              .filter((p) => !p.isActive || p.status === "ARCHIVED")
              .map((p) => p.id)
          );
          // Remove any garment marked inactive/archived by admin
          transformed = transformed.filter((p) => !inactiveIds.has(p.id));

          // Merge active admin products
          localAdmin.forEach((adminP) => {
            if (adminP.isActive && adminP.status !== "ARCHIVED") {
              const prodData = transformAdminProductToProductData(adminP);
              const idx = transformed.findIndex((p) => p.id === adminP.id || p.slug === adminP.slug);
              if (idx !== -1) {
                transformed[idx] = { ...transformed[idx], ...prodData };
              } else {
                transformed.unshift(prodData);
              }
            }
          });
        }
      } catch (e) {
        console.warn("[ProductService] Failed to merge local admin products:", e);
      }
    }

    // Client-side filter refinements
    if (filters?.inStockOnly) {
      transformed = transformed.filter((p) => (p.stockQuantity ?? p.stock) > 0);
    }

    if (filters?.category) {
      transformed = transformed.filter(
        (p) =>
          p.categorySlug === filters.category ||
          p.categoryData?.slug === filters.category ||
          p.categoryData?.id === filters.category
      );
    }

    if (filters?.search) {
      const q = filters.search.trim().toLowerCase();
      transformed = transformed.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return transformed;
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

    // Check admin-created products (in browser or local storage)
    if (typeof window !== "undefined") {
      try {
        const localProds = AdminService.getLocalProducts();
        const found = localProds.find((p) => p.slug === slug || p.id === slug);
        if (found && found.isActive && found.status !== "ARCHIVED") {
          return transformAdminProductToProductData(found);
        }
      } catch {}
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
    if (typeof window !== "undefined") {
      try {
        const localProds = AdminService.getLocalProducts();
        const found = localProds.find((p) => p.id === id || p.slug === id);
        if (found && found.isActive && found.status !== "ARCHIVED") {
          return transformAdminProductToProductData(found);
        }
      } catch {}
    }

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
      const all = await this.getAllProducts({ category: slug });
      const page = Number(params.page) || 1;
      const limit = Number(params.limit) || 12;
      const start = (page - 1) * limit;
      const paginated = all.slice(start, start + limit);
      return {
        category: null,
        products: paginated,
        pagination: {
          page,
          limit,
          total: all.length,
          totalPages: Math.max(1, Math.ceil(all.length / limit)),
          hasNextPage: start + limit < all.length,
          hasPreviousPage: page > 1,
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
