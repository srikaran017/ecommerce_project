"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { CustomerService, CustomerProfile } from "@/services/customer.service";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
} from "lucide-react";

interface ProfileTabProps {
  onShowToast: (msg: string) => void;
}

const LUXURY_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300",
];

export function ProfileTab({ onShowToast }: ProfileTabProps) {
  const { user, updateUser } = useAuthStore();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatarUrl: user?.avatarUrl || "",
    dateOfBirth: "",
    genderPreference: "ALL" as "WOMENSWEAR" | "MENSWEAR" | "ALL",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    async function loadExtraProfile() {
      const extra = await CustomerService.getProfile();
      if (extra) {
        setFormData((prev) => ({
          ...prev,
          name: extra.name || prev.name,
          email: extra.email || prev.email,
          phone: extra.phone || prev.phone,
          avatarUrl: extra.avatarUrl || prev.avatarUrl,
          dateOfBirth: extra.dateOfBirth || prev.dateOfBirth,
          genderPreference: extra.genderPreference || prev.genderPreference,
        }));
      }
    }
    loadExtraProfile();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleAvatarSelect = (url: string) => {
    setFormData((prev) => ({ ...prev, avatarUrl: url }));
    setHasUnsavedChanges(true);
    setShowAvatarPicker(false);
    onShowToast("Avatar image updated. Click Save Changes to confirm.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      onShowToast("Please enter your full name.");
      return;
    }
    if (!formData.email.trim()) {
      onShowToast("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await CustomerService.updateProfile(formData);
      if (res.success) {
        // Sync with global auth store
        updateUser({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          avatarUrl: formData.avatarUrl,
        });
        setHasUnsavedChanges(false);
        onShowToast(res.message || "Personal details updated successfully.");
      } else {
        onShowToast(res.message || "Failed to update profile.");
      }
    } catch {
      onShowToast("An error occurred while saving your profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-sm space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-neutral-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-neutral-900 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-700" />
            <span>Personal Profile & Identity</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage your personal couture credentials, delivery contact, and atelier preferences.
          </p>
        </div>

        {hasUnsavedChanges && (
          <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 self-start sm:self-auto flex items-center gap-1.5 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            Unsaved changes
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 rounded-2xl bg-neutral-50/60 border border-neutral-100">
          <div className="relative group">
            {formData.avatarUrl ? (
              <img
                src={formData.avatarUrl}
                alt={formData.name || "Client"}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-300 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-amber-100/70 border border-amber-200 flex items-center justify-center text-amber-800 font-bold text-2xl">
                {(formData.name || "C").charAt(0).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="absolute -bottom-2 -right-2 p-2 bg-neutral-900 hover:bg-amber-600 text-white rounded-full shadow-md transition-colors"
              title="Change Portrait"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-900">Client Portrait</span>
              <span className="text-[10px] font-mono text-neutral-400">Atelier Tier: Privilege</span>
            </div>
            <p className="text-xs text-neutral-500">
              Customize your profile photo with our curated luxury editorial avatars or custom image URL.
            </p>
            <button
              type="button"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="text-xs font-bold text-amber-800 hover:underline uppercase tracking-wider inline-block pt-0.5"
            >
              {showAvatarPicker ? "Close Portrait Selector" : "Choose from Atelier Avatars →"}
            </button>
          </div>
        </div>

        {/* Avatar Picker Drawer */}
        {showAvatarPicker && (
          <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-4 animate-fade-in">
            <p className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Select Curated Atelier Avatar:
            </p>
            <div className="flex flex-wrap gap-3">
              {LUXURY_AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAvatarSelect(url)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                    formData.avatarUrl === url ? "border-amber-700 ring-2 ring-amber-300" : "border-transparent"
                  }`}
                >
                  <img src={url} alt="Avatar option" className="w-14 h-14 object-cover" />
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-amber-200/60">
              <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                Or paste custom image link (URL):
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customAvatarUrl) {
                      handleAvatarSelect(customAvatarUrl);
                      setCustomAvatarUrl("");
                    }
                  }}
                  className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-700" />
              <span>Full Name *</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full px-4 py-3 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-medium text-neutral-900"
              placeholder="e.g. Eleanor Vance"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-700" />
              <span>Email Address (Account ID) *</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full px-4 py-3 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-medium text-neutral-900"
              placeholder="e.g. eleanor@vance-couture.com"
            />
            <p className="text-[10px] text-neutral-400">
              Orders and shipping tracking notifications are delivered to this address.
            </p>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-700" />
              <span>Phone / WhatsApp Contact</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full px-4 py-3 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-mono font-medium text-neutral-900"
              placeholder="e.g. +91 98765 00002"
            />
            <p className="text-[10px] text-neutral-400">
              Used for courier delivery PIN and dispatch confirmation SMS.
            </p>
          </div>

          {/* Date of Birth */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>Date of Birth (Optional)</span>
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              className="w-full px-4 py-3 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-medium text-neutral-900"
            />
            <p className="text-[10px] text-neutral-400">
              Enjoy complimentary bespoke styling gifts during your anniversary month.
            </p>
          </div>

          {/* Styling Preference */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Capsule & Wardrobe Preference</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "WOMENSWEAR", label: "Haute Womenswear" },
                { id: "MENSWEAR", label: "Tailored Menswear" },
                { id: "ALL", label: "All Collections" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChange("genderPreference", opt.id)}
                  className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    formData.genderPreference === opt.id
                      ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                      : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3.5 bg-neutral-900 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isLoading ? "Saving Details..." : "Save Profile Details"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
