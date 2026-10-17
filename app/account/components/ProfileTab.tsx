"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { CustomerService } from "@/services/customer.service";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Camera,
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
    onShowToast("Avatar image updated. Click Save changes to confirm.");
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
    <div className="bg-white rounded-xl border border-neutral-200/90 p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
            <User className="w-4 h-4 text-neutral-500" />
            <span>Profile details</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage your personal profile and account credentials.
          </p>
        </div>

        {hasUnsavedChanges && (
          <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 self-start sm:self-auto flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Unsaved changes
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200/80">
          <div className="relative group">
            {formData.avatarUrl ? (
              <img
                src={formData.avatarUrl}
                alt={formData.name || "Client"}
                className="w-16 h-16 rounded-full object-cover border border-neutral-200 shadow-2xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center text-neutral-700 font-semibold text-xl">
                {(formData.name || "C").charAt(0).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="absolute -bottom-1 -right-1 p-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full shadow-sm transition-colors cursor-pointer"
              title="Change Photo"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1 flex-1">
            <span className="text-xs font-semibold text-neutral-900 block">Profile photo</span>
            <p className="text-xs text-neutral-500">
              Select an avatar or provide a custom image URL.
            </p>
            <button
              type="button"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="text-xs font-medium text-neutral-700 hover:text-neutral-900 underline cursor-pointer pt-0.5"
            >
              {showAvatarPicker ? "Close selector" : "Choose avatar"}
            </button>
          </div>
        </div>

        {/* Avatar Picker Drawer */}
        {showAvatarPicker && (
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3 animate-fade-in">
            <p className="text-xs font-medium text-neutral-700">
              Select avatar:
            </p>
            <div className="flex flex-wrap gap-2.5">
              {LUXURY_AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAvatarSelect(url)}
                  className={`relative rounded-full overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 ${
                    formData.avatarUrl === url ? "border-neutral-900 ring-2 ring-neutral-900/20" : "border-transparent"
                  }`}
                >
                  <img src={url} alt="Avatar option" className="w-12 h-12 object-cover" />
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <label className="text-xs text-neutral-600 block mb-1">
                Or paste image link:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customAvatarUrl) {
                      handleAvatarSelect(customAvatarUrl);
                      setCustomAvatarUrl("");
                    }
                  }}
                  className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700 block">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all font-medium text-neutral-900 bg-white"
              placeholder="e.g. Eleanor Vance"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700 block">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all font-medium text-neutral-900 bg-white"
              placeholder="e.g. eleanor@vance.com"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700 block">
              Phone number <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all font-mono font-medium text-neutral-900 bg-white"
              placeholder="e.g. +91 98765 00002"
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-700 block">
              Date of birth <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all font-medium text-neutral-900 bg-white"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2.5">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isLoading ? "Saving..." : "Save changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
