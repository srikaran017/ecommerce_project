"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { storeConfig } from "@/config/store.config";
import { isFeatureEnabled } from "@/config/feature.config";
import { AuthService } from "@/services/auth.service";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/";
  const oauthErrorParam = searchParams.get("error");

  const oauthErrorMessage = React.useMemo(() => {
    if (!oauthErrorParam) return null;
    switch (oauthErrorParam) {
      case "google_cancelled":
        return "Google sign-in was cancelled. Please try again or use your email and password.";
      case "google_oauth_unconfigured":
        return "Google OAuth is not yet configured in .env.local. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.";
      case "invalid_oauth_state":
        return "Sign-in session expired. Please click Continue with Google again.";
      case "google_token_exchange_failed":
      case "google_profile_fetch_failed":
        return "Failed to complete authentication with Google. Please try again.";
      case "session_sync_failed":
        return "Could not synchronize login session. Please sign in again.";
      default:
        return "An error occurred during Google sign-in. Please try again.";
    }
  }, [oauthErrorParam]);

  const { login, socialLogin, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  
  // Forgot password interactive state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotFeedback, setForgotFeedback] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Please enter a valid email address.";
    }

    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate()) return;

    const success = await login({ email, password, rememberMe });
    if (success) {
      router.push(redirectTarget);
    }
  };



  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotFeedback("Please enter a valid email address.");
      return;
    }

    setIsForgotLoading(true);
    setForgotFeedback(null);
    try {
      const res = await AuthService.forgotPassword(forgotEmail);
      setForgotFeedback(res.message);
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setForgotFeedback(null);
        setForgotEmail("");
      }, 3000);
    } catch {
      setForgotFeedback("Failed to send reset email. Please try again.");
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-neutral-100 shadow-xl">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <span className="font-heading text-xl sm:text-2xl font-bold tracking-widest text-neutral-900 uppercase">
              {storeConfig.name}
            </span>
          </Link>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 pt-2">
            Welcome Back
          </h2>
          <p className="text-xs text-neutral-500">
            Sign in to access your orders, wishlist, and exclusive member privileges.
          </p>

          {redirectTarget === "/checkout" && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-[11px] font-semibold text-amber-900 flex items-center gap-2 text-left">
              <Sparkles className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>Please sign in or create an account to proceed with your checkout.</span>
            </div>
          )}
        </div>

        {/* Global Error Banner */}
        {(oauthErrorMessage || error) && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{oauthErrorMessage || error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          
          {/* Email Field */}
          <div className="space-y-1">
            <label className="font-bold text-neutral-800 uppercase tracking-wider block">
              Email Address <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                }}
                className={`w-full pl-10 pr-4 py-3 bg-neutral-50 border rounded-2xl text-neutral-900 text-xs font-medium focus:bg-white focus:outline-none transition-colors ${
                  fieldErrors.email
                    ? "border-rose-500 focus:border-rose-600"
                    : "border-neutral-200 focus:border-neutral-900"
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-neutral-800 uppercase tracking-wider block">
                Password <span className="text-rose-600">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-[11px] font-semibold text-amber-700 hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                }}
                className={`w-full pl-10 pr-10 py-3 bg-neutral-50 border rounded-2xl text-neutral-900 text-xs font-medium focus:bg-white focus:outline-none transition-colors ${
                  fieldErrors.password
                    ? "border-rose-500 focus:border-rose-600"
                    : "border-neutral-200 focus:border-neutral-900"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.password}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-md accent-neutral-900 border-neutral-300"
              />
              <span className="text-neutral-600 text-xs font-medium">Remember my session</span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-neutral-900 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* 1-Click Social Sign-In with Google */}
          {isFeatureEnabled("googleAuth") && (
            <div className="pt-2 space-y-3">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-neutral-200"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                  Or Continue With
                </span>
                <div className="flex-grow border-t border-neutral-200"></div>
              </div>

              <GoogleSignInButton
                redirectTarget={redirectTarget}
                text="continue_with"
              />
            </div>
          )}
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-neutral-100">
          <p className="text-xs text-neutral-500">
            Don't have an account?{" "}
            <Link
              href={`/signup${redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
              className="font-bold text-neutral-900 hover:text-amber-700 hover:underline transition-colors ml-1"
            >
              Create one now
            </Link>
          </p>
        </div>

      </div>



      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-sm w-full p-6 rounded-3xl border border-neutral-100 shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                Reset Password
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Enter your email address and we will send you a password reset link.
              </p>
            </div>

            {forgotFeedback && (
              <div className="p-3 bg-neutral-100 text-neutral-800 text-xs font-semibold rounded-2xl">
                {forgotFeedback}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-3 text-xs">
              <input
                type="email"
                placeholder="name@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none text-neutral-900"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setForgotFeedback(null);
                  }}
                  className="px-3 py-2 text-neutral-600 font-bold hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="px-4 py-2 bg-neutral-900 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {isForgotLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-xs text-neutral-400">Loading Login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
