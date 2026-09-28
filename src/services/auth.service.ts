export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupCredentials {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  message?: string;
}

/**
 * =========================================================================
 * AUTHENTICATION SERVICE (FRONTEND INTEGRATION LAYER)
 * =========================================================================
 * This service manages user authentication on the frontend.
 * 
 * FOR BACKEND DEVELOPER:
 * Replace the simulated promises below with your real API fetch calls.
 * Example:
 *   const response = await fetch('/api/auth/login', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(credentials),
 *   });
 *   return await response.json();
 * =========================================================================
 */
export class AuthService {
  /**
   * Login User
   * BACKEND INTEGRATION POINT: POST /api/auth/login
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Simulate brief network delay for smooth UI feedback
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Basic frontend simulation
    if (credentials.email && credentials.password.length >= 6) {
      const user: AuthUser = {
        id: `usr_${Date.now()}`,
        name: credentials.email.split("@")[0].replace(/[^a-zA-Z]/g, " ").trim() || "Valued Client",
        email: credentials.email.toLowerCase().trim(),
        role: "CUSTOMER",
        createdAt: new Date().toISOString(),
      };

      return {
        success: true,
        user,
        token: `mock_jwt_${Date.now()}`,
        message: "Successfully logged in.",
      };
    }

    return {
      success: false,
      message: "Invalid email or password. Password must be at least 6 characters.",
    };
  }

  /**
   * Register / Sign Up User
   * BACKEND INTEGRATION POINT: POST /api/auth/signup
   */
  static async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    // Simulate brief network delay for smooth UI feedback
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (credentials.name && credentials.email && credentials.password.length >= 6) {
      const user: AuthUser = {
        id: `usr_${Date.now()}`,
        name: credentials.name.trim(),
        email: credentials.email.toLowerCase().trim(),
        phone: credentials.phone.trim(),
        role: "CUSTOMER",
        createdAt: new Date().toISOString(),
      };

      return {
        success: true,
        user,
        token: `mock_jwt_${Date.now()}`,
        message: "Account created successfully.",
      };
    }

    return {
      success: false,
      message: "Please provide all required registration details.",
    };
  }

  /**
   * Logout User
   * BACKEND INTEGRATION POINT: POST /api/auth/logout
   */
  static async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  /**
   * Get Current Authenticated Session / User Profile
   * BACKEND INTEGRATION POINT: GET /api/auth/me
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    return null;
  }

  /**
   * Request Password Reset Link / OTP
   * BACKEND INTEGRATION POINT: POST /api/auth/forgot-password
   */
  static async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      success: true,
      message: `Password reset instructions have been sent to ${email}.`,
    };
  }
}
