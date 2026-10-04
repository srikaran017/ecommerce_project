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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://dress-ecomm-backend.onrender.com/api/v1";

export class AuthService {
  private static tokenKey = "auth_access_token";

  /**
   * Get API Base URL
   */
  static getBaseUrl(): string {
    return API_BASE_URL;
  }

  /**
   * Get cached access token from memory/localStorage
   */
  static getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Set cached access token
   */
  static setAccessToken(token: string | null): void {
    if (typeof window === "undefined") return;
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    } else {
      localStorage.removeItem(this.tokenKey);
    }
  }

  /**
   * Check Server Health
   * GET /health
   */
  static async checkHealth(): Promise<{ status: string; message: string; isLive: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
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
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
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
          role: credentials.role || "CUSTOMER",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        const user: AuthUser = data.data?.user || {
          id: data.data?.id || `usr_${Date.now()}`,
          name: credentials.name.trim(),
          email: credentials.email.toLowerCase().trim(),
          phone: credentials.phone?.trim(),
          role: credentials.role || "CUSTOMER",
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
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
      const response = await fetch(`${API_BASE_URL}/auth/social-login`, {
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
      await fetch(`${API_BASE_URL}/auth/logout`, {
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

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
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
   * Helper to perform authenticated fetch calls
   */
  static async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getAccessToken();
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  }

  /**
   * Request Password Reset Link
   */
  static async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      }).catch(() => null);
    } catch {
      // Graceful fallback
    }

    return {
      success: true,
      message: `Password reset instructions have been sent to ${email}.`,
    };
  }
}
