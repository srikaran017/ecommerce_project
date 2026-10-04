"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { storeConfig } from "@/config/store.config";
import { AuthService } from "@/services/auth.service";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/";

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

  // Social login modal state
  const [socialModalProvider, setSocialModalProvider] = useState<"google" | "github" | "facebook" | null>(null);
  const [socialTokenInput, setSocialTokenInput] = useState("");
  const [socialLoading, setSocialLoading] = useState(false);

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

  const handleSocialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialModalProvider || !socialTokenInput.trim()) return;

    setSocialLoading(true);
    clearError();
    const success = await socialLogin({
      provider: socialModalProvider,
      token: socialTokenInput.trim(),
    });
    setSocialLoading(false);

    if (success) {
      setSocialModalProvider(null);
      setSocialTokenInput("");
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
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
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

          {/* Social Sign-In Options (Google, GitHub) */}
          <div className="pt-2">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-neutral-200"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                Or Continue With
              </span>
              <div className="flex-grow border-t border-neutral-200"></div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSocialModalProvider("google")}
                className="py-2.5 px-3 border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold text-neutral-800 transition-all cursor-pointer shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27a7.2 7.2 0 0 1 0-4.54V6.58H1.27a11.98 11.98 0 0 0 0 10.84l4.01-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => setSocialModalProvider("github")}
                className="py-2.5 px-3 border border-neutral-200 hover:border-neutral-900 bg-white hover:bg-neutral-50 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold text-neutral-800 transition-all cursor-pointer shadow-xs"
              >
                <svg className="w-4 h-4 fill-current text-neutral-900" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                <span>GitHub</span>
              </button>
            </div>
          </div>
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

      {/* Social Login Token Modal */}
      {socialModalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-sm w-full p-6 rounded-3xl border border-neutral-100 shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <span>Sign in with {socialModalProvider === "google" ? "Google" : "GitHub"}</span>
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Enter your OAuth credential / ID token received from {socialModalProvider} to verify with the backend API.
              </p>
            </div>

            <form onSubmit={handleSocialSubmit} className="space-y-3 text-xs">
              <textarea
                rows={3}
                required
                placeholder="Paste OAuth token / ID token here..."
                value={socialTokenInput}
                onChange={(e) => setSocialTokenInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none text-neutral-900 font-mono text-[11px]"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSocialModalProvider(null);
                    setSocialTokenInput("");
                  }}
                  className="px-3 py-2 text-neutral-600 font-bold hover:bg-neutral-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={socialLoading || !socialTokenInput.trim()}
                  className="px-4 py-2 bg-neutral-900 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-60"
                >
                  {socialLoading ? "Verifying..." : "Verify & Continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
