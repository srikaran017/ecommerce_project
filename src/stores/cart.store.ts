import { create } from "zustand";
import { persist } from "zustand/middleware";
import { storeConfig } from "@/config/store.config";
import {
  Cart as ApiCart,
  CartItem as ApiCartItem,
  CartApi,
  SelectedModifier,
  AvailabilityStatus,
  CartMetafield,
  getSavedGuestCartToken,
  setSavedGuestCartToken,
} from "@/services/cartApi";

export interface CartItem {
  id: string; // Line item identifier
  productId: string;
  variantId?: string | null;
  name: string;
  price: number;
  compareAtPrice?: number;
  size: string;
  colorName: string;
  colorHex?: string;
  imageUrl: string;
  sku: string;
  quantity: number;
  maxStock: number;

  // Authoritative Backend Metadata
  selectedModifiers?: SelectedModifier[];
  pricing?: {
    unitPrice: number;
    regularPrice: number;
    salePrice: number | null;
    offerPrice: number | null;
    modifierTotal: number;
    lineTotal: number;
  };
  availability?: {
    status: AvailabilityStatus;
    availableQuantity: number;
  };
  metafields?: CartMetafield[];
}

export interface AppliedCoupon {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  calculatedDiscount: number;
}

export interface AddItemInput {
  productId: string;
  variantId?: string | null;
  name?: string;
  price?: number;
  compareAtPrice?: number;
  size?: string;
  colorName?: string;
  colorHex?: string;
  imageUrl?: string;
  sku?: string;
  quantity?: number;
  maxStock?: number;
  modifierOptionIds?: string[];
  selectedModifiers?: SelectedModifier[];
  metafields?: Array<{
    namespace: string;
    key: string;
    value: string;
  }>;
}

interface CartState {
  items: CartItem[];
  apiCart: ApiCart | null;
  appliedCoupon: AppliedCoupon | null;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCart: () => Promise<void>;
  addItem: (item: AddItemInput) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  updateModifiers: (id: string, modifierOptionIds: string[]) => Promise<void>;
  clearCart: () => Promise<void>;
  mergeGuestCartOnLogin: (token?: string) => Promise<void>;
  saveGiftMessage: (message: string) => Promise<boolean>;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Computed Getters
  getSubtotal: () => number;
  getModifiersTotal: () => number;
  getTaxAmount: () => number;
  getShippingAmount: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  getLineItemCount: () => number;
  getAvailabilityIssues: () => {
    hasOutOfStock: boolean;
    hasInsufficientStock: boolean;
  };
}

