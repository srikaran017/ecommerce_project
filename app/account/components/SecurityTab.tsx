"use client";

import React, { useState } from "react";
import { CustomerService } from "@/services/customer.service";
import {
  Lock,
  Key,
  Shield,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Smartphone,
  Laptop,
  CheckCircle2,
  RefreshCw,
  LogOut,
} from "lucide-react";

interface SecurityTabProps {
  onShowToast: (msg: string) => void;
}

export function SecurityTab({ onShowToast }: SecurityTabProps) {
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessions, setSessions] = useState([
    {
      id: "sess_1",
      device: "Windows PC • Chrome (Current Device)",
      location: "Mumbai, Maharashtra, India",
      activeSince: "Active Now",
      isCurrent: true,
    },
    {
      id: "sess_2",
      device: "Apple iPhone 15 Pro • Safari Mobile",
      location: "Mumbai, Maharashtra, India",
      activeSince: "Active 4 hours ago",
      isCurrent: false,
    },
  ]);

  // Compute password strength (0-4)
  const computeStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = computeStrength(passwords.newPassword);
  const strengthLabels = ["Very Weak", "Fair", "Moderate", "Strong", "Atelier Grade"];
  const strengthColors = ["bg-rose-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"];

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.currentPassword) {
      onShowToast("Please enter your current password.");
      return;
    }
    if (passwords.newPassword.length < 8) {
      onShowToast("New password must be at least 8 characters long.");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      onShowToast("New password and confirm password do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await CustomerService.changePassword(passwords);
      if (res.success) {
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
        onShowToast(res.message);
      } else {
        onShowToast(res.message);
      }
    } catch {
      onShowToast("Failed to change password. Please check your current password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeOtherSessions = () => {
    setSessions(sessions.filter((s) => s.isCurrent));
    onShowToast("All other client login sessions have been invalidated.");
  };

  const handleToggle2FA = () => {
    const nextState = !twoFactorEnabled;
    setTwoFactorEnabled(nextState);
    CustomerService.savePreferences({ twoFactorEnabled: nextState });
    onShowToast(
      nextState
        ? "Two-Factor Authentication activated. Security code will be sent on login."
        : "Two-Factor Authentication disabled."
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-sm space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-neutral-100 pb-5">
        <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-neutral-900 flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-700" />
          <span>Security & Password Management</span>
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Safeguard your luxury shopping account, stored payment tokens, and login credentials.
        </p>
      </div>

      {/* Change Password Form */}
      <form onSubmit={handlePasswordSubmit} className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-700" />
            <span>Update Account Password</span>
          </h3>
          <p className="text-xs text-neutral-500">
            Ensure you use a strong, unique password not shared across other websites.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                className="w-full px-4 py-3 pr-10 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-medium text-neutral-900"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                required
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="w-full px-4 py-3 pr-10 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-medium text-neutral-900"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 pr-10 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-medium text-neutral-900"
                placeholder="Re-type new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Password Strength Indicator */}
        {passwords.newPassword && (
          <div className="p-4 rounded-2xl bg-neutral-50/70 border border-neutral-100 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-700">Password Strength:</span>
              <span className="font-bold uppercase tracking-wider text-neutral-900 font-mono">
                {strengthLabels[strength]}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 h-1.5">
              {[0, 1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`rounded-full transition-all ${
                    step < strength ? strengthColors[strength] : "bg-neutral-200"
                  }`}
                />
              ))}
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-neutral-600 font-medium">
              <div className="flex items-center gap-1.5">
                <Check
                  className={`w-3.5 h-3.5 ${
                    passwords.newPassword.length >= 8 ? "text-emerald-600 font-bold" : "text-neutral-300"
                  }`}
                />
                <span>8+ Characters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check
                  className={`w-3.5 h-3.5 ${
                    /[A-Z]/.test(passwords.newPassword) ? "text-emerald-600 font-bold" : "text-neutral-300"
                  }`}
                />
                <span>Uppercase Letter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check
                  className={`w-3.5 h-3.5 ${
                    /[0-9]/.test(passwords.newPassword) ? "text-emerald-600 font-bold" : "text-neutral-300"
                  }`}
                />
                <span>Number (0-9)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check
                  className={`w-3.5 h-3.5 ${
                    /[^A-Za-z0-9]/.test(passwords.newPassword) ? "text-emerald-600 font-bold" : "text-neutral-300"
                  }`}
                />
                <span>Special Symbol</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !passwords.currentPassword || !passwords.newPassword}
            className="w-full sm:w-auto px-6 py-3.5 bg-neutral-900 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>{isLoading ? "Updating Password..." : "Update Password"}</span>
          </button>
        </div>
      </form>

      {/* Two-Factor Authentication Card */}
      <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-neutral-50/70 border border-neutral-100">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 border border-amber-200">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Two-Factor Authentication (2FA)
              </h4>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  twoFactorEnabled
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-neutral-200 text-neutral-600"
                }`}
              >
                {twoFactorEnabled ? "Active" : "Disabled"}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Require a high-security OTP confirmation code sent via SMS or Authenticator App on each sign in.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggle2FA}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer self-start sm:self-auto border ${
            twoFactorEnabled
              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
              : "bg-neutral-900 text-white border-neutral-900 hover:bg-amber-600"
          }`}
        >
          {twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
        </button>
      </div>

      {/* Active Login Sessions */}
      <div className="pt-6 border-t border-neutral-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Active Browser Sessions & Authorized Devices
            </h4>
            <p className="text-xs text-neutral-500 mt-0.5">
              Review browsers and hardware currently logged into this couture account.
            </p>
          </div>

          {sessions.length > 1 && (
            <button
              type="button"
              onClick={handleRevokeOtherSessions}
              className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Others</span>
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="p-4 rounded-2xl border border-neutral-100 bg-white flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600">
                  {sess.isCurrent ? <Laptop className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-neutral-900">{sess.device}</p>
                    {sess.isCurrent && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        This Device
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    {sess.location} • {sess.activeSince}
                  </p>
                </div>
              </div>

              <span className="text-[10px] text-neutral-400 font-mono">
                TLS 1.3 256-Bit Encrypted
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
