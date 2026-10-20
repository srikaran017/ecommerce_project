"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  AuthService,
  AuthUser,
  LoginCredentials,
  SignupCredentials,
  SocialLoginCredentials,
} from "@/services/auth.service";
import { useCartStore } from "@/stores/cart.store";
import { useWishlistStore } from "@/stores/wishlist.store";

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  signup: (credentials: SignupCredentials) => Promise<boolean>;
  socialLogin: (credentials: SocialLoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: AuthUser | null) => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const res = await AuthService.login(credentials);
          if (res.success && res.user) {
            set({
              user: res.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            // Automatically merge guest cart and fetch customer cart upon login
            useCartStore.getState().mergeGuestCartOnLogin().catch(() => {});
            useCartStore.getState().fetchCart().catch(() => {});
            useWishlistStore.getState().loadWishlistIds().catch(() => {});
            return true;
          } else {
            set({
              error: res.message || "Invalid email or password.",
              isLoading: false,
            });
            return false;
          }
        } catch (err: any) {
          set({
            error: err.message || "An unexpected error occurred. Please try again.",
            isLoading: false,
          });
          return false;
        }
      },

      signup: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const res = await AuthService.signup(credentials);
          if (res.success && res.user) {
            // Attempt auto-login to obtain session & tokens if not returned directly
            if (!res.accessToken) {
              const loginSuccess = await get().login({
                email: credentials.email,
                password: credentials.password,
              });
              if (loginSuccess) return true;
            }

            set({
              user: res.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            // Automatically merge guest cart and fetch customer cart upon registration
            useCartStore.getState().mergeGuestCartOnLogin().catch(() => {});
            useCartStore.getState().fetchCart().catch(() => {});
            useWishlistStore.getState().loadWishlistIds().catch(() => {});
            return true;
          } else {
            set({
              error: res.message || "Failed to create account.",
              isLoading: false,
            });
            return false;
          }
        } catch (err: any) {
          set({
            error: err.message || "An unexpected error occurred. Please try again.",
            isLoading: false,
          });
          return false;
        }
      },

      socialLogin: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const res = await AuthService.socialLogin(credentials);
          if (res.success && res.user) {
            set({
              user: res.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            // Automatically merge guest cart and fetch customer cart upon social login
            useCartStore.getState().mergeGuestCartOnLogin().catch(() => {});
            useCartStore.getState().fetchCart().catch(() => {});
            useWishlistStore.getState().loadWishlistIds().catch(() => {});
            return true;
          } else {
            set({
              error: res.message || "Social login failed.",
              isLoading: false,
            });
            return false;
          }
        } catch (err: any) {
          set({
            error: err.message || "An unexpected error occurred during social login.",
            isLoading: false,
          });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await AuthService.logout();
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          useWishlistStore.setState({ wishlistIds: [] });
          useCartStore.setState({ items: [], apiCart: null, appliedCoupon: null });
          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem("wardrobe_wishlist_ids_v2");
              localStorage.removeItem("wardrobe_wishlist_v1");
              localStorage.removeItem("maison_cart_store");
              localStorage.removeItem("guest_cart_token");
            } catch {}
          }
        }
      },

      checkSession: async () => {
        try {
          let token = AuthService.getAccessToken();
          if (!token) {
            // Attempt silent refresh via HttpOnly refresh cookie (valid for 7 days)
            const refreshRes = await AuthService.refreshToken();
            if (refreshRes.success && refreshRes.user) {
              set({ user: refreshRes.user, isAuthenticated: true });
              useCartStore.getState().fetchCart().catch(() => {});
              return;
            }

            // No valid token or refresh cookie
            if (get().isAuthenticated) {
              set({ user: null, isAuthenticated: false });
            }
            useWishlistStore.setState({ wishlistIds: [] });
            useCartStore.setState({ items: [], apiCart: null, appliedCoupon: null });
            if (typeof window !== "undefined") {
              try {
                localStorage.removeItem("maison_cart_store");
                localStorage.removeItem("guest_cart_token");
              } catch {}
            }
            return;
          }

          const currentUser = await AuthService.getCurrentUser();
          if (currentUser) {
            set({ user: currentUser, isAuthenticated: true });
            useCartStore.getState().fetchCart().catch(() => {});
          } else {
            // If user has an active OAuth / Google profile in store, preserve it rather than abruptly logging out
            const activeUser = get().user;
            if (activeUser && (activeUser.id?.startsWith("usr_google_") || activeUser.id?.startsWith("usr_"))) {
              return;
            }
            // Token expired or invalid
            set({ user: null, isAuthenticated: false });
            useWishlistStore.setState({ wishlistIds: [] });
            useCartStore.setState({ items: [], apiCart: null, appliedCoupon: null });
            if (typeof window !== "undefined") {
              try {
                localStorage.removeItem("maison_cart_store");
                localStorage.removeItem("guest_cart_token");
              } catch {}
            }
          }
        } catch {
          // Session check silent failure
        }
      },

      clearError: () => set({ error: null }),
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      updateUser: (partial) => {
        const current = get().user;
        if (!current) return;
        const updated = { ...current, ...partial };
        set({ user: updated });
      },
    }),
    {
      name: "auth-session-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
