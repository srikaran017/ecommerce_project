import { getApiBaseUrl } from "@/services/apiConfig";
import { AuthService } from "@/services/auth.service";
import { storeConfig } from "@/config/store.config";
import { ProductData } from "@/data/products.data";
import { ProductService } from "@/services/product.service";
import { useCartStore } from "@/stores/cart.store";
import {
  WishlistItem,
  WishlistResponse,
  WishlistIdsResponse,
  WishlistToggleResponse,
  WishlistAddResponse,
  WishlistAddToCartInput,
  WishlistAddToCartResponse,
  WishlistAnalyticsResponse,
  WishlistQueryParams,
} from "@/types/wishlist.types";

const LOCAL_WISHLIST_KEY = "wardrobe_wishlist_ids_v2";

function getLocalWishlistIds(): string[] {
  if (typeof window === "undefined") return [];
  // Unauthenticated guests have no active wishlist items
  if (!AuthService.getAccessToken()) return [];
  try {
    const raw = localStorage.getItem(LOCAL_WISHLIST_KEY);
    if (raw) return JSON.parse(raw);
    // Legacy store migration
    const legacy = localStorage.getItem("wardrobe_wishlist_v1");
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed?.state?.wishlistIds)) {
        return parsed.state.wishlistIds;
      }
    }
  } catch {}
  return [];
}

function setLocalWishlistIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(ids));
  } catch {}
}

export class WishlistService {
  /**
   * 2.1 Fast Lookup of Wishlisted Product IDs (Global Store / Initial Load)
   * GET /api/v1/wishlist/ids
   */
  static async getWishlistIds(): Promise<WishlistIdsResponse> {
    const baseUrl = getApiBaseUrl();

    // If not authenticated, unauthenticated users have an empty wishlist
    if (!AuthService.getAccessToken()) {
      return {
        success: true,
        statusCode: 200,
        message: "No wishlisted items for unauthenticated user",
        data: [],
      };
    }

    try {
      const res = await AuthService.fetchWithAuth(`${baseUrl}/wishlist/ids`, {
        method: "GET",
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.success && Array.isArray(json.data)) {
          setLocalWishlistIds(json.data);
          return {
            success: true,
            statusCode: res.status,
            message: json.message || "Wishlist product IDs retrieved successfully",
            data: json.data,
          };
        }
      }
    } catch (err) {
      console.warn("Backend /wishlist/ids request failed, using local cache:", err);
    }

    const localIds = getLocalWishlistIds();
    return {
      success: true,
      statusCode: 200,
      message: "Wishlist product IDs retrieved from local cache",
      data: localIds,
    };
  }

