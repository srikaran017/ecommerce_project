import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistStore {
  wishlistIds: string[];
  toggleWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      wishlistIds: [],

      toggleWishlist: (productId: string) => {
        const current = get().wishlistIds;
        const exists = current.includes(productId);
        if (exists) {
          set({ wishlistIds: current.filter((id) => id !== productId) });
          return false;
        } else {
          set({ wishlistIds: [...current, productId] });
          return true;
        }
      },

      addToWishlist: (productId: string) => {
        const current = get().wishlistIds;
        if (!current.includes(productId)) {
          set({ wishlistIds: [...current, productId] });
        }
      },

      removeFromWishlist: (productId: string) => {
        set({ wishlistIds: get().wishlistIds.filter((id) => id !== productId) });
      },

      isWishlisted: (productId: string) => {
        return get().wishlistIds.includes(productId);
      },

      clearWishlist: () => {
        set({ wishlistIds: [] });
      },
    }),
    {
      name: "wardrobe_wishlist_v1",
    }
  )
);
