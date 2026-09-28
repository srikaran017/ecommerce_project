"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthService, AuthUser, LoginCredentials, SignupCredentials } from "@/services/auth.service";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  signup: (credentials: SignupCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (user: AuthUser | null) => void;
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
            return true;
          } else {
            set({
              error: res.message || "Invalid credentials.",
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
            set({
              user: res.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
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
        }
      },

      clearError: () => set({ error: null }),
      setUser: (user) => set({ user, isAuthenticated: !!user }),
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
