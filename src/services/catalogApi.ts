/**
 * Category & Product Discovery API Service (Customer-Facing)
 * Handles integration with category hierarchy, faceted product discovery, and product details.
 */

import { AuthService } from "@/services/auth.service";
import { getApiBaseUrl } from "@/services/apiConfig";
import { storeConfig } from "@/config/store.config";
import { getProductFallbackImage } from "@/utils/image.utils";

const getBaseUrl = getApiBaseUrl;

// 3-Tier Pricing Model
export interface ApiPrice {
  regular: number;
  sale: number | null;
  offer: number | null;
  effective: number;
  discountPercentage: number;
}

// Standardized Pagination Structure
export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Category Hierarchy
export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  productCount?: number;
  children?: ApiCategory[];
  parent?: {
    id: string;
    name: string;
    slug: string;
    parent?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  } | null;
}

// Dynamic Filter Facets & Filter Engine Types (Document 32)
export interface FilterCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  productCount: number;
}

export interface FilterBrand {
  name: string;
  count: number;
}

export interface AttributeFilterValue {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface AttributeFilterGroup {
  id: string;
  name: string;
  slug: string;
  values: AttributeFilterValue[];
}

export interface FilterRating {
  rating: number;
  label: string;
  count: number;
}

export interface FilterAvailability {
  inStock: number;
  outOfStock: number;
}

export interface CatalogFilterResponse {
  totalProducts: number;
  category: { id: string; name: string; slug: string } | null;
  priceRange: { min: number; max: number };
  categories: FilterCategory[];
  brands: FilterBrand[];
  attributes: AttributeFilterGroup[];
  ratings: FilterRating[];
  availability: FilterAvailability;
}

export interface CatalogFilterQueryParams {
  category?: string;
  search?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean | string;
  rating?: number | string;
}

// Lightweight Product Card (Listing / PLP)
export interface ApiProductCard {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  thumbnail: string;
  price: ApiPrice;
  rating?: number;
  reviewCount?: number;
  hasVariants: boolean;
  hasModifiers: boolean;
  requiresConfiguration: boolean;
  isWishlisted: boolean;
}

// Product Variant
export interface ApiVariant {
  id: string;
  sku: string;
  name: string;
  price: ApiPrice;
  stockQuantity: number;
  inStock: boolean;
  images: Array<{
    id?: string;
    url: string;
    altText?: string | null;
    isThumbnail?: boolean;
    sortOrder?: number;
  }>;
  attributes: Array<{
    attribute: string;
    attributeSlug: string;
    value: string;
    valueSlug: string;
  }>;
}

// Dynamic Product Attribute
export interface ApiAttribute {
  attribute: string;
  attributeSlug: string;
  value: string;
  valueSlug: string;
}

// Modifier Option
export interface ApiModifierOption {
  id: string;
  name: string;
  priceDelta: number;
  isDefault: boolean;
  sortOrder?: number;
}

// Modifier Group
export interface ApiModifierGroup {
  id: string;
  name: string;
  displayName?: string;
  type?: string;
  isRequired: boolean;
  minSelection: number;
  maxSelection: number;
  defaultValue?: string | null;
  config?: {
    maxLength?: number;
    minLength?: number;
    minValue?: number;
    maxValue?: number;
    placeholder?: string;
    allowedExtensions?: string[];
  } | null;
  sortOrder?: number;
  options: ApiModifierOption[];
}

// Complete Product Details (PDP)
export interface ApiProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  sku: string;
  category: {
    id: string;
    name: string;
    slug: string;
    parent?: {
      id: string;
      name: string;
      slug: string;
      parent?: any;
    } | null;
  };
  price: ApiPrice;
  stockQuantity: number;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  hasVariants: boolean;
  hasModifiers: boolean;
  requiresConfiguration: boolean;
  isWishlisted: boolean;
  images: Array<{
    id: string;
    url: string;
    altText?: string | null;
    isThumbnail?: boolean;
    sortOrder?: number;
    variantId?: string | null;
  }>;
  variants: ApiVariant[];
  attributes: ApiAttribute[];
  modifierGroups: ApiModifierGroup[];
}

// Helper to attach token if user is logged in
export const getHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token =
      AuthService.getAccessToken() ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("auth_access_token");

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
};

