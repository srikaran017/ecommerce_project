export type UserRole = "CUSTOMER" | "STORE_ADMIN" | "STAFF" | "SUPER_ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: UserRole | string;
  avatarUrl?: string;
  createdAt?: string;
  isActive?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface SocialLoginCredentials {
  provider: "google" | "facebook" | "github";
  token: string;
  role?: UserRole;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  accessToken?: string;
  message?: string;
  error?: any;
}

import { getApiBaseUrl } from "@/services/apiConfig";

const getBaseUrl = getApiBaseUrl;

export class AuthService {
  private static tokenKey = "auth_access_token";

  /**
   * Get API Base URL
   */
  static getBaseUrl(): string {
    return getBaseUrl();
  }

  /**
   * Get cached access token from memory/localStorage and keep auth_access_token cookie synchronized
   */
  static getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem(this.tokenKey);
    if (token && typeof document !== "undefined") {
      document.cookie = `auth_access_token=${token}; path=/; max-age=604800; SameSite=Lax;`;
    }
    return token;
  }

  /**
   * Set cached access token in localStorage and synchronize auth_access_token cookie
   */
  static setAccessToken(token: string | null): void {
    if (typeof window === "undefined") return;
    if (token) {
      localStorage.setItem(this.tokenKey, token);
      if (typeof document !== "undefined") {
        document.cookie = `auth_access_token=${token}; path=/; max-age=604800; SameSite=Lax;`;
      }
    } else {
      localStorage.removeItem(this.tokenKey);
      if (typeof document !== "undefined") {
        document.cookie = "auth_access_token=; path=/; max-age=0; SameSite=Lax;";
      }
    }
  }

  /**
   * Check Server Health
   * GET /health
   */
  static async checkHealth(): Promise<{ status: string; message: string; isLive: boolean }> {
    try {
      const res = await fetch(`${getBaseUrl()}/health`);
      if (!res.ok) {
        return { status: "error", message: `HTTP ${res.status}`, isLive: false };
      }
      const data = await res.json().catch(() => ({}));
      return {
        status: data.status || "ok",
        message: data.message || "E-commerce API is running",
        isLive: data.status === "ok",
      };
    } catch (err: any) {
      return { status: "error", message: err.message || "Failed to reach backend", isLive: false };
    }
  }

  /**
   * Register a new user
   * POST /auth/register
   */
  static async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${getBaseUrl()}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: credentials.name.trim(),
          email: credentials.email.toLowerCase().trim(),
          password: credentials.password,
          phone: credentials.phone?.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        const user: AuthUser = data.data?.user || {
          id: data.data?.id || `usr_${Date.now()}`,
          name: credentials.name.trim(),
          email: credentials.email.toLowerCase().trim(),
          phone: credentials.phone?.trim(),
          role: "CUSTOMER",
          createdAt: data.data?.createdAt,
        };

        if (data.data?.accessToken) {
          this.setAccessToken(data.data.accessToken);
        }

        return {
          success: true,
          user,
          accessToken: data.data?.accessToken,
          message: data.message || "Registration successful.",
        };
      }

      // Extract specific validation message if present
      const validationMsg =
        data.error?.details?.[0]?.message ||
        data.message ||
        "Registration failed. Please check your information.";

      return {
        success: false,
        message: validationMsg,
        error: data.error,
      };
    } catch (err: any) {
      console.warn("API signup connection error:", err);
      return {
        success: false,
        message:
          "Unable to reach the authentication server. Please check your connection and try again.",
      };
    }
  }

  /**
   * Authenticate / Login user
   * POST /auth/login
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${getBaseUrl()}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: credentials.email.toLowerCase().trim(),
          password: credentials.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        const token = data.data?.accessToken;
        if (token) {
          this.setAccessToken(token);
        }

        const user: AuthUser = data.data?.user || {
          id: `usr_${Date.now()}`,
          name: credentials.email.split("@")[0],
          email: credentials.email.toLowerCase().trim(),
          role: "CUSTOMER",
        };

        return {
          success: true,
          user,
          accessToken: token,
          message: data.message || "Login successful.",
        };
      }

      return {
        success: false,
        message: data.message || "Invalid email or password.",
        error: data.error,
      };
    } catch (err: any) {
      console.warn("API login connection error:", err);
      return {
        success: false,
        message:
          "Unable to connect to the authentication server. Please try again in a moment.",
      };
    }
  }

  /**
   * Social Login (Google, Facebook, GitHub)
   * POST /auth/social-login
   */
  static async socialLogin(credentials: SocialLoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${getBaseUrl()}/auth/social-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          provider: credentials.provider,
          token: credentials.token,
          role: credentials.role || "CUSTOMER",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        const token = data.data?.accessToken;
        if (token) {
          this.setAccessToken(token);
        }

        const user: AuthUser = data.data?.user || {
          id: `usr_${Date.now()}`,
          name: `${credentials.provider} User`,
          email: "user@social.com",
          role: credentials.role || "CUSTOMER",
        };

        return {
          success: true,
          user,
          accessToken: token,
          message: data.message || "Social login successful.",
        };
      }

      return {
        success: false,
        message: data.message || `Unable to authenticate with ${credentials.provider}.`,
        error: data.error,
      };
    } catch (err: any) {
      console.warn("API social login connection error:", err);
      return {
        success: false,
        message: "Failed to connect to the authentication service.",
      };
    }
  }

  /**
   * Log out user
   * POST /auth/logout
   */
  static async logout(): Promise<void> {
    try {
      const token = this.getAccessToken();
      await fetch(`${getBaseUrl()}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      this.setAccessToken(null);
    }
  }

  /**
   * Get profile of currently logged-in user
   * GET /auth/me
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const token = this.getAccessToken();
      if (!token) return null;

      const response = await fetch(`${getBaseUrl()}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401 && !token.startsWith("google_")) {
          this.setAccessToken(null);
        }
        return null;
      }

      const data = await response.json().catch(() => ({}));
      if (data.success && data.data?.user) {
        return data.data.user;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Session / Token Refresh
   * POST /auth/refresh
   * Rotates JWT access token using HttpOnly cookie or optional JSON body payload.
   */
  static async refreshToken(customRefreshToken?: string): Promise<AuthResponse> {
    try {
      const body = customRefreshToken ? JSON.stringify({ refreshToken: customRefreshToken }) : undefined;
      const response = await fetch(`${getBaseUrl()}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body,
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        const token = data.data?.accessToken;
        if (token) {
          this.setAccessToken(token);
        }

        return {
          success: true,
          user: data.data?.user,
          accessToken: token,
          message: data.message || "Token refreshed successfully",
        };
      }

      return {
        success: false,
        message: data.message || "Refresh token is invalid or expired",
        error: data.error,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Failed to refresh token",
      };
    }
  }

  /**
   * Helper to perform authenticated fetch calls with automatic token rotation
   */
  static async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getAccessToken();
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    // Automatic token rotation on 401 Unauthorized
    if (response.status === 401 && !url.includes("/auth/")) {
      const refreshRes = await this.refreshToken();
      if (refreshRes.success && refreshRes.accessToken) {
        headers.set("Authorization", `Bearer ${refreshRes.accessToken}`);
        return fetch(url, {
          ...options,
          headers,
          credentials: "include",
        });
      }
    }

    return response;
  }

  /**
   * Request Password Reset Link (Anti-enumeration compliant)
   * POST /api/v1/auth/forgot-password
   */
  static async forgotPassword(email: string): Promise<{ success: boolean; message: string; error?: any }> {
    try {
      const res = await fetch(`${getBaseUrl()}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message || "If an account exists with that email, a password reset link has been dispatched.",
        };
      }

      return {
        success: res.ok,
        message: data.message || "If an account exists with that email, a password reset link has been dispatched.",
        error: data.error,
      };
    } catch {
      // Graceful fallback protecting against enumeration
      return {
        success: true,
        message: "If an account exists with that email, a password reset link has been dispatched.",
      };
    }
  }

  /**
   * Reset Customer Password using token from email
   * POST /api/v1/auth/reset-password
   */
  static async resetPassword(payload: {
    email: string;
    token: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string; error?: any }> {
    try {
      const res = await fetch(`${getBaseUrl()}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: payload.email.toLowerCase().trim(),
          token: payload.token.trim(),
          newPassword: payload.newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message || "Password has been successfully reset. Please log in with your new credentials.",
        };
      }

      return {
        success: false,
        message: data.message || "Invalid or expired password reset link. Please request a new one.",
        error: data.error,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Failed to reset password. Please try again.",
      };
    }
  }
}
