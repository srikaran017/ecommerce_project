/**
 * Complete Wishlist Engine Types & Models
 * Specification Reference: document/15.wishlist_api_details.md
 */

export interface WishlistImage {
  id: string;
  url: string;
  isThumbnail?: boolean;
  altText?: string;
}

export interface WishlistCategory {
  id: string;
  name: string;
  slug: string;
}

export interface WishlistVariantAttribute {
  attribute: string;
  attributeSlug: string;
  value: string;
}

export interface WishlistVariantPrice {
  regular: number;
  sale: number;
  effective: number;
  discountPercentage?: number;
}

export interface WishlistVariant {
  id: string;
  sku: string;
  name: string;
  stockQuantity: number;
  price: WishlistVariantPrice;
  attributes: WishlistVariantAttribute[];
}

export interface WishlistPricing {
  regularPrice: number;
  salePrice: number;
  offerPrice: number | null;
  effectivePrice: number;
  discountPercentage: number;
  currency: string;
}

export interface WishlistItem {
  wishlistItemId: string;
  productId: string;
  addedAt: string;
  name: string;
  slug: string;
  brand: string;
  sku: string;
  thumbnail: string;
  images: WishlistImage[];
  category: WishlistCategory;
  hasVariants: boolean;
  availableSizes: string[];
  availableColors: string[];
  variantsCount: number;
  variants: WishlistVariant[];
  stockQuantity: number;
  isOutOfStock: boolean;
  pricing: WishlistPricing;
}

export interface WishlistPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface WishlistMeta {
  wishlistId?: string;
}

export interface WishlistResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: WishlistItem[];
  pagination: WishlistPagination;
  meta?: WishlistMeta;
}

export interface WishlistIdsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: string[];
}

export interface WishlistToggleResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    inWishlist: boolean;
    message: string;
    productId: string;
  };
}

export interface WishlistAddResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    id: string;
    wishlistId: string;
    productId: string;
    createdAt: string;
    isNew?: boolean;
  };
}

export interface WishlistAddToCartInput {
  variantId?: string | null;
  quantity?: number;
  moveToCart?: boolean;
}

export interface WishlistAddToCartResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    id: string;
    itemCount: number;
    lineItemCount?: number;
    subtotal: number;
    total: number;
    items?: any[];
  };
  meta?: {
    moved: boolean;
  };
}

export interface WishlistAnalyticsItem {
  productId: string;
  wishlistCount: number;
  name: string;
  slug: string;
  brand: string;
  category: string;
  regularPrice: number;
  salePrice: number;
  stockQuantity: number;
  thumbnail: string;
}

export interface WishlistAnalyticsData {
  totalWishlistItems: number;
  totalCustomersWithWishlists: number;
  topWishlistedProducts: WishlistAnalyticsItem[];
}

export interface WishlistAnalyticsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: WishlistAnalyticsData;
  meta?: {
    fromCache?: boolean;
    ttl?: number;
  };
}

export type WishlistSortOption =
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc";

export type WishlistInStockFilter = "all" | "true" | "false";

export interface WishlistQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: WishlistSortOption;
  inStock?: WishlistInStockFilter;
}