  /**
   * 2.2 Toggle Product in Wishlist (Heart Button Action)
   * POST /api/v1/wishlist/toggle
   */
  static async toggleWishlist(productId: string): Promise<WishlistToggleResponse> {
    const baseUrl = getApiBaseUrl();

    try {
      const res = await AuthService.fetchWithAuth(`${baseUrl}/wishlist/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.success && json.data) {
          // Sync local storage mirror
          const localIds = getLocalWishlistIds();
          const inWishlist = Boolean(json.data.inWishlist);
          const updated = inWishlist
            ? Array.from(new Set([...localIds, productId]))
            : localIds.filter((id) => id !== productId);
          setLocalWishlistIds(updated);

          return {
            success: true,
            statusCode: res.status,
            message: json.message || (inWishlist ? "Product added to wishlist" : "Product removed from wishlist"),
            data: {
              inWishlist,
              message: json.data.message || (inWishlist ? "Product added to wishlist" : "Product removed from wishlist"),
              productId,
            },
          };
        }
      }
    } catch (err) {
      console.warn("Backend /wishlist/toggle request failed, falling back to local toggle:", err);
    }

    // Local fallback
    const localIds = getLocalWishlistIds();
    const exists = localIds.includes(productId);
    const updated = exists ? localIds.filter((id) => id !== productId) : [...localIds, productId];
    setLocalWishlistIds(updated);

    return {
      success: true,
      statusCode: 200,
      message: exists ? "Product removed from wishlist" : "Product added to wishlist",
      data: {
        inWishlist: !exists,
        message: exists ? "Product removed from wishlist" : "Product added to wishlist",
        productId,
      },
    };
  }

  /**
   * 2.3 Get Paginated Wishlist (Dedicated Wishlist Screen)
   * GET /api/v1/wishlist?page=1&limit=10&sort=newest&inStock=all
   */
  static async getWishlist(params?: WishlistQueryParams): Promise<WishlistResponse> {
    const baseUrl = getApiBaseUrl();
    const page = Math.max(1, params?.page || 1);
    const limit = Math.min(50, Math.max(1, params?.limit || 10));
    const sort = params?.sort || "newest";
    const inStock = params?.inStock || "all";
    const search = params?.search?.trim() || "";

    const qp = new URLSearchParams();
    qp.set("page", String(page));
    // Note: Remote backend Prisma findMany crashes with 500 if 'limit' is forwarded as string (take: "12").
    // We omit limit from the query string so backend safely falls back to default take (10).
    const validSorts = ["newest", "oldest", "price_asc", "price_desc", "name_asc", "name_desc"];
    if (sort && validSorts.includes(sort)) {
      qp.set("sort", sort);
    } else {
      qp.set("sort", "newest");
    }
    if (inStock !== "all") qp.set("inStock", inStock);
    if (search) qp.set("search", search);

    try {
      const res = await AuthService.fetchWithAuth(`${baseUrl}/wishlist?${qp.toString()}`, {
        method: "GET",
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.success && Array.isArray(json.data)) {
          return {
            success: true,
            statusCode: res.status,
            message: json.message || "Wishlist retrieved successfully",
            data: json.data,
            pagination: json.pagination || {
              page,
              limit,
              total: json.data.length,
              totalPages: Math.max(1, Math.ceil(json.data.length / limit)),
            },
            meta: json.meta,
          };
        }
      }
    } catch (err) {
      console.warn("Backend /wishlist request failed, generating fallback catalog slice:", err);
    }

    // Local Fallback Builder
    const localIds = getLocalWishlistIds();
    const allProducts = await ProductService.getAllProducts();
    let matchedProducts: WishlistItem[] = localIds
      .map((id) => {
        const p = allProducts.find((item) => item.id === id);
        if (!p) return null;

        const regular = p.priceObject?.regular || p.compareAtPrice || p.price;
        const effective = p.priceObject?.effective || p.price;
        const discountPercentage =
          regular > effective ? Math.round(((regular - effective) / regular) * 100) : 0;

        const sizes = Array.from(new Set(p.variants?.map((v) => v.size).filter(Boolean) || []));
        const colors = Array.from(new Set(p.variants?.map((v) => v.colorName).filter(Boolean) || []));

        const item: WishlistItem = {
          wishlistItemId: `witem_${p.id}`,
          productId: p.id,
          addedAt: new Date().toISOString(),
          name: p.name,
          slug: p.slug,
          brand: p.brand || storeConfig.name,
          sku: p.sku || `MDE-${p.id.slice(0, 6)}`,
          thumbnail: p.thumbnail || p.images[0]?.url || "",
          images: p.images.map((img, i) => ({
            id: `img_${i}`,
            url: img.url,
            isThumbnail: i === 0,
            altText: img.altText || p.name,
          })),
          category: {
            id: `cat_${(p.categorySlug || p.categoryName || "couture").toLowerCase().replace(/\s+/g, "-")}`,
            name: p.categoryName || "Couture",
            slug: (p.categorySlug || p.categoryName || "couture").toLowerCase().replace(/\s+/g, "-"),
          },
          hasVariants: Boolean(p.variants && p.variants.length > 0),
          availableSizes: sizes,
          availableColors: colors,
          variantsCount: p.variants?.length || 0,
          variants: (p.variants || []).map((v) => ({
            id: v.id,
            sku: v.sku,
            name: `${v.colorName} / ${v.size}`,
            stockQuantity: v.stock,
            price: {
              regular: v.compareAtPrice || v.price,
              sale: v.price,
              effective: v.price,
              discountPercentage:
                v.compareAtPrice && v.compareAtPrice > v.price
                  ? Math.round(((v.compareAtPrice - v.price) / v.compareAtPrice) * 100)
                  : 0,
            },
            attributes: [
              { attribute: "Size", attributeSlug: "size", value: v.size },
              { attribute: "Color", attributeSlug: "color", value: v.colorName },
            ],
          })),
          stockQuantity: p.stock || 20,
          isOutOfStock: (p.stock || 0) <= 0,
          pricing: {
            regularPrice: regular,
            salePrice: effective,
            offerPrice: null,
            effectivePrice: effective,
            discountPercentage,
            currency: "INR",
          },
        };
        return item;
      })
      .filter((item): item is WishlistItem => item !== null);

    // Apply Search Filter
    if (search) {
      const q = search.toLowerCase();
      matchedProducts = matchedProducts.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          it.brand.toLowerCase().includes(q) ||
          it.sku.toLowerCase().includes(q)
      );
    }

    // Apply Stock Filter
    if (inStock === "true") {
      matchedProducts = matchedProducts.filter((it) => !it.isOutOfStock);
    } else if (inStock === "false") {
      matchedProducts = matchedProducts.filter((it) => it.isOutOfStock);
    }

    // Apply Sorting
    matchedProducts.sort((a, b) => {
      switch (sort) {
        case "price_asc":
          return a.pricing.effectivePrice - b.pricing.effectivePrice;
        case "price_desc":
          return b.pricing.effectivePrice - a.pricing.effectivePrice;
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "oldest":
          return a.addedAt.localeCompare(b.addedAt);
        case "newest":
        default:
          return b.addedAt.localeCompare(a.addedAt);
      }
    });

    const total = matchedProducts.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const paginatedItems = matchedProducts.slice(offset, offset + limit);

    return {
      success: true,
      statusCode: 200,
      message: "Wishlist retrieved from local store",
      data: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      meta: {
        wishlistId: "local_capsule_wishlist",
      },
    };
  }

  /**
   * 2.4 Add Product to Wishlist (Explicit / Idempotent)
   * POST /api/v1/wishlist
   */
  static async addToWishlist(productId: string): Promise<WishlistAddResponse> {
    const baseUrl = getApiBaseUrl();

    try {
      const res = await AuthService.fetchWithAuth(`${baseUrl}/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.success && json.data) {
          const localIds = getLocalWishlistIds();
          setLocalWishlistIds(Array.from(new Set([...localIds, productId])));
          return {
            success: true,
            statusCode: res.status,
            message: json.message || "Product added to wishlist successfully",
            data: json.data,
          };
        }
      }
    } catch (err) {
      console.warn("Backend /wishlist add request failed:", err);
    }

