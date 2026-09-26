"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Clock,
  Tag,
  CheckCircle2,
  Calendar,
  Percent,
  Layers,
} from "lucide-react";
import { ACTIVE_CAMPAIGN, PromotionCampaign } from "@/config/promotions.config";

export default function AdminPromotionsPage() {
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([
    ACTIVE_CAMPAIGN,
    {
      id: "camp_diwali_2026",
      title: "ROYAL DIWALI COUTURE PREVIEW",
      subtitle: "Pre-order exclusive Banarasi & Kanchipuram bridal weaves.",
      badge: "COMING SOON",
      discountPercentage: 25,
      couponCode: "DIWALI25",
      startDate: "2026-10-15T00:00:00.000Z",
      endDate: "2026-11-05T23:59:59.000Z",
      backgroundImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200",
      ctaText: "PRE-ORDER NOW",
      ctaLink: "/products?collection=festive-couture",
      isActive: false,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [discount, setDiscount] = useState("20");
  const [couponCode, setCouponCode] = useState("FESTIVE20");
  const [startDate, setStartDate] = useState("2026-09-01");
  const [endDate, setEndDate] = useState("2026-09-15");

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newCamp: PromotionCampaign = {
      id: `camp_${Date.now()}`,
      title: title.trim().toUpperCase(),
      subtitle: subtitle.trim(),
      badge: "SPECIAL PROMO",
      discountPercentage: Number(discount),
      couponCode: couponCode.trim().toUpperCase(),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      backgroundImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200",
      ctaText: "SHOP THE SALE",
      ctaLink: "/products?sort=discount",
      isActive: true,
    };

    setCampaigns([newCamp, ...campaigns]);
    setTitle("");
    setSubtitle("");
    setIsModalOpen(false);
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span>Promotions, Flash Sales & Countdown Campaigns</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Schedule seasonal festive campaigns with automated countdown clocks and storefront discount badges.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-md transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Flash Sale Campaign</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map((camp) => (
          <div
            key={camp.id}
            className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col justify-between shadow-lg"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {camp.badge}
                </span>

                <button
                  onClick={() => toggleCampaignStatus(camp.id)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    camp.isActive
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {camp.isActive ? "LIVE ON STOREFRONT" : "SCHEDULED / PAUSED"}
                </button>
              </div>

              <div>
                <h3 className="font-bold text-lg text-white uppercase tracking-wide">{camp.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{camp.subtitle}</p>
              </div>

              {/* Key Campaign Details */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Discount Savings</span>
                  <div className="text-base font-bold text-emerald-400">{camp.discountPercentage}% OFF</div>
                  <span className="text-[10px] font-mono text-amber-300">Code: {camp.couponCode}</span>
                </div>

                <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Campaign Timeline</span>
                  <div className="text-xs font-mono text-white truncate">
                    Ends: {new Date(camp.endDate).toLocaleDateString()}
                  </div>
                  <span className="text-[10px] text-amber-400/80 flex items-center gap-1 font-semibold">
                    <Clock className="w-3 h-3" /> Live Countdown
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400 text-[11px]">Target: {camp.ctaLink}</span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCampaigns(campaigns.filter((c) => c.id !== camp.id))}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create Campaign */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 p-6 sm:p-8 rounded-lg max-w-md w-full space-y-4">
            <h3 className="text-base font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3">
              Schedule Promotional Campaign
            </h3>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase text-slate-300 block mb-1">Campaign Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GRAND NAVRATRI FESTIVE SALE"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-md focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-slate-300 block mb-1">Subtitle / Offer Detail</label>
                <input
                  type="text"
                  placeholder="e.g. 20% off on all handloom silk sarees & lehengas"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-md focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">Discount %</label>
                  <input
                    type="number"
                    required
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-md"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 text-amber-300 font-mono font-bold uppercase border border-slate-700 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-md"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">End Date (Countdown Target)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-md"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded cursor-pointer"
                >
                  Publish Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
