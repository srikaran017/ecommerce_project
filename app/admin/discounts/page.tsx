"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Tag,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Percent,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  Info,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  X,
  FileText,
  User,
  ShoppingBag,
  ExternalLink,
  Ban,
  Sparkles,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { AdminService } from "@/services/admin.service";
import {
  AdminCoupon,
  DiscountType,
  CreateCouponInput,
  UpdateCouponInput,
  CouponUsageLog,
} from "@/types/admin.types";
import { useAuthStore } from "@/stores/auth.store";
import { rbac } from "@/lib/rbac";

export default function AdminDiscountsPage() {
  const { user } = useAuthStore();
  const canManage = rbac.canManageCoupons(user?.role);

  // Data states
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "EXPIRED" | "INACTIVE">("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PERCENTAGE" | "FIXED">("ALL");
  const [sortOption, setSortOption] = useState<"newest" | "oldest" | "code_asc" | "used_desc">("newest");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | null>(null);
  const [viewingUsageCoupon, setViewingUsageCoupon] = useState<AdminCoupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<AdminCoupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Create/Edit
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [formDiscountValue, setFormDiscountValue] = useState("20");
  const [formMinOrderAmount, setFormMinOrderAmount] = useState("4000");
  const [formMaxDiscountAmount, setFormMaxDiscountAmount] = useState("2000");
  const [formStartDate, setFormStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formEndDate, setFormEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [formUsageLimit, setFormUsageLimit] = useState("500");
  const [formPerUserLimit, setFormPerUserLimit] = useState("1");
  const [formIsActive, setFormIsActive] = useState(true);

  // Load coupons from backend / local engine
  const loadCoupons = async () => {
    try {
      setIsLoading(true);
      const res = await AdminService.getCouponsList({
        search: search.trim() || undefined,
        status: statusFilter,
        discountType: typeFilter,
        sort: sortOption,
      });

      if (res && Array.isArray(res.data)) {
        setCoupons(res.data);
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load coupons");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, [search, statusFilter, typeFilter, sortOption]);

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
    const total = coupons.length;
    const active = coupons.filter((c) => c.computedStatus === "ACTIVE").length;
    const totalRedemptions = coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0);
    const expiredOrInactive = coupons.filter(
      (c) => c.computedStatus === "EXPIRED" || c.computedStatus === "INACTIVE"
    ).length;

    return { total, active, totalRedemptions, expiredOrInactive };
  }, [coupons]);

  // Open Create Modal
  const openCreateModal = () => {
    setFormCode("");
    setFormDescription("");
    setFormDiscountType("PERCENTAGE");
    setFormDiscountValue("20");
    setFormMinOrderAmount("4000");
    setFormMaxDiscountAmount("2000");
    setFormStartDate(new Date().toISOString().split("T")[0]);
    setFormEndDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
    setFormUsageLimit("500");
    setFormPerUserLimit("1");
    setFormIsActive(true);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (coupon: AdminCoupon) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormDescription(coupon.description || "");
    setFormDiscountType(
      coupon.discountType === "FIXED" || (coupon.discountType as string) === "FIXED_AMOUNT"
        ? "FIXED"
        : "PERCENTAGE"
    );
    setFormDiscountValue(String(coupon.discountValue || "0"));
    setFormMinOrderAmount(coupon.minOrderAmount ? String(coupon.minOrderAmount) : "");
    setFormMaxDiscountAmount(coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : "");
    setFormStartDate(coupon.startDate.split("T")[0]);
    setFormEndDate(coupon.endDate.split("T")[0]);
    setFormUsageLimit(String(coupon.usageLimit || "500"));
    setFormPerUserLimit(String(coupon.perUserLimit || "1"));
    setFormIsActive(coupon.isActive);
  };

  // Handle Create Coupon Submit
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      showNotification("error", "Permission denied: coupons:manage permission required.");
      return;
    }

    if (!formCode.trim()) {
      showNotification("error", "Coupon code is required");
      return;
    }

    const val = Number(formDiscountValue);
    if (isNaN(val) || val <= 0) {
      showNotification("error", "Discount value must be greater than zero");
      return;
    }

    if (formDiscountType === "PERCENTAGE" && val > 100) {
      showNotification("error", "Percentage discount cannot exceed 100%");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateCouponInput = {
        code: formCode.trim().toUpperCase(),
        description: formDescription.trim() || undefined,
        discountType: formDiscountType,
        discountValue: val,
        minOrderAmount: formMinOrderAmount ? Number(formMinOrderAmount) : undefined,
        maxDiscountAmount:
          formDiscountType === "PERCENTAGE" && formMaxDiscountAmount
            ? Number(formMaxDiscountAmount)
            : undefined,
        startDate: new Date(formStartDate).toISOString(),
        endDate: new Date(`${formEndDate}T23:59:59.000Z`).toISOString(),
        usageLimit: formUsageLimit ? Number(formUsageLimit) : 500,
        perUserLimit: formPerUserLimit ? Number(formPerUserLimit) : 1,
        isActive: formIsActive,
      };

      const res = await AdminService.createCoupon(payload);
      if (res.success) {
        showNotification("success", res.message || `Coupon '${formCode.toUpperCase()}' created`);
        setIsCreateModalOpen(false);
        loadCoupons();
      } else {
        showNotification("error", res.message || "Failed to create coupon");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error creating coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Update Coupon Submit
  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;

    if (!canManage) {
      showNotification("error", "Permission denied: coupons:manage permission required.");
      return;
    }

    const val = Number(formDiscountValue);
    if (isNaN(val) || val <= 0) {
      showNotification("error", "Discount value must be greater than zero");
      return;
    }

    if (formDiscountType === "PERCENTAGE" && val > 100) {
      showNotification("error", "Percentage discount cannot exceed 100%");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: UpdateCouponInput = {
        code: formCode.trim().toUpperCase(),
        description: formDescription.trim() || undefined,
        discountType: formDiscountType,
        discountValue: val,
        minOrderAmount: formMinOrderAmount ? Number(formMinOrderAmount) : undefined,
        maxDiscountAmount:
          formDiscountType === "PERCENTAGE" && formMaxDiscountAmount
            ? Number(formMaxDiscountAmount)
            : undefined,
        startDate: new Date(formStartDate).toISOString(),
        endDate: new Date(`${formEndDate}T23:59:59.000Z`).toISOString(),
        usageLimit: formUsageLimit ? Number(formUsageLimit) : 500,
        perUserLimit: formPerUserLimit ? Number(formPerUserLimit) : 1,
        isActive: formIsActive,
      };

      const res = await AdminService.updateCoupon(editingCoupon.id, payload);
      if (res.success) {
        showNotification("success", res.message || `Coupon '${formCode.toUpperCase()}' updated`);
        setEditingCoupon(null);
        loadCoupons();
      } else {
        showNotification("error", res.message || "Failed to update coupon");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error updating coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async (coupon: AdminCoupon) => {
    if (!canManage) {
      showNotification("error", "Permission denied: coupons:manage permission required.");
      return;
    }

    try {
      const nextStatus = !coupon.isActive;
      const res = await AdminService.toggleCouponStatus(coupon.id, nextStatus);
      if (res.success) {
        showNotification(
          "success",
          `Coupon '${coupon.code}' ${nextStatus ? "activated" : "deactivated"} successfully`
        );
        loadCoupons();
      } else {
        showNotification("error", res.message || "Failed to toggle status");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error toggling coupon status");
    }
  };

  // Handle Delete / Safe Deactivate
  const handleConfirmDelete = async () => {
    if (!deletingCoupon) return;

    if (!canManage) {
      showNotification("error", "Permission denied: coupons:manage permission required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await AdminService.deleteCoupon(deletingCoupon.id);
      if (res.success) {
        if (res.data?.action === "DEACTIVATED") {
          showNotification(
            "info",
            res.message ||
              `Coupon has ${deletingCoupon.usedCount} historical usages. It was deactivated instead of permanently deleted to safeguard invoice history.`
          );
        } else {
          showNotification(
            "success",
            res.message || `Coupon '${deletingCoupon.code}' successfully deleted`
          );
        }
        setDeletingCoupon(null);
        loadCoupons();
      } else {
        showNotification("error", res.message || "Failed to process coupon");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error deleting coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Usage Drawer
  const handleOpenUsageLogs = async (coupon: AdminCoupon) => {
    try {
      const detail = await AdminService.getCouponDetail(coupon.id);
      setViewingUsageCoupon(detail.data);
    } catch {
      setViewingUsageCoupon(coupon);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* 1. Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <span>Marketing Engine</span>
            <span>/</span>
            <span>Module 06</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Tag className="w-7 h-7 text-amber-400" />
            <span>Coupons, Discounts & Flash Quotas</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure basket threshold discounts, percentage vouchers, and safeguard historical invoice ledger integrity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsRefreshing(true);
              loadCoupons();
            }}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            title="Refresh coupons"
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
              <span>Create Coupon</span>
            </button>
          )}
        </div>
      </div>

      {/* Permission Warning if viewer lacks coupons:manage */}
      {!canManage && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-xs text-amber-200">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Read-only mode: You are viewing discounts with customer redemption metrics. To create, edit or deactivate coupons, your role requires the <code className="bg-amber-950/80 px-1 py-0.5 rounded text-amber-300">coupons:manage</code> permission.
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
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{feedback.text}</span>
        </div>
      )}

      {/* 2. KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Coupons */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Vouchers</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats.active}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-semibold">
            Live on checkout & cart baskets
          </div>
        </div>

        {/* Card 2: Total Redemptions */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Redemptions</span>
            <ShoppingBag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats.totalRedemptions}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Redeemed across completed orders
          </div>
        </div>

        {/* Card 3: Total Configured */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Catalog Codes</span>
            <Tag className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Percentage & fixed amount rules
          </div>
        </div>

        {/* Card 4: Expired / Exhausted */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Inactive / Expired</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-300 tracking-tight font-mono">
            {stats.expiredOrInactive}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Quota exhausted or dates elapsed
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search coupon code or description..."
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

        {/* Faceted Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">Status: All</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Discount Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">Type: All</option>
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED">Fixed Amount (₹)</option>
          </select>

          {/* Sort selector */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-400 font-mono text-[11px]"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="code_asc">Sort: Code (A-Z)</option>
            <option value="used_desc">Sort: Most Redeemed</option>
          </select>
        </div>
      </div>

      {/* 4. Coupons Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60 uppercase text-[10px] tracking-wider">
                <th className="py-4 px-6 font-semibold">Coupon Code & Details</th>
                <th className="py-4 px-6 font-semibold">Discount Rule</th>
                <th className="py-4 px-6 font-semibold">Basket Thresholds</th>
                <th className="py-4 px-6 font-semibold">Validity Schedule</th>
                <th className="py-4 px-6 font-semibold">Usage & Quotas</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto mb-2" />
                    <span>Loading discount coupons & redemption quotas...</span>
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Tag className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 font-medium">No coupons match your filter criteria.</p>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Try clearing search filters or create a new coupon code.
                    </p>
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => {
                  const isPct = coupon.discountType === "PERCENTAGE";
                  const percentUsed = coupon.usageLimit
                    ? Math.min(100, Math.round((coupon.usedCount / coupon.usageLimit) * 100))
                    : 0;

                  return (
                    <tr
                      key={coupon.id}
                      className="hover:bg-slate-900/40 transition-colors group"
                    >
                      {/* Code & Description */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-300 text-sm tracking-wide bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded">
                              {coupon.code}
                            </span>
                            <button
                              onClick={() => handleCopyCode(coupon.code)}
                              className="text-slate-500 hover:text-amber-400 transition-colors"
                              title="Copy code"
                            >
                              {copiedCode === coupon.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {coupon.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                              {coupon.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Discount Rule */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                            {isPct ? (
                              <>
                                <span className="text-emerald-400 font-mono">
                                  {Number(coupon.discountValue)}% OFF
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-emerald-400 font-mono">
                                  {storeConfig.currency.symbol}
                                  {Number(coupon.discountValue).toLocaleString()} OFF
                                </span>
                              </>
                            )}
                          </div>
                          <span className="inline-block text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                            {isPct ? "Percentage Rate" : "Fixed Basket Cut"}
                          </span>
                        </div>
                      </td>

                      {/* Thresholds & Cap Protection */}
                      <td className="py-4 px-6">
                        <div className="space-y-1 text-[11px]">
                          <div className="text-slate-300">
                            Min:{" "}
                            {coupon.minOrderAmount ? (
                              <span className="font-semibold text-white font-mono">
                                {storeConfig.currency.symbol}
                                {Number(coupon.minOrderAmount).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic">No minimum</span>
                            )}
                          </div>
                          {isPct && (
                            <div className="text-slate-400">
                              Cap:{" "}
                              {coupon.maxDiscountAmount ? (
                                <span className="font-mono text-amber-300 font-semibold">
                                  {storeConfig.currency.symbol}
                                  {Number(coupon.maxDiscountAmount).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-slate-500 italic">Uncapped</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Validity Schedule */}
                      <td className="py-4 px-6">
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>
                              {new Date(coupon.startDate).toLocaleDateString()} –{" "}
                              {new Date(coupon.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Expires: {new Date(coupon.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </td>

                      {/* Usage & Quotas */}
                      <td className="py-4 px-6">
                        <div className="space-y-1.5 w-36">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono font-bold text-white">
                              {coupon.usedCount}
                              {coupon.usageLimit && (
                                <span className="text-slate-400"> / {coupon.usageLimit}</span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {coupon.remainingUses !== undefined
                                ? `${coupon.remainingUses} left`
                                : ""}
                            </span>
                          </div>

                          {coupon.usageLimit && (
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  percentUsed >= 100
                                    ? "bg-rose-500"
                                    : percentUsed > 75
                                    ? "bg-amber-400"
                                    : "bg-emerald-400"
                                }`}
                                style={{ width: `${percentUsed}%` }}
                              />
                            </div>
                          )}

                          <div className="text-[10px] text-slate-400">
                            Limit: {coupon.perUserLimit || 1} / customer
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                            coupon.computedStatus === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                              : coupon.computedStatus === "EXPIRED"
                              ? "bg-slate-800 text-slate-400 border-slate-700"
                              : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              coupon.computedStatus === "ACTIVE"
                                ? "bg-emerald-400 animate-pulse"
                                : coupon.computedStatus === "EXPIRED"
                                ? "bg-slate-500"
                                : "bg-rose-400"
                            }`}
                          />
                          {coupon.computedStatus || (coupon.isActive ? "ACTIVE" : "INACTIVE")}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Redemptions Button */}
                          <button
                            onClick={() => handleOpenUsageLogs(coupon)}
                            className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                            title="View customer redemptions & order logs"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {canManage && (
                            <>
                              {/* Toggle Active Button */}
                              <button
                                onClick={() => handleToggleStatus(coupon)}
                                className={`p-1.5 hover:bg-slate-800 rounded-md transition-colors cursor-pointer ${
                                  coupon.isActive
                                    ? "text-emerald-400 hover:text-amber-400"
                                    : "text-slate-500 hover:text-emerald-400"
                                }`}
                                title={coupon.isActive ? "Deactivate coupon" : "Activate coupon"}
                              >
                                {coupon.isActive ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <Ban className="w-4 h-4" />
                                )}
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => openEditModal(coupon)}
                                className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
                                title="Edit coupon"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => setDeletingCoupon(coupon)}
                                className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Delete or deactivate coupon"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Create / Edit Coupon Modal */}
      {(isCreateModalOpen || editingCoupon) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 p-6 sm:p-8 rounded-2xl max-w-lg w-full space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-400" />
                  <span>
                    {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create Promotional Coupon"}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Module 06 discount rule specification & cap protection
                </p>
              </div>

              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingCoupon(null);
                }}
                className="text-slate-500 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={editingCoupon ? handleUpdateCoupon : handleCreateCoupon}
              className="space-y-4 text-xs"
            >
              {/* Code */}
              <div>
                <label className="font-bold uppercase text-slate-300 block mb-1">
                  Coupon Code <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DIWALI25, FESTIVE20, WELCOME1000"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-slate-900 text-amber-300 font-mono font-bold uppercase tracking-wider border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-bold uppercase text-slate-300 block mb-1">
                  Marketing Description / Terms
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Exclusive 25% off festive preview collection on minimum basket ₹5,000"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-900 text-white border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">
                    Discount Value {formDiscountType === "PERCENTAGE" ? "(%)" : "(₹)"}{" "}
                    <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    max={formDiscountType === "PERCENTAGE" ? "100" : undefined}
                    placeholder={formDiscountType === "PERCENTAGE" ? "25" : "1000"}
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 text-white font-mono font-bold border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Min Basket & Cap Protection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">
                    Min Order Basket ({storeConfig.currency.symbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 5000"
                    value={formMinOrderAmount}
                    onChange={(e) => setFormMinOrderAmount(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 text-white font-mono border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Prevents margin erosion
                  </span>
                </div>

                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">
                    Max Discount Cap ({storeConfig.currency.symbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    disabled={formDiscountType === "FIXED"}
                    placeholder="e.g. 3000"
                    value={formMaxDiscountAmount}
                    onChange={(e) => setFormMaxDiscountAmount(e.target.value)}
                    className={`w-full px-3.5 py-2 bg-slate-900 text-white font-mono border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none ${
                      formDiscountType === "FIXED" ? "opacity-40 cursor-not-allowed" : ""
                    }`}
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Caps maximum deduction
                  </span>
                </div>
              </div>

              {/* Date Bounds */}
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
                    End Date
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

              {/* Usage Quotas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">
                    Global Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 500"
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 text-white font-mono border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">
                    Per-User Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 1"
                    value={formPerUserLimit}
                    onChange={(e) => setFormPerUserLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 text-white font-mono border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="couponActiveCheckbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <label
                  htmlFor="couponActiveCheckbox"
                  className="text-slate-300 font-semibold cursor-pointer select-none"
                >
                  Activate coupon immediately for checkout validation
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingCoupon(null);
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
                    ? "Saving..."
                    : editingCoupon
                    ? "Update Coupon"
                    : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Usage History Drawer */}
      {viewingUsageCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-950 border-l border-slate-800 h-full max-w-xl w-full p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-300 text-base bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded">
                      {viewingUsageCoupon.code}
                    </span>
                    <span className="text-xs text-slate-400 uppercase font-semibold">
                      Redemption Log
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Audit trail of customer orders that claimed this discount voucher.
                  </p>
                </div>

                <button
                  onClick={() => setViewingUsageCoupon(null)}
                  className="text-slate-500 hover:text-white p-1 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Usage Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Uses</span>
                  <div className="text-lg font-bold text-white font-mono mt-0.5">
                    {viewingUsageCoupon.usedCount}
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Limit Quota</span>
                  <div className="text-lg font-bold text-white font-mono mt-0.5">
                    {viewingUsageCoupon.usageLimit || "∞"}
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Remaining</span>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                    {viewingUsageCoupon.remainingUses !== undefined
                      ? viewingUsageCoupon.remainingUses
                      : "—"}
                  </div>
                </div>
              </div>

              {/* Usage Logs List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Historical Order Invoices ({viewingUsageCoupon.usages?.length || 0})
                </h4>

                {!viewingUsageCoupon.usages || viewingUsageCoupon.usages.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/50 rounded-lg border border-slate-800/80">
                    <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs font-medium">
                      No customer redemptions recorded yet.
                    </p>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Orders using this coupon code will be recorded here with invoice references.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {viewingUsageCoupon.usages.map((usage) => (
                      <div
                        key={usage.id}
                        className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-amber-300">
                            {usage.order.orderNumber}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(usage.usedAt).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-300 pt-1">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span>{usage.user.name}</span>
                            <span className="text-slate-500 text-[11px]">({usage.user.email})</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-[11px]">
                          <span className="text-slate-400">
                            Order Basket:{" "}
                            <span className="font-mono text-white font-semibold">
                              {storeConfig.currency.symbol}
                              {Number(usage.order.totalAmount).toLocaleString()}
                            </span>
                          </span>
                          <span className="text-emerald-400 font-bold font-mono">
                            Discount Saved: -{storeConfig.currency.symbol}
                            {Number(usage.discountApplied).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 flex justify-end">
              <button
                onClick={() => setViewingUsageCoupon(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-lg cursor-pointer border border-slate-800"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Safe Deactivation / Delete Guard Modal */}
      {deletingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 p-6 sm:p-8 rounded-2xl max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">
                {deletingCoupon.usedCount > 0 ? "Safe Deactivation Guard" : "Delete Coupon"}
              </h3>
            </div>

            {deletingCoupon.usedCount > 0 ? (
              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 font-medium">
                  Notice: Coupon <span className="font-mono font-bold text-white">{deletingCoupon.code}</span> has{" "}
                  <span className="font-bold underline">{deletingCoupon.usedCount} historical order redemptions</span>.
                </div>
                <p>
                  To preserve historical invoice records, tax audits, and customer transaction receipts, this coupon will be{" "}
                  <strong className="text-white">soft-deactivated (isActive: false)</strong> instead of being permanently erased from the database.
                </p>
                <p className="text-slate-400 text-[11px]">
                  New shoppers will no longer be able to redeem this coupon at checkout.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                <p>
                  Are you sure you want to permanently delete coupon{" "}
                  <span className="font-mono font-bold text-amber-300">{deletingCoupon.code}</span>?
                </p>
                <p className="text-slate-400 text-[11px]">
                  This coupon has zero historical usages and will be completely removed from the catalog.
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingCoupon(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-lg cursor-pointer border border-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className={`px-4 py-2 font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer transition-colors ${
                  deletingCoupon.usedCount > 0
                    ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                    : "bg-rose-600 hover:bg-rose-500 text-white"
                }`}
              >
                {isSubmitting
                  ? "Processing..."
                  : deletingCoupon.usedCount > 0
                  ? "Deactivate Coupon"
                  : "Delete Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
