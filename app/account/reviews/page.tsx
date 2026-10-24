"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { ReviewsTab } from "../components/ReviewsTab";
import { ArrowLeft, CheckCircle2, X, Star } from "lucide-react";

export default function AccountReviewsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/account/reviews");
    }
  }, [isAuthenticated, router]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md bg-neutral-900 text-white px-4 py-3 rounded-xl shadow-lg border border-neutral-700 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="font-medium">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-neutral-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Back link */}
        <div>
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Account Overview</span>
          </Link>
        </div>

        {/* ReviewsTab Component */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/90 shadow-xs">
          <ReviewsTab onShowToast={showToast} />
        </div>
      </div>
    </div>
  );
}
