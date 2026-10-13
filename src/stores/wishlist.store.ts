import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WishlistService } from "@/services/wishlist.service";

interface WishlistStore {
  wishlistIds: string[];
  loading: boolean;
  loadWishlistIds: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  isWishlisted: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      wishlistIds: [],
      loading: false,

      // Call once when user logs in or app boots (GET /api/v1/wishlist/ids)
      loadWishlistIds: async () => {
        try {
          set({ loading: true });
          const res = await WishlistService.getWishlistIds();
          if (res.success && Array.isArray(res.data)) {
            set({ wishlistIds: res.data, loading: false });
          } else {
            set({ loading: false });
          }
        } catch (err) {
          console.warn("Failed to load wishlist IDs from server:", err);
          set({ loading: false });
        }
      },

      // Instant optimistic toggle for heart icons on product cards & PDP
      toggleWishlist: async (productId: string): Promise<boolean> => {
        const current = [...get().wishlistIds];
        const wasIn = current.includes(productId);

        // Optimistic UI update
        const optimistic = wasIn
          ? current.filter((id) => id !== productId)
          : [...current, productId];

        set({ wishlistIds: optimistic });

        try {
          const res = await WishlistService.toggleWishlist(productId);
          const finalState = res.data.inWishlist;

          // Align state with backend confirmation
          const confirmed = finalState
            ? Array.from(new Set([...get().wishlistIds, productId]))
            : get().wishlistIds.filter((id) => id !== productId);

          set({ wishlistIds: confirmed });
          return finalState;
        } catch (err) {
          // Revert optimistic update if API throws
          set({ wishlistIds: current });
          throw err;
        }
      },

      addToWishlist: async (productId: string) => {
        const current = get().wishlistIds;
        if (!current.includes(productId)) {
          set({ wishlistIds: [...current, productId] });
          try {
            await WishlistService.addToWishlist(productId);
          } catch (err) {
            console.warn("Failed to add to wishlist on server:", err);
          }
        }
      },

      removeFromWishlist: async (productId: string) => {
        const current = get().wishlistIds;
        set({ wishlistIds: current.filter((id) => id !== productId) });
        try {
          await WishlistService.removeFromWishlist(productId);
        } catch (err) {
          console.warn("Failed to remove from wishlist on server:", err);
        }
      },

      clearWishlist: async () => {
        set({ wishlistIds: [] });
        try {
          await WishlistService.clearWishlist();
        } catch (err) {
          console.warn("Failed to clear wishlist on server:", err);
        }
      },

      isWishlisted: (productId: string) => {
        return get().wishlistIds.includes(productId);
      },
    }),
    {
      name: "wardrobe_wishlist_v1",
      partialize: (state) => ({ wishlistIds: state.wishlistIds }),
    }
  )
);