function transformApiItemToStoreItem(apiItem: ApiCartItem): CartItem {
  const sizeAttr = apiItem.variant?.attributes?.find(
    (a) => a.attributeSlug === "size" || a.attribute.toLowerCase() === "size"
  );
  const colorAttr = apiItem.variant?.attributes?.find(
    (a) => a.attributeSlug === "color" || a.attribute.toLowerCase() === "color"
  );

  const unitPrice = apiItem.pricing?.unitPrice ?? 0;
  const modifierUnitTotal = apiItem.pricing?.modifierTotal ?? 0;
  const effectiveUnitPrice = unitPrice + modifierUnitTotal;

  return {
    id: apiItem.id,
    productId: apiItem.productId,
    variantId: apiItem.variantId,
    name: apiItem.product.name,
    price: effectiveUnitPrice,
    compareAtPrice:
      apiItem.pricing?.regularPrice && apiItem.pricing.regularPrice > unitPrice
        ? apiItem.pricing.regularPrice + modifierUnitTotal
        : undefined,
    size: sizeAttr?.value || "Standard",
    colorName: colorAttr?.value || "Default",
    imageUrl:
      apiItem.product.thumbnail ||
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
    sku: apiItem.variant?.sku || apiItem.product.sku || "",
    quantity: apiItem.quantity,
    maxStock: apiItem.availability?.availableQuantity || 99,
    selectedModifiers: apiItem.selectedModifiers || [],
    pricing: apiItem.pricing,
    availability: apiItem.availability,
    metafields: apiItem.metafields || [],
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      apiCart: null,
      appliedCoupon: null,
      isOpen: false,
      isLoading: false,
      error: null,

      fetchCart: async () => {
        try {
          set({ isLoading: true, error: null });
          const cart = await CartApi.getActiveCart();
          if (cart && cart.items && cart.items.length > 0) {
            const mappedItems = cart.items.map(transformApiItemToStoreItem);
            set({
              apiCart: cart,
              items: mappedItems,
              isLoading: false,
            });
            return;
          }

          // If backend returns empty cart, NEVER wipe out existing local items!
          const currentItems = get().items;
          if (currentItems.length > 0) {
            set({
              apiCart: null,
              isLoading: false,
            });
            return;
          }

          set({
            apiCart: cart || null,
            items: [],
            isLoading: false,
          });
        } catch (err: any) {
          set({ isLoading: false, error: err.message });
        }
      },

      addItem: async (input) => {
        const qty = input.quantity && input.quantity > 0 ? input.quantity : 1;
        set({ isOpen: false, error: null });

        // Optimistic local update fallback
        const tempId = `temp_${input.productId}_${input.variantId || "default"}_${Date.now()}`;
        const fallbackItem: CartItem = {
          id: tempId,
          productId: input.productId,
          variantId: input.variantId,
          name: input.name || "Handcrafted Luxury Garment",
          price: input.price || 0,
          compareAtPrice: input.compareAtPrice,
          size: input.size || "Standard",
          colorName: input.colorName || "Default",
          colorHex: input.colorHex,
          imageUrl:
            input.imageUrl ||
            "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
          sku: input.sku || "",
          quantity: qty,
          maxStock: input.maxStock || 99,
          selectedModifiers: input.selectedModifiers || [],
        };

        try {
          const updatedCart = await CartApi.addItem({
            productId: input.productId,
            variantId: input.variantId || null,
            quantity: qty,
            modifierOptionIds: input.modifierOptionIds || [],
            metafields: input.metafields,
          });

          if (updatedCart && updatedCart.items && updatedCart.items.length > 0) {
            set({
              apiCart: updatedCart,
              items: updatedCart.items.map(transformApiItemToStoreItem),
            });
            return;
          }
        } catch (err: any) {
          console.warn("Backend add item failed, using local fallback:", err.message);
          set({ error: err.message });
        }

        // Local state fallback if backend request failed
        const existingIdx = get().items.findIndex(
          (i) => i.productId === input.productId && i.variantId === input.variantId
        );

        if (existingIdx > -1) {
          const updated = [...get().items];
          updated[existingIdx].quantity += qty;
          set({ items: updated });
        } else {
          set({ items: [...get().items, fallbackItem] });
        }
      },

      removeItem: async (id) => {
        // Optimistic removal
        const prevItems = get().items;
        const prevCart = get().apiCart;
        set({ items: prevItems.filter((i) => i.id !== id) });

        try {
          // If item is a backend item (valid UUID or not temp), call API
          if (!id.startsWith("temp_")) {
            const updatedCart = await CartApi.removeItem(id);
            if (updatedCart) {
              set({
                apiCart: updatedCart,
                items: (updatedCart.items || []).map(transformApiItemToStoreItem),
              });
              return;
            }
          }
        } catch (err: any) {
          console.warn("Backend remove item failed:", err.message);
          set({ items: prevItems, apiCart: prevCart, error: err.message });
        }
      },

      updateQuantity: async (id, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(id);
          return;
        }

        const prevItems = get().items;
        const prevCart = get().apiCart;

        // Optimistic update
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: Math.min(quantity, i.maxStock || 99) } : i
          ),
        });

        try {
          if (!id.startsWith("temp_")) {
            const updatedCart = await CartApi.updateItem(id, { quantity });
            if (updatedCart && updatedCart.items && updatedCart.items.length > 0) {
              set({
                apiCart: updatedCart,
                items: updatedCart.items.map(transformApiItemToStoreItem),
              });
              return;
            }
          }
        } catch (err: any) {
          console.warn("Backend update quantity failed:", err.message);
          set({ items: prevItems, apiCart: prevCart, error: err.message });
        }
      },

      updateModifiers: async (id, modifierOptionIds) => {
        try {
          if (!id.startsWith("temp_")) {
            const updatedCart = await CartApi.updateItem(id, { modifierOptionIds });
            if (updatedCart) {
              set({
                apiCart: updatedCart,
                items: (updatedCart.items || []).map(transformApiItemToStoreItem),
              });
            }
          }
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      clearCart: async () => {
        set({ items: [], apiCart: null, appliedCoupon: null });
        try {
          await CartApi.clearCart();
        } catch (err) {
          console.warn("Backend clear cart failed:", err);
        }
      },

      mergeGuestCartOnLogin: async (token) => {
        const guestToken = token || getSavedGuestCartToken();
        if (!guestToken) return;

        try {
          const mergedCart = await CartApi.mergeGuestCart(guestToken);
          if (mergedCart) {
            set({
              apiCart: mergedCart,
              items: (mergedCart.items || []).map(transformApiItemToStoreItem),
            });
            setSavedGuestCartToken(null);
          }
        } catch (err) {
          console.warn("Failed to merge guest cart on login:", err);
        }
      },

      saveGiftMessage: async (message) => {
        try {
          const res = await CartApi.upsertCartMetafield({
            namespace: "checkout",
            key: "gift_message",
            value: message,
            valueType: "STRING",
          });
          if (res) {
            // Re-fetch cart to update metafields
            await get().fetchCart();
            return true;
          }
          return false;
        } catch (err) {
          return false;
        }
      },

      applyCoupon: (coupon) => {
        set({ appliedCoupon: coupon });
      },

      removeCoupon: () => {
        set({ appliedCoupon: null });
      },

      openCart: () => {
        set({ isOpen: false });
        if (typeof window !== "undefined") {
          window.location.href = "/cart";
        }
      },
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => {
        if (typeof window !== "undefined") {
          window.location.href = "/cart";
        }
      },

      // Computed Getters
      getSubtotal: () => {
        const apiCart = get().apiCart;
        if (
          apiCart &&
          apiCart.items &&
          apiCart.items.length > 0 &&
          typeof apiCart.subtotal === "number" &&
          apiCart.subtotal > 0
        ) {
          return apiCart.subtotal;
        }
        return get().items.reduce((sum, item) => {
          const unitPrice =
            item.pricing?.unitPrice !== undefined && item.pricing.unitPrice > 0
              ? item.pricing.unitPrice
              : item.price || 0;
          return sum + unitPrice * item.quantity;
        }, 0);
      },

      getModifiersTotal: () => {
        const apiCart = get().apiCart;
        if (
          apiCart &&
          apiCart.items &&
          apiCart.items.length > 0 &&
          typeof apiCart.modifiersTotal === "number" &&
          apiCart.modifiersTotal > 0
        ) {
          return apiCart.modifiersTotal;
        }
        return get().items.reduce((sum, item) => {
          if (item.pricing?.modifierTotal !== undefined && item.pricing.modifierTotal > 0) {
            return sum + item.pricing.modifierTotal * item.quantity;
          }
          if (item.selectedModifiers && item.selectedModifiers.length > 0) {
            const modSum = item.selectedModifiers.reduce(
              (acc, m) => acc + (m.priceDelta || 0),
              0
            );
            return sum + modSum * item.quantity;
          }
          return sum;
        }, 0);
      },

      getDiscountAmount: () => {
        const merchandise = get().getSubtotal() + get().getModifiersTotal();
        const coupon = get().appliedCoupon;
        if (!coupon || merchandise <= 0) return 0;

        if (coupon.discountType === "PERCENTAGE") {
          return Math.round((merchandise * coupon.discountValue) / 100);
        } else {
          return Math.min(coupon.discountValue, merchandise);
        }
      },

      getShippingAmount: () => {
        const apiCart = get().apiCart;
        if (
          apiCart &&
          apiCart.items &&
          apiCart.items.length > 0 &&
          apiCart.shipping !== null &&
          apiCart.shipping !== undefined
        ) {
          return apiCart.shipping;
        }
        const merchandise = get().getSubtotal() + get().getModifiersTotal();
        if (merchandise === 0) return 0;
        if (merchandise >= storeConfig.shipping.freeShippingThreshold) return 0;
        return storeConfig.shipping.flatRate;
      },

      getTaxAmount: () => {
        const apiCart = get().apiCart;
        if (
          apiCart &&
          apiCart.items &&
          apiCart.items.length > 0 &&
          apiCart.tax !== null &&
          apiCart.tax !== undefined
        ) {
          return apiCart.tax;
        }
        const taxableAmount = Math.max(
          0,
          get().getSubtotal() + get().getModifiersTotal() - get().getDiscountAmount()
        );
        if (storeConfig.tax.includedInPrice) return 0;
        return Math.round(
          (taxableAmount * storeConfig.tax.defaultTaxRatePercentage) / 100
        );
      },

      getTotal: () => {
        const apiCart = get().apiCart;
        const discount = get().getDiscountAmount();
        const shipping = get().getShippingAmount();
        const tax = get().getTaxAmount();

        if (
          apiCart &&
          apiCart.items &&
          apiCart.items.length > 0 &&
          typeof apiCart.total === "number" &&
          apiCart.total > 0
        ) {
          return Math.max(0, apiCart.total - discount + (shipping || 0) + (tax || 0));
        }

        const merchandise = get().getSubtotal() + get().getModifiersTotal();
        return Math.max(0, merchandise - discount + (shipping || 0) + (tax || 0));
      },

      getItemCount: () => {
        const apiCart = get().apiCart;
        if (
          apiCart &&
          apiCart.items &&
          apiCart.items.length > 0 &&
          typeof apiCart.itemCount === "number"
        ) {
          return apiCart.itemCount;
        }
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      getLineItemCount: () => {
        const apiCart = get().apiCart;
        if (
          apiCart &&
          apiCart.items &&
          apiCart.items.length > 0 &&
          typeof apiCart.lineItemCount === "number"
        ) {
          return apiCart.lineItemCount;
        }
        return get().items.length;
      },

      getAvailabilityIssues: () => {
        const items = get().items;
        const hasOutOfStock = items.some(
          (i) => i.availability?.status === "OUT_OF_STOCK"
        );
        const hasInsufficientStock = items.some(
          (i) => i.availability?.status === "INSUFFICIENT_STOCK"
        );
        return { hasOutOfStock, hasInsufficientStock };
      },
    }),
    {
      name: "maison_cart_store",
      partialize: (state) => ({
        items: state.items,
        apiCart: state.apiCart,
        appliedCoupon: state.appliedCoupon,
      }),
    }
  )
);
