"use client";

import React, { useState } from "react";
import { Sliders, Palette, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import { featureConfig, FeatureConfig } from "@/config/feature.config";
import { PRESET_THEMES, ThemeConfig } from "@/config/theme.config";
import { useUIStore } from "@/stores/ui.store";
import { Button } from "@/components/ui/Button";

export default function AdminSettingsPage() {
  const { activeTheme, setTheme } = useUIStore();
  const [flags, setFlags] = useState<FeatureConfig>({ ...featureConfig });
  const [savedNotification, setSavedNotification] = useState(false);

  const toggleFlag = (key: keyof FeatureConfig) => {
    const updated = { ...flags, [key]: !flags[key] };
    setFlags(updated);
    // Also update runtime featureConfig reference
    (featureConfig as any)[key] = updated[key];
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  const featureList: Array<{ key: keyof FeatureConfig; label: string; description: string }> = [
    { key: "wishlist", label: "Wishlist System", description: "Allow customers to save curated items to their private wishlist." },
    { key: "reviews", label: "Product Reviews & Ratings", description: "Display verified customer reviews, ratings, and feedback." },
    { key: "coupons", label: "Coupons & Promotional Codes", description: "Enable checkout coupon validation (e.g. LUXE10, WELCOME1000)." },
    { key: "guestCheckout", label: "Guest Checkout", description: "Allow purchases without mandatory customer account registration." },
    { key: "onlinePayment", label: "Online Gateway (Razorpay)", description: "Accept Credit/Debit cards, UPI, and NetBanking online." },
    { key: "cashOnDelivery", label: "Cash On Delivery (COD)", description: "Allow physical payment on doorstep delivery." },
    { key: "productVariants", label: "Garment Variants (Sizes/Colors)", description: "Support multi-color swatches, size pills, and variant pricing." },
    { key: "whatsapp", label: "WhatsApp Concierge & Notifications", description: "Dispatch order tracking and concierge chat via WhatsApp." },
    { key: "newsletter", label: "Newsletter Subscription", description: "Show editorial newsletter sign-up forms in footer." },
    { key: "recommendations", label: "Product Recommendations", description: "Show 'Pair with these silhouettes' lookbook sections." },
    { key: "sizeChart", label: "Clothing Size Guide & Chart", description: "Render size chart tables and measurement guides." },
    { key: "orderTracking", label: "Order Lifecycle Tracker", description: "Show 4-step delivery milestones on order success." },
    { key: "googleAuth", label: "Google 1-Click Authentication", description: "Enable Google OAuth sign-in and registration for customers." },
  ];

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Sliders className="w-6 h-6 text-amber-400" />
            <span>Store Feature Flags & Theme Engine</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Toggle platform capabilities logically in real-time or switch the visual brand identity.
          </p>
        </div>

        {savedNotification && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-md animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Settings Live & Applied</span>
          </div>
        )}
      </div>

      {/* Section 1: Visual Theme Presets */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-400" />
              <span>Theme Customization Engine</span>
            </h2>
            <p className="text-xs text-slate-400">
              Select one of the 8 curated clothing brand visual identities. The entire platform updates its CSS variables instantly.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded border border-amber-400/20">
            Active: {activeTheme.name}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(PRESET_THEMES).map((preset) => {
            const isSelected = activeTheme.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setTheme(preset.id)}
                className={`p-4 rounded-lg border text-left transition-all relative cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 border-amber-400 ring-2 ring-amber-400/40"
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {preset.name}
                  </span>
                  {isSelected && <Sparkles className="w-4 h-4 text-amber-400" />}
                </div>

                {/* Color Palette Preview Strip */}
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: preset.primaryColor }} title="Primary" />
                  <span className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: preset.secondaryColor }} title="Secondary" />
                  <span className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: preset.accentColor }} title="Accent" />
                  <span className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: preset.backgroundColor }} title="Background" />
                </div>

                <div className="text-[10px] text-slate-400 font-mono">
                  Font: {preset.headingFont.split(",")[0].replace(/'/g, "")}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Centralized Feature Flags Toggle Matrix */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 sm:p-8 space-y-6">
        <div className="space-y-1 border-b border-slate-800 pb-4">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>Platform Feature Flags</span>
          </h2>
          <p className="text-xs text-slate-400">
            Disabling a feature logically unmounts all related UI, API routes, and database operations.
          </p>
        </div>

        <div className="divide-y divide-slate-800">
          {featureList.map(({ key, label, description }) => {
            const isEnabled = flags[key];
            return (
              <div key={key} className="py-4 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-wide uppercase">
                      {label}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                      {key}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleFlag(key)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isEnabled ? "bg-amber-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
