"use client";

import React, { useState, useEffect } from "react";
import {
  Sliders,
  Palette,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Save,
  Building,
  Truck,
  FileText,
  DollarSign,
  Phone,
  Mail,
  Heart,
  Star,
  Tag,
  UserCheck,
  CreditCard,
  Banknote,
  Layers,
  MessageCircle,
  MailQuestion,
  Wand2,
  Ruler,
  Navigation,
  Check,
  AlertTriangle,
  Info,
  ExternalLink,
} from "lucide-react";
import { featureConfig } from "@/config/feature.config";
import { PRESET_THEMES, ThemeConfig } from "@/config/theme.config";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { rbac } from "@/lib/rbac";
import { AdminService } from "@/services/admin.service";
import {
  StoreSettings,
  StoreFeatureFlags,
  UpdateStoreSettingsInput,
} from "@/types/admin.types";

interface FeatureDisplayItem {
  key: keyof StoreFeatureFlags;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FEATURE_DISPLAY_LIST: FeatureDisplayItem[] = [
  {
    key: "guestCheckout",
    label: "Guest Checkout",
    description: "Allow purchasing without mandatory account login or registration.",
    icon: UserCheck,
  },
  {
    key: "cashOnDelivery",
    label: "Cash On Delivery (COD)",
    description: "Allow physical cash payment at the doorstep upon courier delivery.",
    icon: Banknote,
  },
  {
    key: "onlinePayment",
    label: "Online Payment Gateway",
    description: "Enable checkout card, UPI, NetBanking and digital wallet payments.",
    icon: CreditCard,
  },
  {
    key: "wishlist",
    label: "Wishlist System",
    description: "Allow clients to save luxury garments to their curated wishlists.",
    icon: Heart,
  },
  {
    key: "reviews",
    label: "Garment Reviews & Ratings",
    description: "Display verified buyer star ratings and couture testimonials.",
    icon: Star,
  },
  {
    key: "coupons",
    label: "Promotional Coupons & Codes",
    description: "Enable discount voucher code entry and cap validations at checkout.",
    icon: Tag,
  },
  {
    key: "productVariants",
    label: "Garment Sizing & Color Swatches",
    description: "Support sizing pills (S, M, L, XL) and hex swatches with variant pricing.",
    icon: Layers,
  },
  {
    key: "whatsapp",
    label: "WhatsApp VIP Concierge",
    description: "Floating live concierge widget and direct WhatsApp order queries.",
    icon: MessageCircle,
  },
  {
    key: "newsletter",
    label: "VIP Editorial Newsletter",
    description: "Show couture preview sign-up modal and footer subscription prompts.",
    icon: MailQuestion,
  },
  {
    key: "recommendations",
    label: "AI Silhouettes Recommendations",
    description: "Display 'Pair with these silhouettes' automated garment carousels.",
    icon: Wand2,
  },
  {
    key: "sizeChart",
    label: "Bespoke Size Measurement Guide",
    description: "Render garment measurement modal dialogs on product detail pages.",
    icon: Ruler,
  },
  {
    key: "orderTracking",
    label: "Live Courier Tracking Bar",
    description: "Visual milestone timeline for dispatched and out-for-delivery orders.",
    icon: Navigation,
  },
];

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const { activeTheme: currentUITheme, setTheme: setUITheme } = useUIStore();
  const canManage = rbac.canManageSettings(user?.role);

