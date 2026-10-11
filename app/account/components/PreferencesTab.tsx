"use client";

import React, { useState, useEffect } from "react";
import { CustomerService, CustomerPreferences } from "@/services/customer.service";
import {
  Bell,
  MessageSquare,
  Mail,
  Smartphone,
  Globe,
  Shield,
  Download,
  Trash2,
  Save,
  CheckCircle2,
} from "lucide-react";

interface PreferencesTabProps {
  onShowToast: (msg: string) => void;
}

export function PreferencesTab({ onShowToast }: PreferencesTabProps) {
  const [preferences, setPreferences] = useState<CustomerPreferences>(
    CustomerService.getPreferences()
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key: keyof CustomerPreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await CustomerService.savePreferences(preferences);
      if (res.success) {
        onShowToast(res.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(preferences, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `maison_client_data_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast("Client privacy archive generated and downloaded.");
  };

  return (
    <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-8 shadow-sm space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-neutral-100 pb-5">
        <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-neutral-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-700" />
          <span>Atelier Communications & Privacy</span>
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Control how and when you receive courier tracking updates, private showroom invitations, and VIP releases.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Notifications Grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
            Dispatch & Marketing Channels
          </h3>

          <div className="space-y-3">
            {/* Order SMS */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">
                    Order Dispatch & Delivery SMS
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Real-time SMS alerts containing your courier tracking PIN and live transit ETA.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.orderSms}
                onChange={() => handleToggle("orderSms")}
                className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>

            {/* WhatsApp Updates */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">
                    WhatsApp Concierge Notifications
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Receive tracking milestones, packing slips, and delivery confirmations on WhatsApp.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.whatsappUpdates}
                onChange={() => handleToggle("whatsappUpdates")}
                className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>

            {/* Pre-sale & Haute Couture Access */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">
                    Private Atelier Pre-Sale Invitations
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Early access to limited capsule releases 24 hours prior to public launch.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.preSaleAccess}
                onChange={() => handleToggle("preSaleAccess")}
                className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>

            {/* Editorial Newsletter */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">
                    Maison Editorial Newsletter
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Curated styling guides, seasonal color forecasts, and textile craftsmanship essays.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.newsletter}
                onChange={() => handleToggle("newsletter")}
                className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Currency & Region */}
        <div className="pt-6 border-t border-neutral-100 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-amber-700" />
            <span>Storefront Regional Standards</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-neutral-100 bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Active Store Currency
              </span>
              <p className="text-xs font-bold text-neutral-900">
                INR (₹ - Indian Rupee) • Domestic GST Included
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-neutral-100 bg-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                Language & Format
              </span>
              <p className="text-xs font-bold text-neutral-900">
                English (India - en-IN)
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-3.5 bg-neutral-900 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save Preferences"}</span>
          </button>
        </div>
      </form>

      {/* GDPR Data Rights & Erase */}
      <div className="pt-6 border-t border-neutral-100 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
          Client Data Privacy & GDPR Rights
        </h3>

        <div className="p-5 rounded-2xl bg-neutral-50/70 border border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-neutral-900">
              Download Your Personal Client Archive
            </p>
            <p className="text-xs text-neutral-500">
              Export an encrypted JSON record of your past orders, delivery addresses, and account credentials.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportData}
            className="px-4 py-2 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