// 1. Fetch Category Tree or Roots for Navigation / Mega-Menus
export const fetchCategoryTree = async (options?: {
  tree?: boolean;
  rootOnly?: boolean;
}): Promise<ApiCategory[]> => {
  const query = new URLSearchParams();
  if (options?.tree) query.append("tree", "true");
  if (options?.rootOnly) query.append("rootOnly", "true");

  const queryString = query.toString() ? `?${query.toString()}` : "";
  const res = await fetch(`${getBaseUrl()}/categories${queryString}`, {
    headers: getHeaders(),
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch categories");
  }
  return data.data;
};

// 2. Fetch Single Category Details (with Breadcrumb Hierarchy)
export const fetchCategoryBySlug = async (slug: string): Promise<ApiCategory> => {
  const res = await fetch(`${getBaseUrl()}/categories/${encodeURIComponent(slug)}`, {
    headers: getHeaders(),
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Category not found");
  }
  return data.data;
};

// 3. Fetch Category Products (Category PLP)
export const fetchCategoryProducts = async (
  slug: string,
  params: Record<string, any> = {}
): Promise<{
  category: ApiCategory;
  products: ApiProductCard[];
  pagination: ApiPagination;
}> => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString() ? `?${query.toString()}` : "";
  const res = await fetch(
    `${getBaseUrl()}/categories/${encodeURIComponent(slug)}/products${queryString}`,
    {
      headers: getHeaders(),
      cache: "no-store",
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch category products");
  }

  return {
    category: data.data?.category,
    products: data.data?.products || [],
    pagination: data.pagination || {
      page: 1,
      limit: 24,
      total: data.data?.products?.length || 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
};

// 4. Fetch Products with Faceted Filtering, Sort, and Dynamic Attributes
export const fetchProducts = async (
  params: Record<string, any> = {}
): Promise<{
  products: ApiProductCard[];
  pagination: ApiPagination;
}> => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString() ? `?${query.toString()}` : "";
  const res = await fetch(`${getBaseUrl()}/products${queryString}`, {
    headers: getHeaders(),
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to fetch products");
  }

  return {
    products: data.data || [],
    pagination: data.pagination || {
      page: 1,
      limit: 24,
      total: data.data?.length || 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
};

// 4b. Fetch All Products Across All Pages (Auto-Paginating Multi-Page Fetch)
export const fetchAllProducts = async (
  params: Record<string, any> = {}
): Promise<ApiProductCard[]> => {
  // Request first page with backend maximum limit (100 items per page)
  const firstPage = await fetchProducts({ ...params, limit: 100, page: 1 });
  const allProducts: ApiProductCard[] = [...(firstPage.products || [])];

  // If backend indicates additional pages exist, fetch remaining pages in parallel
  if (firstPage.pagination && firstPage.pagination.totalPages > 1) {
    const pagePromises: Promise<{ products: ApiProductCard[] }>[] = [];
    for (let p = 2; p <= firstPage.pagination.totalPages; p++) {
      pagePromises.push(
        fetchProducts({ ...params, limit: 100, page: p }).catch((err) => {
          console.warn(`[fetchAllProducts] Page ${p} fetch failed:`, err);
          return { products: [], pagination: {} as any };
        })
      );
    }
    const pageResults = await Promise.all(pagePromises);
    for (const res of pageResults) {
      if (res.products && Array.isArray(res.products)) {
        allProducts.push(...res.products);
      }
    }
  }

  // Deduplicate products by unique ID to safeguard against overlapping page results
  const seen = new Set<string>();
  return allProducts.filter((p) => {
    if (!p.id || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
};

// 5. Fetch Full Product Details Page (PDP)
export const fetchProductBySlug = async (
  slug: string
): Promise<ApiProductDetail> => {
  const res = await fetch(`${getBaseUrl()}/products/${encodeURIComponent(slug)}`, {
    headers: getHeaders(),
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Product not found");
  }
  return data.data;
};

// 6. Fetch Dynamic Catalog Filter Options (Facets, Price Bounds, Brands, Attributes)
export const fetchCatalogFilters = async (
  params?: CatalogFilterQueryParams
): Promise<CatalogFilterResponse> => {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.search) query.set("search", params.search);
  if (params?.brand) query.set("brand", params.brand);
  if (params?.minPrice !== undefined) query.set("minPrice", String(params.minPrice));
  if (params?.maxPrice !== undefined) query.set("maxPrice", String(params.maxPrice));
  if (params?.inStock !== undefined) query.set("inStock", String(params.inStock));
  if (params?.rating !== undefined) query.set("rating", String(params.rating));

  const queryString = query.toString() ? `?${query.toString()}` : "";
  const res = await fetch(`${getBaseUrl()}/products/filters${queryString}`, {
    headers: getHeaders(),
    next: { revalidate: 300 },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to load catalog filters");
  }
  return data.data;
};

// 7. Fetch Dynamic Category Filter Options (Scoped to specific category & descendants)
export const fetchCategoryFilters = async (
  slug: string,
  params?: Omit<CatalogFilterQueryParams, "category">
): Promise<CatalogFilterResponse> => {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.brand) query.set("brand", params.brand);
  if (params?.minPrice !== undefined) query.set("minPrice", String(params.minPrice));
  if (params?.maxPrice !== undefined) query.set("maxPrice", String(params.maxPrice));
  if (params?.inStock !== undefined) query.set("inStock", String(params.inStock));
  if (params?.rating !== undefined) query.set("rating", String(params.rating));

  const queryString = query.toString() ? `?${query.toString()}` : "";
  const res = await fetch(
    `${getBaseUrl()}/categories/${encodeURIComponent(slug)}/filters${queryString}`,
    {
      headers: getHeaders(),
      next: { revalidate: 300 },
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to load category filters");
  }
  return data.data;
};

// Transformers for backward & forward compatibility with existing components
export function transformApiCardToProduct(card: ApiProductCard): any {
  const regular = card.price?.regular ?? card.price?.effective ?? 0;
  const effective = card.price?.effective ?? 0;

  const validThumbnail =
    card.thumbnail && typeof card.thumbnail === "string" && card.thumbnail.trim().length > 0 && card.thumbnail !== "null"
      ? card.thumbnail.trim()
      : null;

  const resolvedThumb = validThumbnail || getProductFallbackImage(card);

  return {
    id: card.id,
    name: card.name,
    slug: card.slug,
    description: card.name,
    brand: card.brand || storeConfig.name,
    price: effective,
    compareAtPrice: regular > effective ? regular : null,
    priceObject: card.price,
    gender: "UNISEX",
    tags: [],
    categorySlug: card.category?.slug || "",
    categoryName: card.category?.name || "Apparel",
    stock: 20,
    images: [{ url: resolvedThumb, isPrimary: true, altText: card.name }],
    thumbnail: resolvedThumb,
    variants: [],
    hasVariants: card.hasVariants,
    hasModifiers: card.hasModifiers,
    requiresConfiguration: card.requiresConfiguration,
    isWishlisted: card.isWishlisted ?? false,
    averageRating: card.rating || 5,
    reviewsCount: card.reviewCount || 0,
    inStock: true,
  };
}

export function transformApiDetailToProduct(detail: ApiProductDetail): any {
  const regular = detail.price?.regular ?? detail.price?.effective ?? 0;
  const effective = detail.price?.effective ?? 0;

  const images = (detail.images || [])
    .filter((img) => img && typeof img.url === "string" && img.url.trim().length > 0 && img.url !== "null")
    .map((img) => ({
      id: img.id,
      url: img.url.trim(),
      altText: img.altText || detail.name,
      isPrimary: Boolean(img.isThumbnail),
    }));

  if (images.length === 0) {
    images.push({
      id: "img-default",
      url: getProductFallbackImage(detail),
      altText: detail.name,
      isPrimary: true,
    });
  }

  const variants = (detail.variants || []).map((v) => {
    const sizeAttr = v.attributes?.find((a) => a.attributeSlug === "size")?.value || "Free Size";
    const colorAttr = v.attributes?.find((a) => a.attributeSlug === "color")?.value || "Standard";
    const vEffective = v.price?.effective ?? effective;
    const vRegular = v.price?.regular ?? regular;

    return {
      id: v.id,
      sku: v.sku,
      name: v.name,
      price: vEffective,
      compareAtPrice: vRegular > vEffective ? vRegular : null,
      priceObject: v.price,
      stock: v.stockQuantity,
      inStock: v.inStock,
      size: sizeAttr,
      colorName: colorAttr,
      colorHex: colorAttr.toLowerCase().includes("emerald")
        ? "#046307"
        : colorAttr.toLowerCase().includes("crimson")
        ? "#990000"
        : colorAttr.toLowerCase().includes("navy")
        ? "#000080"
        : undefined,
      imageUrl: v.images?.[0]?.url || images[0]?.url,
      isActive: v.inStock,
      attributes: v.attributes,
    };
  });

  const fabricAttr = detail.attributes?.find((a) => a.attributeSlug === "fabric")?.value;

  return {
    id: detail.id,
    name: detail.name,
    slug: detail.slug,
    description: detail.description,
    sku: detail.sku,
    brand: detail.brand,
    price: effective,
    compareAtPrice: regular > effective ? regular : null,
    priceObject: detail.price,
    gender: "UNISEX",
    tags: detail.attributes?.map((a) => a.value) || [],
    categorySlug: detail.category?.slug || "",
    categoryName: detail.category?.name || "Apparel",
    categoryData: detail.category,
    fabric: fabricAttr,
    stock: detail.stockQuantity,
    stockQuantity: detail.stockQuantity,
    inStock: detail.inStock,
    hasVariants: detail.hasVariants,
    hasModifiers: detail.hasModifiers,
    requiresConfiguration: detail.requiresConfiguration,
    isWishlisted: detail.isWishlisted ?? false,
    averageRating: detail.rating,
    reviewsCount: detail.reviewCount,
    images: images,
    thumbnail: images[0]?.url,
    variants: variants,
    dynamicAttributes: detail.attributes,
    modifierGroups: detail.modifierGroups,
  };
}

