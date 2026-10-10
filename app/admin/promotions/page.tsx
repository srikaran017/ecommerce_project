"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
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
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Eye,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  X,
  Image as ImageIcon,
  Flame,
  Check,
  Copy,
} from "lucide-react";
import { AdminService } from "@/services/admin.service";
import {
  AdminPromotion,
  CreatePromotionInput,
  UpdatePromotionInput,
} from "@/types/admin.types";
import { useAuthStore } from "@/stores/auth.store";
import { rbac } from "@/lib/rbac";

const SAMPLE_PRESET_IMAGES = [
  {
    name: "Banarasi & Kanchipuram Weaves",
    url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200",
  },
  {
    name: "Atelier Silk Evening Gowns",
    url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1200",
  },
  {
    name: "Royal Heritage Festive Couture",
    url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200",
  },
  {
    name: "Gold Embroidered Bridal Collection",
    url: "https://images.unsplash.com/photo-1518049362265-d5b2a6467637?q=80&w=1200",
  },
];

export default function AdminPromotionsPage() {
  const { user } = useAuthStore();
  const canManage = rbac.canManagePromotions(user?.role);

  // Data states
  const [promotions, setPromotions] = useState<AdminPromotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "EXPIRED">("ALL");

  // Selected Campaign for Live Preview
  const [selectedPreviewPromo, setSelectedPreviewPromo] = useState<AdminPromotion | null>(null);

  // Modals & Action States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<AdminPromotion | null>(null);
  const [deletingPromotion, setDeletingPromotion] = useState<AdminPromotion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formBadge, setFormBadge] = useState("SPECIAL PROMO");
  const [formDiscount, setFormDiscount] = useState("25");
  const [formCouponCode, setFormCouponCode] = useState("DIWALI25");
  const [formStartDate, setFormStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formEndDate, setFormEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [formBgImage, setFormBgImage] = useState(
    SAMPLE_PRESET_IMAGES[0].url
  );
  const [formCtaText, setFormCtaText] = useState("SHOP THE SALE");
  const [formCtaLink, setFormCtaLink] = useState("/products?collection=festive-couture");
  const [formSortOrder, setFormSortOrder] = useState("1");
  const [formIsActive, setFormIsActive] = useState(true);

  // Load promotions
  const loadPromotions = async () => {
    try {
      setIsLoading(true);
      const res = await AdminService.getPromotionsList({
        search: search.trim() || undefined,
        status: statusFilter,
      });

      if (res && Array.isArray(res.data)) {
        setPromotions(res.data);
        if (!selectedPreviewPromo && res.data.length > 0) {
          setSelectedPreviewPromo(res.data[0]);
        }
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load promotions");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, [search, statusFilter]);

  const showNotification = (type: "success" | "error" | "info", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = promotions.length;
    const now = Date.now();
    const active = promotions.filter(
      (p) => p.isActive && new Date(p.endDate).getTime() >= now
    ).length;
    const paused = promotions.filter((p) => !p.isActive).length;
    const expired = promotions.filter(
      (p) => new Date(p.endDate).getTime() < now
    ).length;

    return { total, active, paused, expired };
  }, [promotions]);

  // Open Create Modal
  const openCreateModal = () => {
    setFormTitle("");
    setFormSubtitle("");
    setFormBadge("SPECIAL PROMO");
    setFormDiscount("25");
    setFormCouponCode("DIWALI25");
    setFormStartDate(new Date().toISOString().split("T")[0]);
    setFormEndDate(
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
    setFormBgImage(SAMPLE_PRESET_IMAGES[0].url);
    setFormCtaText("SHOP THE SALE");
    setFormCtaLink("/products?collection=festive-couture");
    setFormSortOrder(String(promotions.length + 1));
    setFormIsActive(true);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (promo: AdminPromotion) => {
    setEditingPromotion(promo);
    setFormTitle(promo.title);
    setFormSubtitle(promo.subtitle || "");
    setFormBadge(promo.badge || "SPECIAL PROMO");
    setFormDiscount(String(promo.discountPercentage || "20"));
    setFormCouponCode(promo.couponCode || "");
    setFormStartDate(promo.startDate.split("T")[0]);
    setFormEndDate(promo.endDate.split("T")[0]);
    setFormBgImage(promo.backgroundImage);
    setFormCtaText(promo.ctaText || "SHOP THE SALE");
    setFormCtaLink(promo.ctaLink || "/products");
    setFormSortOrder(String(promo.sortOrder || 1));
    setFormIsActive(promo.isActive);
  };

  // Submit Create Campaign
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      showNotification("error", "Permission denied: promotions:manage permission required.");
      return;
    }

    if (!formTitle.trim()) {
      showNotification("error", "Campaign title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreatePromotionInput = {
        title: formTitle.trim().toUpperCase(),
        subtitle: formSubtitle.trim() || undefined,
        badge: formBadge.trim().toUpperCase(),
        discountPercentage: Number(formDiscount) || undefined,
        couponCode: formCouponCode.trim().toUpperCase() || undefined,
        startDate: new Date(formStartDate).toISOString(),
        endDate: new Date(`${formEndDate}T23:59:59.000Z`).toISOString(),
        backgroundImage: formBgImage.trim(),
        ctaText: formCtaText.trim() || "SHOP THE SALE",
        ctaLink: formCtaLink.trim() || "/products",
        sortOrder: Number(formSortOrder) || 1,
        isActive: formIsActive,
      };

      const res = await AdminService.createPromotion(payload);
      if (res.success && res.data) {
        showNotification("success", res.message || `Campaign '${formTitle.toUpperCase()}' scheduled`);
        setIsCreateModalOpen(false);
        setSelectedPreviewPromo(res.data);
        loadPromotions();
      } else {
        showNotification("error", res.message || "Failed to create campaign");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error scheduling campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Update Campaign
  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromotion) return;

    if (!canManage) {
      showNotification("error", "Permission denied: promotions:manage permission required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: UpdatePromotionInput = {
        title: formTitle.trim().toUpperCase(),
        subtitle: formSubtitle.trim() || undefined,
        badge: formBadge.trim().toUpperCase(),
        discountPercentage: Number(formDiscount) || undefined,
        couponCode: formCouponCode.trim().toUpperCase() || undefined,
        startDate: new Date(formStartDate).toISOString(),
        endDate: new Date(`${formEndDate}T23:59:59.000Z`).toISOString(),
        backgroundImage: formBgImage.trim(),
        ctaText: formCtaText.trim() || "SHOP THE SALE",
        ctaLink: formCtaLink.trim() || "/products",
        sortOrder: Number(formSortOrder) || 1,
        isActive: formIsActive,
      };

      const res = await AdminService.updatePromotion(editingPromotion.id, payload);
      if (res.success && res.data) {
        showNotification("success", res.message || `Campaign '${formTitle.toUpperCase()}' updated`);
        setEditingPromotion(null);
        setSelectedPreviewPromo(res.data);
        loadPromotions();
      } else {
        showNotification("error", res.message || "Failed to update campaign");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error updating campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Campaign Live / Paused
  const handleToggleStatus = async (promo: AdminPromotion) => {
    if (!canManage) {
      showNotification("error", "Permission denied: promotions:manage permission required.");
      return;
    }

    try {
      const nextStatus = !promo.isActive;
      const res = await AdminService.togglePromotionStatus(promo.id, nextStatus);
      if (res.success) {
        showNotification(
          "success",
          `Campaign '${promo.title}' ${nextStatus ? "is now LIVE" : "paused"}`
        );
        loadPromotions();
      } else {
        showNotification("error", res.message || "Failed to toggle status");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error toggling campaign status");
    }
  };

  // Confirm Delete Campaign
  const handleConfirmDelete = async () => {
    if (!deletingPromotion) return;

    if (!canManage) {
      showNotification("error", "Permission denied: promotions:manage permission required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await AdminService.deletePromotion(deletingPromotion.id);
      if (res.success) {
        showNotification(
          "success",
          res.message || `Campaign '${deletingPromotion.title}' deleted successfully`
        );
        if (selectedPreviewPromo?.id === deletingPromotion.id) {
          setSelectedPreviewPromo(null);
        }
        setDeletingPromotion(null);
        loadPromotions();
      } else {
        showNotification("error", res.message || "Failed to delete campaign");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error deleting campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <span>Marketing Engine</span>
            <span>/</span>
            <span>Module 06</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-amber-400" />
            <span>Promotions, Flash Sales & Hero Campaigns</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Deploy seasonal couture lookbooks, countdown sales carousels, and storefront marketing hero banners.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsRefreshing(true);
              loadPromotions();
            }}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            title="Sync campaigns"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
            <span>Sync</span>
          </button>

          {canManage && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-sm hover:shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Campaign</span>
            </button>
          )}
        </div>
      </div>

      {/* Permission Warning if viewer lacks promotions:manage */}
      {!canManage && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-xs text-amber-200">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Read-only mode: You are viewing promotional campaigns. To create, update banner imagery or toggle flash sales, your role requires the <code className="bg-amber-950/80 px-1 py-0.5 rounded text-amber-300">promotions:manage</code> permission.
          </span>
        </div>
      )}

      {/* Notification Toast */}
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
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{feedback.text}</span>
        </div>
      )}

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Live Hero Campaigns */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Live On Storefront</span>
            <Flame className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats.active}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
            <span>Broadcasting to shoppers</span>
          </div>
        </div>

        {/* Card 2: Paused / Scheduled */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Paused / Scheduled</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats.paused}
          </div>
          <div className="text-[11px] text-amber-400 mt-1">
            Prepped for seasonal triggers
          </div>
        </div>

        {/* Card 3: Total Promotions */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Campaigns</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Hero carousel & flash banners
          </div>
        </div>

        {/* Card 4: Expired */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Expired Archives</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-300 tracking-tight font-mono">
            {stats.expired}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Historical seasonal sales
          </div>
        </div>
      </div>

      {/* 3. Interactive Live Hero Banner Preview */}
      {selectedPreviewPromo && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Storefront Hero Preview:{" "}
                <span className="text-white font-mono">{selectedPreviewPromo.title}</span>
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Live Responsive Simulation
            </span>
          </div>

          {/* Banner Card Simulation */}
          <div className="relative rounded-xl overflow-hidden min-h-[260px] sm:min-h-[300px] flex flex-col justify-end p-6 sm:p-10 border border-slate-700/60 shadow-2xl bg-slate-900">
            {/* Background Image with Dark Vignette */}
            <div className="absolute inset-0">
              <img
                src={selectedPreviewPromo.backgroundImage}
                alt={selectedPreviewPromo.title}
                className="w-full h-full object-cover object-center transform scale-105 filter brightness-75 contrast-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
            </div>

            {/* Banner Content Overlay */}
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-amber-400 text-slate-950 shadow-md">
                  {selectedPreviewPromo.badge || "SPECIAL PROMO"}
                </span>

                {selectedPreviewPromo.discountPercentage && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {selectedPreviewPromo.discountPercentage}% OFF
                  </span>
                )}

                {selectedPreviewPromo.couponCode && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/60 text-amber-300 border border-amber-500/40">
                    CODE: {selectedPreviewPromo.couponCode}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                {selectedPreviewPromo.title}
              </h2>

              {selectedPreviewPromo.subtitle && (
                <p className="text-xs sm:text-sm text-slate-200/90 max-w-xl font-light drop-shadow">
                  {selectedPreviewPromo.subtitle}
                </p>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-2 cursor-default">
                  <span>{selectedPreviewPromo.ctaText || "SHOP THE SALE"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-lg border border-slate-700/60 backdrop-blur-sm">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Ends: {new Date(selectedPreviewPromo.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Filter & Search Bar */}
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns by headline or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">Status: All</option>
            <option value="ACTIVE">Live Only</option>
            <option value="INACTIVE">Paused / Scheduled</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {/* 5. Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-2 py-16 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto mb-2" />
            <span>Loading flash campaigns & marketing hero banners...</span>
          </div>
        ) : promotions.length === 0 ? (
          <div className="col-span-2 py-16 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 font-medium">No marketing campaigns match your filter.</p>
            <p className="text-slate-500 text-[11px] mt-1">
              Click &quot;Schedule Campaign&quot; above to launch a new flash sale banner.
            </p>
          </div>
        ) : (
          promotions.map((camp) => {
            const isLive = camp.isActive && new Date(camp.endDate).getTime() >= Date.now();
            const isExpired = new Date(camp.endDate).getTime() < Date.now();

            return (
              <div
                key={camp.id}
                className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg group hover:border-slate-700 transition-all"
              >
                {/* Banner Thumbnail Preview */}
                <div className="relative h-44 bg-slate-900 overflow-hidden">
                  <img
                    src={camp.backgroundImage}
                    alt={camp.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 shadow-md">
                      {camp.badge || "SPECIAL PROMO"}
                    </span>

                    <button
                      onClick={() => handleToggleStatus(camp)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                        isLive
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : isExpired
                          ? "bg-slate-800 text-slate-400 border border-slate-700"
                          : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                      }`}
                      title="Click to toggle storefront status"
                    >
                      {isLive ? "LIVE ON STOREFRONT" : isExpired ? "EXPIRED" : "PAUSED"}
                    </button>
                  </div>

                  {/* Bottom Image Overlay Details */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-400">Order: #{camp.sortOrder || 1}</span>
                      <h3 className="font-bold text-base text-white uppercase tracking-wide drop-shadow-md line-clamp-1">
                        {camp.title}
                      </h3>
                    </div>

                    <button
                      onClick={() => setSelectedPreviewPromo(camp)}
                      className="px-2.5 py-1 bg-black/60 hover:bg-black/90 text-amber-300 text-[10px] font-bold rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Preview banner simulation"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-5 space-y-4">
                  {camp.subtitle && (
                    <p className="text-xs text-slate-400 line-clamp-2">{camp.subtitle}</p>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* Discount & Code */}
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Discount Rate
                      </span>
                      <div className="text-base font-bold text-emerald-400 font-mono">
                        {camp.discountPercentage ? `${camp.discountPercentage}% OFF` : "CATALOG PROMO"}
                      </div>
                      {camp.couponCode && (
                        <div className="flex items-center gap-1 font-mono text-[11px] text-amber-300 font-bold">
                          <span>{camp.couponCode}</span>
                          <button
                            onClick={() => handleCopyCode(camp.couponCode!)}
                            className="text-slate-500 hover:text-white"
                          >
                            {copiedCode === camp.couponCode ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Timeline */}
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Sale Timeline
                      </span>
                      <div className="text-xs font-mono text-white truncate">
                        {new Date(camp.startDate).toLocaleDateString()} –{" "}
                        {new Date(camp.endDate).toLocaleDateString()}
                      </div>
                      <span className="text-[10px] text-amber-400/90 flex items-center gap-1 font-semibold">
                        <Clock className="w-3 h-3" />
                        {isExpired ? "Sale Ended" : "Live Countdown"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] truncate max-w-xs">
                    <span className="text-slate-500">CTA:</span>
                    <span className="text-white font-medium">&quot;{camp.ctaText}&quot;</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-amber-300 truncate">{camp.ctaLink}</span>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openEditModal(camp)}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Edit campaign"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeletingPromotion(camp)}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Create / Edit Campaign Modal */}
      {(isCreateModalOpen || editingPromotion) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 p-6 sm:p-8 rounded-2xl max-w-lg w-full space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>
                    {editingPromotion
                      ? `Edit Campaign: ${editingPromotion.title}`
                      : "Schedule Flash Sale Campaign"}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure hero banner, discount vouchers and countdown timer
                </p>
              </div>

              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingPromotion(null);
                }}
                className="text-slate-500 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={editingPromotion ? handleUpdateCampaign : handleCreateCampaign}
              className="space-y-4 text-xs"
            >
              {/* Title */}
              <div>
                <label className="font-bold uppercase text-slate-300 block mb-1">
                  Campaign Headline <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ROYAL DIWALI COUTURE PREVIEW"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-slate-900 text-white font-bold uppercase tracking-wide border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="font-bold uppercase text-slate-300 block mb-1">
                  Offer Subtitle / Copy
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Pre-order exclusive Banarasi & Kanchipuram bridal weaves."
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Badge & Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">
                    Banner Badge
                  </label>
                  <input
                    type="text"
                    placeholder="SPECIAL PROMO"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-slate-900 text-amber-300 font-bold uppercase border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">
                    Discount Rate (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="25"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 text-white font-mono font-bold border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Coupon Code & Sort Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">
                    Linked Coupon Code
                  </label>
                  <input
                    type="text"
                    placeholder="DIWALI25"
                    value={formCouponCode}
                    onChange={(e) => setFormCouponCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 bg-slate-900 text-amber-300 font-mono font-bold uppercase border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">
                    Carousel Priority / Sort
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 text-white font-mono border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Date Schedule */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">
                    End Date (Countdown Target)
                  </label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* CTA Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="SHOP THE SALE"
                    value={formCtaText}
                    onChange={(e) => setFormCtaText(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 text-white font-bold border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">
                    CTA Target Link
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="/products?collection=festive-couture"
                    value={formCtaLink}
                    onChange={(e) => setFormCtaLink(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 text-white font-mono border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Background Image URL / Presets */}
              <div className="space-y-2">
                <label className="font-bold uppercase text-slate-300 block">
                  Hero Background Image (URL or Cloudinary Asset)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://res.cloudinary.com/... or https://images.unsplash.com/..."
                  value={formBgImage}
                  onChange={(e) => setFormBgImage(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 text-white font-mono text-[11px] border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
                />

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Quick Luxury Presets:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {SAMPLE_PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormBgImage(preset.url)}
                        className={`text-left p-2 rounded-lg border text-[10px] truncate transition-all cursor-pointer ${
                          formBgImage === preset.url
                            ? "border-amber-400 bg-amber-500/10 text-amber-300 font-bold"
                            : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="promoActiveCheckbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <label
                  htmlFor="promoActiveCheckbox"
                  className="text-slate-300 font-semibold cursor-pointer select-none"
                >
                  Activate campaign immediately on storefront hero carousel
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingPromotion(null);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-lg cursor-pointer border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
                >
                  {isSubmitting
                    ? "Publishing..."
                    : editingPromotion
                    ? "Update Campaign"
                    : "Publish Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Delete Campaign Confirmation Modal */}
      {deletingPromotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Delete Campaign</h3>
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <p>
                Are you sure you want to remove promotional campaign{" "}
                <span className="font-bold text-white">&quot;{deletingPromotion.title}&quot;</span> from the storefront?
              </p>
              <p className="text-slate-400 text-[11px]">
                This will immediately remove the hero banner and flash countdown clock from the homepage.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingPromotion(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-lg cursor-pointer border border-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
              >
                {isSubmitting ? "Deleting..." : "Delete Campaign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