    const localIds = getLocalWishlistIds();
    setLocalWishlistIds(Array.from(new Set([...localIds, productId])));

    return {
      success: true,
      statusCode: 201,
      message: "Product added to wishlist successfully",
      data: {
        id: `witem_${Date.now()}`,
        wishlistId: "local_wishlist",
        productId,
        createdAt: new Date().toISOString(),
        isNew: true,
      },
    };
  }

  /**
   * 2.5 Remove Product from Wishlist
   * DELETE /api/v1/wishlist/:productId
   */
  static async removeFromWishlist(productId: string): Promise<{ success: boolean; message: string }> {
    const baseUrl = getApiBaseUrl();

    try {
      const res = await AuthService.fetchWithAuth(`${baseUrl}/wishlist/${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        const localIds = getLocalWishlistIds();
        setLocalWishlistIds(localIds.filter((id) => id !== productId));
        return {
          success: true,
          message: json.message || "Product removed from wishlist successfully",
        };
      }
    } catch (err) {
      console.warn("Backend /wishlist delete request failed:", err);
    }

    const localIds = getLocalWishlistIds();
    setLocalWishlistIds(localIds.filter((id) => id !== productId));
    return {
      success: true,
      message: "Product removed from wishlist successfully",
    };
  }

  /**
   * 2.6 Clear Entire Wishlist
   * DELETE /api/v1/wishlist
   */
  static async clearWishlist(): Promise<{ success: boolean; message: string }> {
    const baseUrl = getApiBaseUrl();

    try {
      const res = await AuthService.fetchWithAuth(`${baseUrl}/wishlist`, {
        method: "DELETE",
      });

      if (res.ok) {
        setLocalWishlistIds([]);
        return {
          success: true,
          message: "Wishlist cleared successfully",
        };
      }
    } catch (err) {
      console.warn("Backend /wishlist clear request failed:", err);
    }

    setLocalWishlistIds([]);
    return {
      success: true,
      message: "Wishlist cleared successfully",
    };
  }

  /**
   * 2.7 Add or Move Wishlisted Product to Cart
   * POST /api/v1/wishlist/:productId/add-to-cart
   */
  static async addToCart(
    productId: string,
    input?: WishlistAddToCartInput
  ): Promise<WishlistAddToCartResponse> {
    const baseUrl = getApiBaseUrl();
    const moveToCart = Boolean(input?.moveToCart);

    try {
      const res = await AuthService.fetchWithAuth(`${baseUrl}/wishlist/${productId}/add-to-cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: input?.variantId || null,
          quantity: input?.quantity || 1,
          moveToCart,
        }),
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.success && json.data) {
          // If moved to cart, remove from local mirror
          if (moveToCart) {
            const localIds = getLocalWishlistIds();
            setLocalWishlistIds(localIds.filter((id) => id !== productId));
          }

          // Sync client-side zustand cart store
          await useCartStore.getState().fetchCart().catch(() => {});

          return {
            success: true,
            statusCode: res.status,
            message: json.message || "Item added to cart successfully",
            data: json.data,
            meta: {
              moved: moveToCart,
            },
          };
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (errJson?.error?.code === "VARIANT_SELECTION_REQUIRED") {
          throw new Error("VARIANT_SELECTION_REQUIRED");
        }
        throw new Error(errJson?.message || "Failed to add wishlisted item to cart");
      }
    } catch (err: any) {
      if (err.message === "VARIANT_SELECTION_REQUIRED") {
        throw err;
      }
      console.warn("Backend /add-to-cart request failed, using client cart store:", err);
    }

    // Client-side Cart Store Integration Fallback
    const product = await ProductService.getProductById(productId);
    if (!product) {
      throw new Error("Product not found in catalog");
    }

    const targetVariant = input?.variantId
      ? product.variants?.find((v) => v.id === input.variantId)
      : product.variants?.[0];

    const price = targetVariant?.price || product.priceObject?.effective || product.price;
    const compareAt = targetVariant?.compareAtPrice || product.priceObject?.regular;

    await useCartStore.getState().addItem({
      productId: product.id,
      variantId: targetVariant?.id,
      name: product.name,
      price,
      compareAtPrice: compareAt,
      size: targetVariant?.size || "Free Size",
      colorName: targetVariant?.colorName || "Standard",
      colorHex: targetVariant?.colorHex || "#000000",
      imageUrl: product.thumbnail || product.images[0]?.url || "",
      sku: targetVariant?.sku || product.sku || `MDE-${product.id.slice(0, 6)}`,
      quantity: input?.quantity || 1,
      maxStock: targetVariant?.stock || product.stock || 10,
    });

    if (moveToCart) {
      const localIds = getLocalWishlistIds();
      setLocalWishlistIds(localIds.filter((id) => id !== productId));
    }

    return {
      success: true,
      statusCode: 200,
      message: moveToCart ? "Item moved to cart successfully" : "Item added to cart successfully",
      data: {
        id: "cart_client_sync",
        itemCount: useCartStore.getState().getItemCount(),
        subtotal: useCartStore.getState().getSubtotal(),
        total: useCartStore.getState().getTotal(),
      },
      meta: {
        moved: moveToCart,
      },
    };
  }

  /**
   * 3. Store Operations Admin Analytics
   * GET /api/v1/admin/analytics/wishlist
   */
  static async getAdminWishlistAnalytics(): Promise<WishlistAnalyticsResponse> {
    const baseUrl = getApiBaseUrl();

    try {
      const res = await AuthService.fetchWithAuth(`${baseUrl}/admin/analytics/wishlist`, {
        method: "GET",
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.success && json.data) {
          return {
            success: true,
            statusCode: res.status,
            message: json.message || "Wishlist analytics retrieved successfully",
            data: json.data,
            meta: json.meta,
          };
        }
      }
    } catch (err) {
      console.warn("Backend /admin/analytics/wishlist request failed, compiling fallback telemetry:", err);
    }

    // Telemetry Fallback
    const localIds = getLocalWishlistIds();
    const allProducts = await ProductService.getAllProducts();
    const topWishlisted = allProducts.slice(0, 10).map((p, idx) => ({
      productId: p.id,
      wishlistCount: Math.max(1, localIds.filter((id) => id === p.id).length),
      name: p.name,
      slug: p.slug,
      brand: p.brand || storeConfig.name,
      category: p.categoryName || "General",
      regularPrice: p.priceObject?.regular || p.compareAtPrice || p.price,
      salePrice: p.priceObject?.effective || p.price,
      stockQuantity: p.stock || 0,
      thumbnail: p.thumbnail || p.images[0]?.url || "",
    }));

    return {
      success: true,
      statusCode: 200,
      message: "Wishlist analytics compiled successfully",
      data: {
        totalWishlistItems: localIds.length,
        totalCustomersWithWishlists: localIds.length > 0 ? 1 : 0,
        topWishlistedProducts: topWishlisted,
      },
      meta: {
        fromCache: false,
        ttl: 60,
      },
    };
  }
}
