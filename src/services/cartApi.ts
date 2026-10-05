/**
 * Cart Domain API Client & TypeScript Interfaces
 * Supports both Guest Shoppers (x-guest-cart-token) and Authenticated Customers (Bearer token)
 * Backend endpoints: /api/v1/cart, /api/v1/cart/items, /api/v1/cart/merge, etc.
 */

export type MetafieldValueType = "STRING" | "NUMBER" | "BOOLEAN" | "JSON";

export type AvailabilityStatus =
  | "AVAILABLE"
  | "OUT_OF_STOCK"
  | "INSUFFICIENT_STOCK";

export interface CartMetafield {
  id: string;
  namespace: string;
  key: string;
  value: string;
  valueType: MetafieldValueType;
}

export interface SelectedModifier {
  id: string;
  name: string;
  groupName: string;
  priceDelta: number;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    brand: string | null;
    sku: string | null;
    thumbnail: string | null;
  };
  variant: {
    id: string;
    sku: string;
    name: string | null;
    attributes: Array<{
      attribute: string;
      attributeSlug: string;
      value: string;
      valueSlug: string;
    }>;
  } | null;
  selectedModifiers: SelectedModifier[];
  pricing: {
    unitPrice: number;
    regularPrice: number;
    salePrice: number | null;
    offerPrice: number | null;
    modifierTotal: number;
    lineTotal: number;
  };
  availability: {
    status: AvailabilityStatus;
    availableQuantity: number;
  };
  metafields: CartMetafield[];
}

export interface Cart {
  id: string | null;
  guestToken: string | null;
  customerId: string | null;
  status: "ACTIVE" | "CONVERTED" | "ABANDONED" | "EXPIRED";
  currency: string;
  itemCount: number;
  lineItemCount: number;
  subtotal: number;
  modifiersTotal: number;
  discounts: any[];
  shipping: number | null;
  tax: number | null;
  total: number;
  items: CartItem[];
  metafields: CartMetafield[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AddToCartPayload {
  productId: string;
  variantId?: string | null;
  quantity?: number;
  modifierOptionIds?: string[];
  metafields?: Array<{
    namespace: string;
    key: string;
    value: string;
    valueType?: MetafieldValueType;
  }>;
}

export interface UpdateCartItemPayload {
  quantity?: number;
  modifierOptionIds?: string[];
}

import { getApiBaseUrl } from "@/services/apiConfig";

const getBaseUrl = getApiBaseUrl;

const GUEST_CART_TOKEN_KEY = "guest_cart_token";

/**
 * Get saved guest cart token
 */
export function getSavedGuestCartToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(GUEST_CART_TOKEN_KEY);
}

/**
 * Set saved guest cart token
 */
export function setSavedGuestCartToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(GUEST_CART_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(GUEST_CART_TOKEN_KEY);
  }
}

/**
 * Base Cart API Fetch Helper
 * Attaches Authorization Bearer or x-guest-cart-token automatically
 * Captures x-guest-cart-token response headers
 */
export async function cartApiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data?: T; message?: string; error?: any }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (typeof window !== "undefined") {
    // 1. Customer token check
    const customerToken =
      localStorage.getItem("auth_access_token") ||
      localStorage.getItem("access_token");

    if (customerToken) {
      headers["Authorization"] = `Bearer ${customerToken}`;
    } else {
      // 2. Guest token check
      const guestToken = getSavedGuestCartToken();
      if (guestToken) {
        headers["x-guest-cart-token"] = guestToken;
      }
    }
  }

  try {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      ...options,
      headers,
    });

    // Capture guest token from response header
    const returnedGuestHeader = response.headers.get("x-guest-cart-token");
    if (returnedGuestHeader) {
      setSavedGuestCartToken(returnedGuestHeader);
    }

    const result = await response.json().catch(() => ({}));

    // Capture guest token from response body if present
    if (result?.data?.guestToken) {
      setSavedGuestCartToken(result.data.guestToken);
    }

    return {
      ok: response.ok,
      status: response.status,
      data: result?.data,
      message: result?.message,
      error: result?.error,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      message: err.message || "Network request failed",
      error: err,
    };
  }
}

/**
 * Cart API Service Methods
 */
export const CartApi = {
  /**
   * 1. Get Active Cart (GET /cart)
   */
  async getActiveCart(): Promise<Cart | null> {
    const res = await cartApiFetch<Cart>("/cart", { method: "GET" });
    if (res.ok && res.data) {
      return res.data;
    }
    return null;
  },

  /**
   * 2. Initialize / Retrieve Cart (POST /cart)
   */
  async initCart(): Promise<Cart | null> {
    const res = await cartApiFetch<Cart>("/cart", { method: "POST" });
    if (res.ok && res.data) {
      return res.data;
    }
    return null;
  },

  /**
   * 3. Add Item to Cart (POST /cart/items)
   */
  async addItem(payload: AddToCartPayload): Promise<Cart | null> {
    const res = await cartApiFetch<Cart>("/cart/items", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.ok && res.data) {
      return res.data;
    }
    throw new Error(res.message || "Failed to add item to bag");
  },

  /**
   * 4. Update Cart Item Quantity or Modifiers (PATCH /cart/items/:itemId)
   */
  async updateItem(
    itemId: string,
    payload: UpdateCartItemPayload
  ): Promise<Cart | null> {
    const res = await cartApiFetch<Cart>(`/cart/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (res.ok && res.data) {
      return res.data;
    }
    throw new Error(res.message || "Failed to update item");
  },

  /**
   * 5. Remove Item from Cart (DELETE /cart/items/:itemId)
   */
  async removeItem(itemId: string): Promise<Cart | null> {
    const res = await cartApiFetch<Cart>(`/cart/items/${itemId}`, {
      method: "DELETE",
    });
    if (res.ok && res.data) {
      return res.data;
    }
    throw new Error(res.message || "Failed to remove item");
  },

  /**
   * 6. Clear Entire Cart (DELETE /cart/items)
   */
  async clearCart(): Promise<Cart | null> {
    const res = await cartApiFetch<Cart>("/cart/items", {
      method: "DELETE",
    });
    if (res.ok && res.data) {
      return res.data;
    }
    throw new Error(res.message || "Failed to clear bag");
  },

  /**
   * 7. Merge Guest Cart into Customer Cart (POST /cart/merge)
   */
  async mergeGuestCart(guestToken: string): Promise<Cart | null> {
    const res = await cartApiFetch<Cart>("/cart/merge", {
      method: "POST",
      body: JSON.stringify({ guestToken }),
    });
    if (res.ok && res.data) {
      // Clear guest token as cart is now consolidated under customer account
      setSavedGuestCartToken(null);
      return res.data;
    }
    return null;
  },

  /**
   * 8. Cart-Level Metafield: Upsert (POST /cart/metafields)
   */
  async upsertCartMetafield(metafield: {
    namespace: string;
    key: string;
    value: string;
    valueType?: MetafieldValueType;
  }): Promise<CartMetafield | null> {
    const res = await cartApiFetch<CartMetafield>("/cart/metafields", {
      method: "POST",
      body: JSON.stringify({
        valueType: "STRING",
        ...metafield,
      }),
    });
    return res.ok && res.data ? res.data : null;
  },

  /**
   * 9. Delete Cart Metafield (DELETE /cart/metafields/:metafieldId)
   */
  async deleteCartMetafield(metafieldId: string): Promise<boolean> {
    const res = await cartApiFetch(`/cart/metafields/${metafieldId}`, {
      method: "DELETE",
    });
    return res.ok;
  },
};
