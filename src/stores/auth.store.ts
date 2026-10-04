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
        }
      },

      checkSession: async () => {
        try {
          const token = AuthService.getAccessToken();
          if (!token) {
            // No token stored
            if (get().isAuthenticated) {
              set({ user: null, isAuthenticated: false });
            }
            return;
          }

          const currentUser = await AuthService.getCurrentUser();
          if (currentUser) {
            set({ user: currentUser, isAuthenticated: true });
          } else {
            // Token expired or invalid
            set({ user: null, isAuthenticated: false });
          }
        } catch {
          // Session check silent failure
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
