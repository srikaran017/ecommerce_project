"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { AuthService } from "@/services/auth.service";
import { storeConfig } from "@/config/store.config";
import { Button } from "@/components/ui/Button";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generalError, setGeneralError] = useState("");

  // Live password validation checkmarks
  const hasMinLength = newPassword.length >= 8 && newPassword.length <= 100;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const isPasswordValid = hasMinLength && hasLetter && hasNumber;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Invalid or missing query parameters
  if (!token || !email) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-neutral-200/80 shadow-xl p-8 sm:p-10 space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
          <AlertCircle className="w-7 h-7 text-amber-700" />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-900">
            Invalid Password Reset Link
          </h1>
          <p className="text-xs text-neutral-500 leading-relaxed max-w-sm mx-auto">
            This password recovery link is missing required verification parameters. Please request a fresh reset link from our concierge portal.
          </p>
        </div>

        <div className="pt-2 space-y-2.5">
          <Link href="/forgot-password" className="block">
            <Button
              variant="primary"
              size="md"
              className="w-full text-xs font-bold uppercase tracking-wider"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Request New Reset Link
            </Button>
          </Link>
          <Link href="/login" className="block">
            <Button variant="outline" size="md" className="w-full text-xs font-semibold">
              Return to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const validate = () => {
    const errors: { newPassword?: string; confirmPassword?: string } = {};

    if (!newPassword) {
      errors.newPassword = "New password is required.";
    } else if (newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters.";
    } else if (!/^(?=.*[A-Za-z])(?=.*\d).{8,100}$/.test(newPassword)) {
      errors.newPassword = "Password must contain at least one letter and one number.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your new password.";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await AuthService.resetPassword({
        email,
        token,
        newPassword,
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        setGeneralError(
          res.message || "Failed to reset password. Please request a new reset link."
        );
      }
    } catch (err: any) {
      setGeneralError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-neutral-200/80 shadow-xl p-8 sm:p-10 space-y-6 text-center animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-900">
            Password Reset Successful
          </h1>
          <p className="text-xs text-neutral-600 leading-relaxed max-w-sm mx-auto">
            Your credentials have been securely updated and all previous sessions have been invalidated. You can now sign in with your new password.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/login" className="block">
            <Button
              variant="primary"
              size="md"
              className="w-full text-xs font-bold uppercase tracking-wider py-3"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Your Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-neutral-200/80 shadow-xl p-8 sm:p-10 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Link
          href="/"
          className="inline-flex flex-col items-center gap-2 group mb-2"
        >
          {storeConfig.logo?.dark && (
            <img
              src={storeConfig.logo.dark}
              alt={storeConfig.name}
              className="h-14 w-auto max-w-[220px] object-contain transition-transform group-hover:scale-105"
            />
          )}
          <span className="font-heading text-xl sm:text-2xl font-bold tracking-widest text-neutral-900 uppercase">
            {storeConfig.name}
          </span>
        </Link>

        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200/80 flex items-center justify-center mx-auto shadow-2xs">
          <KeyRound className="w-6 h-6 text-amber-700" />
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 pt-1">
          Set New Password
        </h1>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
          Resetting password for <strong className="text-neutral-800">{email}</strong>
        </p>
      </div>

      {generalError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-2xl flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <div className="flex-1">
            <p>{generalError}</p>
            {generalError.toLowerCase().includes("expired") && (
              <Link
                href="/forgot-password"
                className="font-bold underline text-rose-900 hover:text-rose-950 mt-1 inline-block"
              >
                Request a new password reset link →
              </Link>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* New Password */}
        <div className="space-y-1.5">
          <label className="font-bold text-neutral-800 uppercase tracking-wider block text-[11px]">
            New Password <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Enter new password (min. 8 characters)"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (fieldErrors.newPassword) setFieldErrors({ ...fieldErrors, newPassword: undefined });
              }}
              className={`w-full pl-10 pr-10 py-3 bg-neutral-50/70 border rounded-2xl text-neutral-900 text-xs font-medium focus:bg-white focus:outline-none transition-colors ${
                fieldErrors.newPassword
                  ? "border-rose-500 focus:border-rose-600"
                  : "border-neutral-200 focus:border-neutral-900"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.newPassword && (
            <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.newPassword}</p>
          )}

          {/* Validation Checklist */}
          <div className="pt-1.5 grid grid-cols-3 gap-1.5 text-[10px]">
            <span
              className={`inline-flex items-center gap-1 font-medium ${
                hasMinLength ? "text-emerald-700" : "text-neutral-400"
              }`}
            >
              <CheckCircle2 className={`w-3 h-3 ${hasMinLength ? "text-emerald-600" : "text-neutral-300"}`} />
              8+ Chars
            </span>
            <span
              className={`inline-flex items-center gap-1 font-medium ${
                hasLetter ? "text-emerald-700" : "text-neutral-400"
              }`}
            >
              <CheckCircle2 className={`w-3 h-3 ${hasLetter ? "text-emerald-600" : "text-neutral-300"}`} />
              1+ Letter
            </span>
            <span
              className={`inline-flex items-center gap-1 font-medium ${
                hasNumber ? "text-emerald-700" : "text-neutral-400"
              }`}
            >
              <CheckCircle2 className={`w-3 h-3 ${hasNumber ? "text-emerald-600" : "text-neutral-300"}`} />
              1+ Number
            </span>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="font-bold text-neutral-800 uppercase tracking-wider block text-[11px]">
            Confirm New Password <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors({ ...fieldErrors, confirmPassword: undefined });
                }
              }}
              className={`w-full pl-10 pr-10 py-3 bg-neutral-50/70 border rounded-2xl text-neutral-900 text-xs font-medium focus:bg-white focus:outline-none transition-colors ${
                fieldErrors.confirmPassword
                  ? "border-rose-500 focus:border-rose-600"
                  : "border-neutral-200 focus:border-neutral-900"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              title={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.confirmPassword}</p>
          )}
          {confirmPassword && isMatch && (
            <p className="text-[11px] text-emerald-700 font-medium pl-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Passwords match perfectly
            </p>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="w-full text-xs font-bold uppercase tracking-wider py-3"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isSubmitting ? "Updating Password..." : "Set New Password"}
          </Button>
        </div>
      </form>

      <div className="pt-4 border-t border-neutral-100 text-center">
        <Link
          href="/login"
          className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          Cancel & Return to Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[85vh] bg-[var(--background)] flex items-center justify-center py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Decorative ambient pastel glow orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-200/35 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-32 w-88 h-88 rounded-full bg-rose-200/30 blur-3xl"
      />

      <div className="max-w-md w-full relative z-10">
        <Suspense
          fallback={
            <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 shadow-xl space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-700 mx-auto" />
              <p className="text-xs font-medium text-neutral-500">
                Verifying password reset credentials...
              </p>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