  // Settings State
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSwitchingTheme, setIsSwitchingTheme] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Form Fields
  const [formStoreName, setFormStoreName] = useState("");
  const [formTagline, setFormTagline] = useState("");
  const [formCurrency, setFormCurrency] = useState("INR");
  const [formCurrencySymbol, setFormCurrencySymbol] = useState("₹");
  const [formSupportEmail, setFormSupportEmail] = useState("");
  const [formSupportPhone, setFormSupportPhone] = useState("");
  const [formFreeShippingThreshold, setFormFreeShippingThreshold] = useState("2999.00");
  const [formFlatShippingRate, setFormFlatShippingRate] = useState("150.00");
  const [formShippingPolicy, setFormShippingPolicy] = useState("");
  const [formReturnPolicy, setFormReturnPolicy] = useState("");

  // Load Settings
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const res = await AdminService.getStoreSettings();
      if (res.success && res.data) {
        setSettings(res.data);
        setFormStoreName(res.data.storeName);
        setFormTagline(res.data.tagline);
        setFormCurrency(res.data.currency || "INR");
        setFormCurrencySymbol(res.data.currencySymbol || "₹");
        setFormSupportEmail(res.data.supportEmail);
        setFormSupportPhone(res.data.supportPhone);
        setFormFreeShippingThreshold(String(res.data.freeShippingThreshold));
        setFormFlatShippingRate(String(res.data.flatShippingRate));
        setFormShippingPolicy(res.data.policiesJson?.shippingPolicy || "");
        setFormReturnPolicy(res.data.policiesJson?.returnPolicy || "");

        // Sync UI theme store if needed
        if (res.data.activeTheme && currentUITheme.id !== res.data.activeTheme) {
          setUITheme(res.data.activeTheme);
        }
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load store settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const showNotification = (type: "success" | "error" | "info", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Save General Store Configuration
  const handleSaveStoreConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      showNotification("error", "Permission denied: settings:manage (SUPER_ADMIN only) required.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: UpdateStoreSettingsInput = {
        storeName: formStoreName.trim(),
        tagline: formTagline.trim(),
        currency: formCurrency.trim(),
        currencySymbol: formCurrencySymbol.trim(),
        supportEmail: formSupportEmail.trim(),
        supportPhone: formSupportPhone.trim(),
        freeShippingThreshold: Number(formFreeShippingThreshold),
        flatShippingRate: Number(formFlatShippingRate),
        policiesJson: {
          shippingPolicy: formShippingPolicy.trim(),
          returnPolicy: formReturnPolicy.trim(),
        },
      };

      const res = await AdminService.updateStoreSettings(payload);
      if (res.success) {
        setSettings(res.data);
        showNotification("success", "Store configuration updated successfully");
      } else {
        showNotification("error", res.message || "Failed to update settings");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error saving store settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Switch Theme Preset
  const handleApplyTheme = async (themeId: string) => {
    if (!canManage) {
      showNotification("error", "Permission denied: settings:manage (SUPER_ADMIN only) required.");
      return;
    }

    setIsSwitchingTheme(true);
    try {
      const res = await AdminService.switchTheme(themeId);
      if (res.success) {
        // Also update runtime zustand store to dynamically update DOM CSS variables
        setUITheme(themeId);
        if (settings) {
          setSettings({ ...settings, activeTheme: themeId });
        }
        showNotification(
          "success",
          res.message || `Active storefront theme switched to '${themeId}'`
        );
      } else {
        showNotification("error", res.message || "Failed to switch theme");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error applying theme");
    } finally {
      setIsSwitchingTheme(false);
    }
  };

  // Toggle Feature Flag
  const handleToggleFeature = async (key: keyof StoreFeatureFlags) => {
    if (!canManage) {
      showNotification("error", "Permission denied: settings:manage (SUPER_ADMIN only) required.");
      return;
    }

    if (!settings) return;

    const currentVal = settings.featuresJson[key] ?? true;
    const nextVal = !currentVal;

    try {
      const res = await AdminService.updateFeatureFlags({ [key]: nextVal });
      if (res.success) {
        setSettings({
          ...settings,
          featuresJson: res.data.featuresJson,
        });

        // Also update runtime featureConfig reference
        if (key in featureConfig) {
          (featureConfig as any)[key] = nextVal;
        }

        showNotification(
          "success",
          `Feature flag '${String(key)}' is now ${nextVal ? "ENABLED" : "DISABLED"}`
        );
      } else {
        showNotification("error", res.message || "Failed to toggle feature flag");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error toggling feature flag");
    }
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-24">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <span>Administration</span>
            <span>/</span>
            <span>Module 07</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Sliders className="w-7 h-7 text-amber-400" />
            <span>Store Settings & Feature Flags Engine</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage global store preferences, shipping policies, instant feature toggling, and storefront themes.
          </p>
        </div>

        <button
          onClick={loadSettings}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          <span>Sync Settings</span>
        </button>
      </div>

      {/* Permission Warning if viewer lacks settings:manage */}
      {!canManage && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-xs text-amber-200">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <span>
            Read-only mode: You are viewing store settings. Modifying store branding, shipping limits, theme presets, or toggling feature flags requires the <code className="bg-amber-950/80 px-1 py-0.5 rounded text-amber-300">settings:manage</code> permission (SUPER_ADMIN only).
          </span>
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 border shadow-lg transition-all ${
            feedback.type === "success"
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
              : feedback.type === "info"
              ? "bg-sky-950/80 border-sky-800 text-sky-200"
              : "bg-rose-950/80 border-rose-800 text-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : feedback.type === "info" ? (
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{feedback.text}</span>
        </div>
      )}

      {/* 2. Store Identity & Shipping Rules Form */}
      <form onSubmit={handleSaveStoreConfig} className="space-y-8">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-400" />
                <span>Store Identity & Contact Details</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Global brand identifiers displayed across invoices, headers, and emails.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="font-bold uppercase text-slate-300 block mb-1.5">
                Store Name
              </label>
              <input
                type="text"
                required
                disabled={!canManage}
                value={formStoreName}
                onChange={(e) => setFormStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 text-white font-medium border border-slate-800 rounded-lg focus:border-amber-400 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="font-bold uppercase text-slate-300 block mb-1.5">
                Brand Tagline
              </label>
              <input
                type="text"
                disabled={!canManage}
                value={formTagline}
                onChange={(e) => setFormTagline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 text-white border border-slate-800 rounded-lg focus:border-amber-400 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="font-bold uppercase text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Concierge Support Email</span>
              </label>
              <input
                type="email"
                required
                disabled={!canManage}
                value={formSupportEmail}
                onChange={(e) => setFormSupportEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 text-white font-mono border border-slate-800 rounded-lg focus:border-amber-400 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="font-bold uppercase text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Concierge Support Phone</span>
              </label>
              <input
                type="text"
                disabled={!canManage}
                value={formSupportPhone}
                onChange={(e) => setFormSupportPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 text-white font-mono border border-slate-800 rounded-lg focus:border-amber-400 focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Shipping Thresholds & Policies */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <span>Shipping Thresholds & Store Policies</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Checkout cart thresholds to protect delivery margins on luxury parcels.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="font-bold uppercase text-slate-300 block mb-1.5">
                Free Shipping Basket Threshold ({formCurrencySymbol})
              </label>
              <input
                type="number"
                step="any"
                required
                disabled={!canManage}
                value={formFreeShippingThreshold}
                onChange={(e) => setFormFreeShippingThreshold(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 text-white font-mono font-bold border border-slate-800 rounded-lg focus:border-amber-400 focus:outline-none disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Orders equal or exceeding this total qualify for complimentary delivery.
              </span>
            </div>

            <div>
              <label className="font-bold uppercase text-slate-300 block mb-1.5">
                Flat Shipping Fee ({formCurrencySymbol})
              </label>
              <input
                type="number"
                step="any"
                required
                disabled={!canManage}
                value={formFlatShippingRate}
                onChange={(e) => setFormFlatShippingRate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 text-white font-mono font-bold border border-slate-800 rounded-lg focus:border-amber-400 focus:outline-none disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Standard courier fee applied to cart orders under the free threshold.
              </span>
            </div>

            <div className="md:col-span-2">
              <label className="font-bold uppercase text-slate-300 block mb-1.5">
                Shipping Policy Clause
              </label>
              <textarea
                rows={2}
                disabled={!canManage}
                value={formShippingPolicy}
                onChange={(e) => setFormShippingPolicy(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 text-white border border-slate-800 rounded-lg focus:border-amber-400 focus:outline-none disabled:opacity-60"
                placeholder="e.g. Complimentary white-glove express delivery on luxury orders above ₹2,999."
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold uppercase text-slate-300 block mb-1.5">
                Concierge Return & Exchange Policy Clause
              </label>
              <textarea
                rows={2}
                disabled={!canManage}
                value={formReturnPolicy}
                onChange={(e) => setFormReturnPolicy(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 text-white border border-slate-800 rounded-lg focus:border-amber-400 focus:outline-none disabled:opacity-60"
                placeholder="e.g. 7-day complimentary bespoke concierge returns for un-altered garments."
              />
            </div>
          </div>

          {canManage && (
            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-sm hover:shadow-amber-500/20"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : "Save Store Configuration"}</span>
              </button>
            </div>
          )}
        </div>
      </form>

      {/* 3. Multi-Theme Preset Switcher */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-400" />
              <span>Multi-Theme Preset Switcher</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly change buyer storefront branding, editorial serif styles, and color palettes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Active:</span>
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
              {settings?.activeTheme || currentUITheme.id}
            </span>
          </div>
        </div>

        {/* Theme Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.values(PRESET_THEMES).map((preset) => {
            const isSelected =
              (settings?.activeTheme || currentUITheme.id) === preset.id;

            return (
              <div
                key={preset.id}
                className={`p-5 rounded-xl border flex flex-col justify-between transition-all relative ${
                  isSelected
                    ? "bg-slate-900 border-amber-400 ring-2 ring-amber-400/30 shadow-lg"
                    : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {preset.name}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2 py-0.5 rounded">
                        <Sparkles className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>

                  {/* Visual Aesthetics Description */}
                  <p className="text-[11px] text-slate-400">
                    {preset.id === "luxury-fashion"
                      ? "Noir Black, Gold foil accent, Silk White • Editorial Serif & Clean Sans"
                      : preset.id === "monochrome-minimal"
                      ? "Slate Gray, Clean White, High contrast • Architectural Sans-Serif"
                      : preset.id === "royal-festive"
                      ? "Deep Crimson, Embroidered Gold, Regal Ivory • Classical Serif Accents"
                      : `Custom tailored palette with ${preset.headingFont.split(",")[0].replace(/'/g, "")}`}
                  </p>

                  {/* Palette Preview Swatches */}
                  <div className="flex items-center gap-2 pt-1">
                    <span
                      className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: preset.primaryColor }}
                      title="Primary"
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: preset.secondaryColor }}
                      title="Secondary"
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: preset.accentColor }}
                      title="Accent"
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: preset.backgroundColor }}
                      title="Background"
                    />
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">
                    Font: {preset.headingFont.split(",")[0].replace(/'/g, "")}
                  </span>

                  {canManage && (
                    <button
                      type="button"
                      disabled={isSelected || isSwitchingTheme}
                      onClick={() => handleApplyTheme(preset.id)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-amber-400/20 text-amber-300 cursor-default"
                          : "bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300"
                      }`}
                    >
                      {isSelected ? "Active Preset" : "Apply Theme"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Instant Feature Flags Toggle Engine */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <span>Instant Feature Flags Engine</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enable or disable luxury buyer capabilities in real-time without redeploying code.
            </p>
          </div>

          <span className="text-[10px] text-slate-500 font-mono">
            {FEATURE_DISPLAY_LIST.length} Configured Platform Flags
          </span>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURE_DISPLAY_LIST.map(({ key, label, description, icon: IconComponent }) => {
            const isEnabled = settings?.featuresJson?.[key] ?? true;

            return (
              <div
                key={key}
                className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg text-amber-400 shrink-0 mt-0.5">
                    <IconComponent className="w-4 h-4" />
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wide">
                        {label}
                      </span>
                      <span className="font-mono text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {key}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {description}
                    </p>
                  </div>
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={() => handleToggleFeature(key)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                    isEnabled ? "bg-amber-500" : "bg-slate-700"
                  }`}
                  title={isEnabled ? "Click to disable" : "Click to enable"}
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
