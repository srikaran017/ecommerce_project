"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User, Phone, ArrowRight, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { storeConfig } from "@/config/store.config";
import { isFeatureEnabled } from "@/config/feature.config";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/";

  const { signup, socialLogin, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);



  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  const validate = () => {
    const errs: {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
      confirmPassword?: string;
      terms?: string;
    } = {};

    if (!name.trim()) {
      errs.name = "Full name is required.";
    } else if (name.trim().length < 2 || name.trim().length > 100) {
      errs.name = "Full name must be between 2 and 100 characters.";
    }

    if (!email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Please enter a valid email address.";
    }

    if (phone.trim() && !/^[0-9+\s-]{8,15}$/.test(phone)) {
      errs.phone = "Please enter a valid phone number (min 8 digits).";
    }

    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters long.";
    } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      errs.password = "Password must contain at least 1 letter and 1 number.";
    }

    if (!confirmPassword) {
      errs.confirmPassword = "Confirm password is required.";
    } else if (confirmPassword !== password) {
      errs.confirmPassword = "Passwords do not match.";
    }

    if (!acceptTerms) {
      errs.terms = "You must agree to the Terms & Conditions.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate()) return;

    const success = await signup({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      password,
      role: "CUSTOMER",
    });

    if (success) {
      router.push(redirectTarget);
    }
  };



  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-7 bg-white p-8 sm:p-10 rounded-3xl border border-neutral-100 shadow-xl">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <span className="font-heading text-xl sm:text-2xl font-bold tracking-widest text-neutral-900 uppercase">
              {storeConfig.name}
            </span>
          </Link>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 pt-2">
            Create an Account
          </h2>
          <p className="text-xs text-neutral-500">
            Join our exclusive client community for seamless ordering and member benefits.
          </p>

          {redirectTarget === "/checkout" && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-[11px] font-semibold text-amber-900 flex items-center gap-2 text-left">
              <Sparkles className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>Create your account to complete your checkout order.</span>
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

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-4 text-xs">
          
          {/* Full Name */}
          <div className="space-y-1">
            <label className="font-bold text-neutral-800 uppercase tracking-wider block">
              Full Name <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="e.g. Priya Sharma"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
                }}
                className={`w-full pl-10 pr-4 py-3 bg-neutral-50 border rounded-2xl text-neutral-900 text-xs font-medium focus:bg-white focus:outline-none transition-colors ${
                  fieldErrors.name
                    ? "border-rose-500 focus:border-rose-600"
                    : "border-neutral-200 focus:border-neutral-900"
                }`}
              />
            </div>
            {fieldErrors.name && (
              <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="font-bold text-neutral-800 uppercase tracking-wider block">
              Email Address <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                placeholder="priya@example.com"
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

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="font-bold text-neutral-800 uppercase tracking-wider block">
              Phone Number <span className="text-neutral-400 font-normal lowercase">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: undefined });
                }}
                className={`w-full pl-10 pr-4 py-3 bg-neutral-50 border rounded-2xl text-neutral-900 text-xs font-medium focus:bg-white focus:outline-none transition-colors ${
                  fieldErrors.phone
                    ? "border-rose-500 focus:border-rose-600"
                    : "border-neutral-200 focus:border-neutral-900"
                }`}
              />
            </div>
            {fieldErrors.phone && (
              <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.phone}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="font-bold text-neutral-800 uppercase tracking-wider block">
              Password (Min 6 Characters) <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
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
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="font-bold text-neutral-800 uppercase tracking-wider block">
              Confirm Password <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: undefined });
                }}
                className={`w-full pl-10 pr-4 py-3 bg-neutral-50 border rounded-2xl text-neutral-900 text-xs font-medium focus:bg-white focus:outline-none transition-colors ${
                  fieldErrors.confirmPassword
                    ? "border-rose-500 focus:border-rose-600"
                    : "border-neutral-200 focus:border-neutral-900"
                }`}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => {
                  setAcceptTerms(e.target.checked);
                  if (fieldErrors.terms) setFieldErrors({ ...fieldErrors, terms: undefined });
                }}
                className="w-4 h-4 rounded-md accent-neutral-900 border-neutral-300 mt-0.5"
              />
              <span className="text-neutral-600 text-xs leading-relaxed">
                I agree to the <span className="underline text-neutral-900 font-medium">Terms of Service</span> and <span className="underline text-neutral-900 font-medium">Privacy Policy</span>.
              </span>
            </label>
            {fieldErrors.terms && (
              <p className="text-[11px] text-rose-600 font-medium pl-1 mt-1">{fieldErrors.terms}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-neutral-900 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* 1-Click Social Sign-Up with Google */}
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
                text="signup_with"
              />
            </div>
          )}
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-neutral-100">
          <p className="text-xs text-neutral-500">
            Already have an account?{" "}
            <Link
              href={`/login${redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
              className="font-bold text-neutral-900 hover:text-amber-700 hover:underline transition-colors ml-1"
            >
              Sign in here
            </Link>
          </p>
        </div>

      </div>


    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-xs text-neutral-400">Loading Signup...</div>}>
      <SignupForm />
    </Suspense>
  );
}
