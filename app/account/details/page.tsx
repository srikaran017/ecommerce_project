"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { CustomerService, AccountDetails } from "@/services/customer.service";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Lock,
  Key,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  RefreshCw,
  Save,
  Contact2,
} from "lucide-react";

export default function AccountDetailsPage() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuthStore();

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileFormData, setProfileFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });

  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string | null>(null);
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(null);

  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/account/details");
      return;
    }

    async function fetchAccount() {
      setIsLoadingProfile(true);
      try {
        const res = await CustomerService.getAccountDetails();
        if (res.success && res.data) {
          setProfileFormData({
            firstName: res.data.firstName || "",
            lastName: res.data.lastName || "",
            email: res.data.email || "",
            phoneNumber: res.data.phoneNumber || res.data.phone || "",
          });
        } else if (user) {
          const parts = (user.name || "").trim().split(" ");
          setProfileFormData({
            firstName: parts[0] || "",
            lastName: parts.slice(1).join(" ") || "",
            email: user.email || "",
            phoneNumber: user.phone || "",
          });
        }
      } catch {
        if (user) {
          const parts = (user.name || "").trim().split(" ");
          setProfileFormData({
            firstName: parts[0] || "",
            lastName: parts.slice(1).join(" ") || "",
            email: user.email || "",
            phoneNumber: user.phone || "",
          });
        }
      } finally {
        setIsLoadingProfile(false);
      }
    }

    fetchAccount();
  }, [isAuthenticated, user, router]);

  // Handle profile form submit -> PATCH /api/v1/customer/account
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMessage(null);
    setProfileErrorMessage(null);

    if (!profileFormData.firstName.trim()) {
      setProfileErrorMessage("First name is required.");
      return;
    }
    if (!profileFormData.lastName.trim()) {
      setProfileErrorMessage("Last name is required.");
      return;
    }
    if (!profileFormData.email.trim()) {
      setProfileErrorMessage("Email address is required.");
      return;
    }

    setProfileSaving(true);
    try {
      const res = await CustomerService.updateAccountDetails({
        firstName: profileFormData.firstName,
        lastName: profileFormData.lastName,
        email: profileFormData.email,
        phoneNumber: profileFormData.phoneNumber,
      });

      if (res.success) {
        setProfileSuccessMessage(res.message || "Account details updated successfully.");
        updateUser({
          name: `${profileFormData.firstName.trim()} ${profileFormData.lastName.trim()}`,
          email: profileFormData.email.trim(),
          phone: profileFormData.phoneNumber.trim() || undefined,
        });
      } else {
        setProfileErrorMessage(res.message || "Failed to update account details.");
      }
    } catch (err: any) {
      setProfileErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle password form submit -> PATCH /api/v1/customer/account/password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMessage(null);
    setPasswordErrorMessage(null);

    if (!passwordFormData.currentPassword) {
      setPasswordErrorMessage("Current password is required.");
      return;
    }
    if (passwordFormData.newPassword.length < 8) {
      setPasswordErrorMessage("New password must be at least 8 characters long.");
      return;
    }
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordErrorMessage("New password and confirmation do not match.");
      return;
    }
    if (passwordFormData.currentPassword === passwordFormData.newPassword) {
      setPasswordErrorMessage("New password must be different from current password.");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await CustomerService.changePassword({
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword,
      });

      if (res.success) {
        setPasswordSuccessMessage(
          res.message || "Password changed successfully."
        );
        setPasswordFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPasswordErrorMessage(res.message || "Failed to change password.");
      }
    } catch (err: any) {
      setPasswordErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <span className="text-neutral-300">/</span>
          <Link href="/account" className="hover:text-neutral-900 transition-colors">
            Account
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-900 font-semibold">Profile & security</span>
        </nav>

        {/* Back link & Title */}
        <div className="space-y-2 border-b border-neutral-200/80 pb-5">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to account</span>
          </Link>

          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
              Profile & security
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Update your personal details, email address, and account password.
            </p>
          </div>
        </div>

        {/* Section 1: Personal Information Form (Shopify Polaris style) */}
        <div className="bg-white rounded-xl border border-neutral-200/90 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <Contact2 className="w-4 h-4 text-neutral-500" />
              <span>Personal information</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              These details are used for order notifications and fulfillment.
            </p>
          </div>

          {/* Feedback banners */}
          {profileSuccessMessage && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccessMessage}</span>
            </div>
          )}
          {profileErrorMessage && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{profileErrorMessage}</span>
            </div>
          )}

          {isLoadingProfile ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto" />
              <p className="text-xs text-neutral-400">Loading details...</p>
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-700 block">
                    First name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileFormData.firstName}
                    onChange={(e) => setProfileFormData({ ...profileFormData, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-neutral-900 bg-white"
                    placeholder="e.g. John"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-700 block">
                    Last name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileFormData.lastName}
                    onChange={(e) => setProfileFormData({ ...profileFormData, lastName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-neutral-900 bg-white"
                    placeholder="e.g. Doe"
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
                    value={profileFormData.email}
                    onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-neutral-900 bg-white"
                    placeholder="john.doe@example.com"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-700 block">
                    Phone number <span className="text-neutral-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={profileFormData.phoneNumber}
                    onChange={(e) => setProfileFormData({ ...profileFormData, phoneNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all font-mono text-neutral-900 bg-white"
                    placeholder="+91 98765 00002"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {profileSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{profileSaving ? "Saving..." : "Save changes"}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Section 2: Change Password Form (Shopify Polaris style) */}
        <div className="bg-white rounded-xl border border-neutral-200/90 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-neutral-500" />
              <span>Password & credentials</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Securely update your password. Must be at least 8 characters.
            </p>
          </div>

          {/* Feedback banners */}
          {passwordSuccessMessage && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccessMessage}</span>
            </div>
          )}
          {passwordErrorMessage && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{passwordErrorMessage}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700 block">
                  Current password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={passwordFormData.currentPassword}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-neutral-900 bg-white"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700 block">
                  New password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={passwordFormData.newPassword}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-neutral-900 bg-white"
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700 block">
                  Confirm new password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={passwordFormData.confirmPassword}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 pr-10 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all text-neutral-900 bg-white"
                    placeholder="Re-type new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Validation helper rules */}
            <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200/80 flex flex-wrap gap-4 text-xs text-neutral-600">
              <span className="flex items-center gap-1.5">
                <Check
                  className={`w-3.5 h-3.5 ${
                    passwordFormData.newPassword.length >= 8 ? "text-emerald-600 font-bold" : "text-neutral-300"
                  }`}
                />
                At least 8 characters
              </span>
              <span className="flex items-center gap-1.5">
                <Check
                  className={`w-3.5 h-3.5 ${
                    passwordFormData.newPassword && passwordFormData.newPassword !== passwordFormData.currentPassword
                      ? "text-emerald-600 font-bold"
                      : "text-neutral-300"
                  }`}
                />
                Different from current
              </span>
              <span className="flex items-center gap-1.5">
                <Check
                  className={`w-3.5 h-3.5 ${
                    passwordFormData.newPassword && passwordFormData.newPassword === passwordFormData.confirmPassword
                      ? "text-emerald-600 font-bold"
                      : "text-neutral-300"
                  }`}
                />
                Passwords match
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={
                  passwordSaving ||
                  !passwordFormData.currentPassword ||
                  passwordFormData.newPassword.length < 8 ||
                  passwordFormData.newPassword !== passwordFormData.confirmPassword
                }
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {passwordSaving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Key className="w-3.5 h-3.5" />
                )}
                <span>{passwordSaving ? "Updating password..." : "Update password"}</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
