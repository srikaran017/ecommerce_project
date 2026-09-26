import { create } from "zustand";
import { persist } from "zustand/middleware";
import { storeConfig } from "@/config/store.config";

export interface CartItem {
  id: string; // unique item identifier (productId + variantId)
  productId: string;
  variantId: string;
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
}

export interface AppliedCoupon {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  calculatedDiscount: number;
}

interface CartState {
  items: CartItem[];
  appliedCoupon: AppliedCoupon | null;
  isOpen: boolean;

  // Actions
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Computed Getters
  getSubtotal: () => number;
  getTaxAmount: () => number;
  getShippingAmount: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      isOpen: false,

      addItem: (newItem) => {
        const id = `${newItem.productId}_${newItem.variantId}`;
        const existingIndex = get().items.findIndex((item) => item.id === id);

        if (existingIndex > -1) {
          const updatedItems = [...get().items];
          const existingItem = updatedItems[existingIndex];
          const newQty = Math.min(
            existingItem.quantity + newItem.quantity,
            newItem.maxStock || 99
          );
          updatedItems[existingIndex] = { ...existingItem, quantity: newQty };
          set({ items: updatedItems, isOpen: true });
        } else {
          set({
            items: [...get().items, { ...newItem, id }],
            isOpen: true,
          });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === id
              ? { ...item, quantity: Math.min(quantity, item.maxStock || 99) }
              : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [], appliedCoupon: null });
      },

      applyCoupon: (coupon) => {
        set({ appliedCoupon: coupon });
      },

      removeCoupon: () => {
        set({ appliedCoupon: null });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
      },

      getDiscountAmount: () => {
        const subtotal = get().getSubtotal();
        const coupon = get().appliedCoupon;
        if (!coupon) return 0;

        if (coupon.discountType === "PERCENTAGE") {
          return Math.round((subtotal * coupon.discountValue) / 100);
        } else {
          return Math.min(coupon.discountValue, subtotal);
        }
      },

      getShippingAmount: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        if (subtotal >= storeConfig.shipping.freeShippingThreshold) return 0;
        return storeConfig.shipping.flatRate;
      },

      getTaxAmount: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscountAmount();
        const taxableAmount = Math.max(0, subtotal - discount);
        if (storeConfig.tax.includedInPrice) return 0;
        return Math.round(
          (taxableAmount * storeConfig.tax.defaultTaxRatePercentage) / 100
        );
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscountAmount();
        const shipping = get().getShippingAmount();
        const tax = get().getTaxAmount();
        return Math.max(0, subtotal - discount + shipping + tax);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "maison_cart_store",
      partialize: (state) => ({
        items: state.items,
        appliedCoupon: state.appliedCoupon,
      }),
    }
  )
);
