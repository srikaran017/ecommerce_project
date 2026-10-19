"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, KeyRound, Sparkles } from "lucide-react";
import { AuthService } from "@/services/auth.service";
import { storeConfig } from "@/config/store.config";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [generalError, setGeneralError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError("");
    setGeneralError("");

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setFieldError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFieldError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await AuthService.forgotPassword(trimmed);
      if (res.success) {
        setIsSuccess(true);
        setFeedbackMessage(
          res.message ||
            "If an account exists with that email, a password reset link has been dispatched."
        );
      } else {
        setGeneralError(res.message || "Failed to process request. Please try again.");
      }
    } catch (err: any) {
      setGeneralError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  className="h-20 sm:h-24 md:h-28 w-auto max-w-[280px] sm:max-w-[340px] object-contain transition-transform group-hover:scale-105"
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
              Forgot Password
            </h1>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
              Enter the email associated with your customer account and we'll send a secure single-use link to reset your credentials.
            </p>
          </div>

          {/* Success State Screen */}
          {isSuccess ? (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-left space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Reset Link Dispatched</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {feedbackMessage}
                </p>
                <div className="pt-2 text-[11px] text-emerald-700/90 border-t border-emerald-200/60">
                  <span className="font-semibold">Security Note:</span> The reset link expires in 1 hour. If you don't receive it shortly, please verify your spam or junk folder.
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <Button
                  variant="outline"
                  size="md"
                  className="w-full text-xs font-semibold"
                  onClick={() => {
                    setIsSuccess(false);
                    setEmail("");
                  }}
                >
                  Send to another email
                </Button>
                <Link href="/login" className="block">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full text-xs font-semibold"
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Forgot Password Input Form */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {generalError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-2xl flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-neutral-800 uppercase tracking-wider block text-[11px]">
                  Registered Email Address <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldError) setFieldError("");
                    }}
                    className={`w-full pl-10 pr-4 py-3 bg-neutral-50/70 border rounded-2xl text-neutral-900 text-xs font-medium focus:bg-white focus:outline-none transition-colors ${
                      fieldError
                        ? "border-rose-500 focus:border-rose-600"
                        : "border-neutral-200 focus:border-neutral-900"
                    }`}
                  />
                </div>
                {fieldError && (
                  <p className="text-[11px] text-rose-600 font-medium pl-1 pt-0.5">{fieldError}</p>
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
                  {isSubmitting ? "Sending Request..." : "Send Reset Link"}
                </Button>
              </div>
            </form>
          )}

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 font-medium hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
            <Link
              href="/contact"
              className="font-medium text-amber-800 hover:text-amber-950 hover:underline transition-colors"
            >
              Need Concierge Help?
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
