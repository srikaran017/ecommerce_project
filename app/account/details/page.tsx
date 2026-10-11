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
  const { user, isAuthenticated, updateUser, logout } = useAuthStore();

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
        // Reactively update local auth store
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
          res.message || "Password changed successfully. Please log in again with your new password."
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
    <div className="min-h-screen bg-[#fafafa] py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
          <Link href="/" className="hover:text-neutral-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/account" className="hover:text-neutral-900 transition-colors">
            Account Center
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-semibold">Account Details</span>
        </nav>

        {/* Back link & Title */}
        <div className="space-y-2">
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2b97ba] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Account Center</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight font-sans">
            Account Details
          </h1>
          <p className="text-xs text-neutral-500">
            View and update your personal account information and securely manage your password.
          </p>
        </div>

        {/* Section 1: Personal Information Form */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-neutral-100 pb-4">
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Contact2 className="w-5 h-5 text-[#2b97ba]" />
              <span>Personal Information</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Updates will be securely synced with your customer account profile.
            </p>
          </div>

          {/* Feedback banners */}
          {profileSuccessMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{profileSuccessMessage}</span>
            </div>
          )}
          {profileErrorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{profileErrorMessage}</span>
            </div>
          )}

          {isLoadingProfile ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-neutral-300 border-t-[#2b97ba] rounded-full animate-spin mx-auto" />
              <p className="text-xs text-neutral-400">Loading account details...</p>
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* First Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 block">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileFormData.firstName}
                    onChange={(e) => setProfileFormData({ ...profileFormData, firstName: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#2b97ba]/20 focus:border-[#2b97ba] transition-all text-neutral-900"
                    placeholder="e.g. John"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 block">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileFormData.lastName}
                    onChange={(e) => setProfileFormData({ ...profileFormData, lastName: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#2b97ba]/20 focus:border-[#2b97ba] transition-all text-neutral-900"
                    placeholder="e.g. Doe"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 block">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={profileFormData.email}
                    onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#2b97ba]/20 focus:border-[#2b97ba] transition-all text-neutral-900"
                    placeholder="john.doe@example.com"
                  />
                  <p className="text-[11px] text-neutral-400">
                    Subject to existing email-verification rules and uniqueness check.
                  </p>
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 block">
                    Phone Number <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={profileFormData.phoneNumber}
                    onChange={(e) => setProfileFormData({ ...profileFormData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#2b97ba]/20 focus:border-[#2b97ba] transition-all text-neutral-900 font-mono"
                    placeholder="+1 555-123-4567 or +91 98765 00002"
                  />
                  <p className="text-[11px] text-neutral-400">
                    Optional contact number for shipping tracking notifications.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-6 py-2.5 bg-neutral-900 hover:bg-[#2b97ba] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {profileSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{profileSaving ? "Saving..." : "Save Account Changes"}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Section 2: Change Password Form */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-neutral-100 pb-4">
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#2b97ba]" />
              <span>Change Password</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Securely update your credentials. Password must be at least 8 characters long.
            </p>
          </div>

          {/* Feedback banners */}
          {passwordSuccessMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{passwordSuccessMessage}</span>
            </div>
          )}
          {passwordErrorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{passwordErrorMessage}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 block">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={passwordFormData.currentPassword}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#2b97ba]/20 focus:border-[#2b97ba] transition-all text-neutral-900"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 block">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={passwordFormData.newPassword}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#2b97ba]/20 focus:border-[#2b97ba] transition-all text-neutral-900"
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 block">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={passwordFormData.confirmPassword}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 pr-10 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#2b97ba]/20 focus:border-[#2b97ba] transition-all text-neutral-900"
                    placeholder="Re-type new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Validation helper rules */}
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 flex flex-wrap gap-4 text-[11px] text-neutral-600">
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
                Different from current password
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
                className="px-6 py-2.5 bg-neutral-900 hover:bg-[#2b97ba] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {passwordSaving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Key className="w-3.5 h-3.5" />
                )}
                <span>{passwordSaving ? "Updating Password..." : "Change Password"}</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
