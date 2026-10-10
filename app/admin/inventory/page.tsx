"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Search,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  History,
  Download,
  X,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  Edit3,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Check,
  Package,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { AdminService } from "@/services/admin.service";
import {
  InventoryItem,
  InventorySummary,
  InventoryTransaction,
  InventoryTransactionType,
  InventoryAlertItem,
  AdminCategory,
  InventoryListQueryParams,
} from "@/types/admin.types";
import { exportInventoryCsv } from "@/utils/exportCsv";
import { useAuthStore } from "@/stores/auth.store";
import { rbac } from "@/lib/rbac";

export default function AdminInventoryPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary>({
    totalVariants: 0,
    totalStockUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "warning" | "error"; message: string } | null>(null);

  // Faceted Filtering & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortOption, setSortOption] = useState<"stock_asc" | "stock_desc" | "name_asc" | "sku_asc" | "newest">("stock_asc");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, totalPages: 1 });

  // Urgent Alerts Drawer State
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);
  const [urgentAlerts, setUrgentAlerts] = useState<InventoryAlertItem[]>([]);

  // Auditable Stock Adjustment Modal State
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItem | null>(null);
  const [adjustMode, setAdjustMode] = useState<"DELTA" | "NEW_STOCK">("DELTA");
  const [deltaValue, setDeltaValue] = useState<string>("10");
  const [newStockValue, setNewStockValue] = useState<string>("");
  const [adjustType, setAdjustType] = useState<InventoryTransactionType>("RESTOCK");
  const [reason, setReason] = useState<string>("");
  const [referenceId, setReferenceId] = useState<string>("");
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // Audit Ledger Drawer State
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [ledgerLogs, setLedgerLogs] = useState<InventoryTransaction[]>([]);
  const [ledgerFilterType, setLedgerFilterType] = useState<string>("ALL");
  const [ledgerSearch, setLedgerSearch] = useState<string>("");
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);

  // Safety Buffer Threshold Edit Modal State
  const [thresholdItem, setThresholdItem] = useState<InventoryItem | null>(null);
  const [newThreshold, setNewThreshold] = useState<string>("5");

  // Load Categories for Filter Dropdown
  useEffect(() => {
    AdminService.getCategories({ view: "flat" })
      .then((res) => {
        if (res.data) setCategories(res.data);
      })
      .catch((err) => console.warn("Error loading categories:", err));
  }, []);

  // Load Urgent Alerts
  const loadUrgentAlerts = () => {
    AdminService.getInventoryAlerts()
      .then((res) => {
        if (res.success && res.data) {
          setUrgentAlerts(res.data);
        }
      })
      .catch((err) => console.warn("Error loading alerts:", err));
  };

  useEffect(() => {
    loadUrgentAlerts();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const statusParam = params.get("status")?.toUpperCase();
      if (
        statusParam &&
        ["ALL", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"].includes(statusParam)
      ) {
        setStatusFilter(statusParam as any);
      }
    }
  }, []);

  // Load Inventory Table with Faceted Filters & Pagination
  const loadInventory = () => {
    setIsLoading(true);
    const queryParams: InventoryListQueryParams = {
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm.trim() || undefined,
      status: statusFilter,
      categoryId: selectedCategory !== "ALL" ? selectedCategory : undefined,
      sort: sortOption,
    };

    AdminService.getInventoryItems(queryParams)
      .then((res) => {
        if (res.success && res.data) {
          setItems(res.data);
          if (res.meta?.summary) {
            setSummary(res.meta.summary);
          }
          if (res.pagination) {
            setPaginationMeta({
              total: res.pagination.total,
              totalPages: res.pagination.totalPages,
            });
          }
        }
      })
      .catch((err) => {
        console.error("Error loading inventory:", err);
        setFeedback({ type: "error", message: "Failed to load inventory. Using local cache." });
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadInventory();
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, selectedCategory, sortOption]);

  // Load Transactions History
  const loadLedgerTransactions = () => {
    setIsLedgerLoading(true);
    AdminService.getInventoryTransactionsPaginated({ limit: 100 })
      .then((res) => {
        if (res.success && res.data) {
          setLedgerLogs(res.data);
        }
      })
      .catch((err) => console.warn("Error loading transactions:", err))
      .finally(() => setIsLedgerLoading(false));
  };

  const handleOpenLedger = (filterVariantId?: string) => {
    loadLedgerTransactions();
    if (filterVariantId) {
      setLedgerSearch(filterVariantId);
    } else {
      setLedgerSearch("");
    }
    setLedgerFilterType("ALL");
    setIsLedgerOpen(true);
  };

  // Open Adjust Modal
  const openAdjustModal = (item: InventoryItem, initialType: InventoryTransactionType = "RESTOCK") => {
    if (!rbac.canWriteInventory(user?.role)) {
      setFeedback({ type: "warning", message: "Permission required (inventory:write) to adjust stock levels." });
      setTimeout(() => setFeedback(null), 3500);
      return;
    }

    setSelectedItemForAdjust(item);
    setAdjustType(initialType);
    setAdjustMode("DELTA");
    setDeltaValue(initialType === "RESTOCK" ? "10" : initialType === "DAMAGE" ? "-1" : "5");
    setNewStockValue(String(item.stockQuantity + (initialType === "RESTOCK" ? 10 : 0)));
    setReason(
      initialType === "RESTOCK"
        ? "Received replenishment shipment from central atelier"
        : initialType === "DAMAGE"
        ? "Fitting room garment damage"
        : "Physical cycle count discrepancy audit"
    );
    setReferenceId("");
  };

  // Compute calculated target stock and delta dynamically
  const calculatedChange = useMemo(() => {
    if (!selectedItemForAdjust) return { current: 0, delta: 0, target: 0, isNegative: false };
    const current = selectedItemForAdjust.stockQuantity;

    if (adjustMode === "DELTA") {
      const delta = Number(deltaValue) || 0;
      const target = current + delta;
      return { current, delta, target, isNegative: target < 0 };
    } else {
      const target = Number(newStockValue) || 0;
      const delta = target - current;
      return { current, delta, target, isNegative: target < 0 };
    }
  }, [selectedItemForAdjust, adjustMode, deltaValue, newStockValue]);

  // Submit Stock Adjustment
  const handleConfirmAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAdjust) return;

    if (!reason.trim() || reason.trim().length < 3) {
      alert("Please provide a valid explanatory reason (minimum 3 characters).");
      return;
    }

    if (calculatedChange.isNegative) {
      alert(`Adjustment rejected: Stock cannot become negative (current: ${calculatedChange.current}, target: ${calculatedChange.target}).`);
      return;
    }

    setIsSubmittingAdjust(true);

    const payload = {
      variantId: selectedItemForAdjust.variantId || selectedItemForAdjust.id,
      productId: selectedItemForAdjust.productId,
      type: adjustType,
      reason: reason.trim(),
      referenceId: referenceId.trim() || undefined,
      ...(adjustMode === "DELTA"
        ? { delta: calculatedChange.delta }
        : { newStock: calculatedChange.target }),
    };

    try {
      const res = await AdminService.adjustStock(payload);
      if (res.success) {
        setFeedback({
          type: "success",
          message: res.message || `Stock successfully updated for ${selectedItemForAdjust.sku}`,
        });
        setSelectedItemForAdjust(null);
        loadInventory();
        loadUrgentAlerts();
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback({
          type: "error",
          message: res.message || "Failed to adjust stock",
        });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to adjust stock." });
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Quick Restock Shortcut (+10)
  const handleQuickRestock = async (item: InventoryItem, count: number = 10) => {
    if (!rbac.canWriteInventory(user?.role)) {
      setFeedback({ type: "warning", message: "Permission required (inventory:write) to adjust stock." });
      setTimeout(() => setFeedback(null), 3500);
      return;
    }

    try {
      const res = await AdminService.adjustStock({
        variantId: item.variantId || item.id,
        productId: item.productId,
        delta: count,
        type: "RESTOCK",
        reason: "One-click urgent replenishment",
        referenceId: `QUICK-RESTOCK-${Date.now().toString().slice(-4)}`,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          message: `Quick replenished +${count} units for SKU ${item.sku}.`,
        });
        loadInventory();
        loadUrgentAlerts();
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to restock." });
    }
  };

  // Submit Threshold Configuration
  const handleSaveThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thresholdItem) return;

    const parsedThreshold = Number(newThreshold);
    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      alert("Please enter a valid threshold number (>= 0).");
      return;
    }

    try {
      const res = await AdminService.updateInventoryThreshold({
        variantId: thresholdItem.variantId || thresholdItem.id,
        productId: thresholdItem.productId,
        lowStockThreshold: parsedThreshold,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          message: `Safety threshold updated to ${parsedThreshold} units for ${thresholdItem.sku}.`,
        });
        setThresholdItem(null);
        loadInventory();
        loadUrgentAlerts();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update threshold." });
    }
  };

  // Export Manifest
  const handleExportManifest = () => {
    exportInventoryCsv(items, storeConfig.name);
  };

  // Filtered Ledger Transactions in History Drawer
  const filteredLedgerLogs = useMemo(() => {
    return ledgerLogs.filter((t) => {
      if (ledgerFilterType !== "ALL" && t.type !== ledgerFilterType) return false;
      if (ledgerSearch.trim()) {
        const q = ledgerSearch.toLowerCase().trim();
        const matchesSku = t.variantSku?.toLowerCase().includes(q) || t.variant?.sku?.toLowerCase().includes(q);
        const matchesProduct = t.productName?.toLowerCase().includes(q) || t.product?.name?.toLowerCase().includes(q);
        const matchesReason = t.reason?.toLowerCase().includes(q);
        const matchesRef = t.referenceId?.toLowerCase().includes(q);
        return Boolean(matchesSku || matchesProduct || matchesReason || matchesRef);
      }
      return true;
    });
  }, [ledgerLogs, ledgerFilterType, ledgerSearch]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              MODULE 04 • INVENTORY LEDGER
            </span>
            <span className="text-slate-600 text-xs">•</span>
            <span className="text-xs text-slate-400 font-medium">Double-Entry Stock Accounting</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-amber-400" />
            <span>Inventory & Stock Ledger Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time variant tracking, automated negative stock prevention, immutable audit logs, and safety threshold alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Urgent Alerts Button */}
          <button
            onClick={() => setIsAlertsDrawerOpen(true)}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
              summary.lowStockCount > 0 || summary.outOfStockCount > 0
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Urgent Alerts ({urgentAlerts.length})</span>
          </button>

          {/* Audit Ledger History Button */}
          <button
            onClick={() => handleOpenLedger()}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs rounded-2xl transition-colors cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>Audit Ledger</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => {
              loadInventory();
              loadUrgentAlerts();
            }}
            disabled={isLoading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-2xl border border-slate-800 transition-colors cursor-pointer"
            title="Refresh Stock Table"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportManifest}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Notification Toast / Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-950/70 border-emerald-800/80 text-emerald-300"
              : feedback.type === "warning"
              ? "bg-amber-950/70 border-amber-800/80 text-amber-300"
              : "bg-rose-950/70 border-rose-800/80 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
            {feedback.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {feedback.type === "error" && <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Warehouse Summary Metric Cards (meta.summary) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total SKU Count */}
        <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total SKU Count</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{summary.totalVariants}</div>
          <div className="text-[11px] text-slate-500">Active garment variant curves</div>
        </div>

        {/* Card 2: Total Physical Units */}
        <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Physical Stock</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{summary.totalStockUnits.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500">Units in warehouse custody</div>
        </div>

        {/* Card 3: Low Stock Warnings */}
        <div
          onClick={() => {
            setStatusFilter("LOW_STOCK");
            setCurrentPage(1);
          }}
          className="bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-sm space-y-2 hover:border-amber-400/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-amber-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Low Stock Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{summary.lowStockCount}</div>
          <div className="text-[11px] text-amber-400/80">At or below safety buffer (&le;5)</div>
        </div>

        {/* Card 4: Out of Stock */}
        <div
          onClick={() => {
            setStatusFilter("OUT_OF_STOCK");
            setCurrentPage(1);
          }}
          className="bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-sm space-y-2 hover:border-rose-400/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-rose-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Out of Stock</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{summary.outOfStockCount}</div>
          <div className="text-[11px] text-rose-400/80">Immediate replenishment required</div>
        </div>
      </div>

      {/* 4. Faceted Search & Status Controls */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search across SKU, variant name, garment title, or brand..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-white text-xs font-medium focus:border-amber-400 focus:outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-3 text-slate-500 hover:text-white text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="w-full sm:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-white text-xs font-medium focus:border-amber-400 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.parentId ? `↳ ${cat.name}` : cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="w-full sm:w-56">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-white text-xs font-medium focus:border-amber-400 focus:outline-none cursor-pointer"
            >
              <option value="stock_asc">Sort: Stock (Low to High)</option>
              <option value="stock_desc">Sort: Stock (High to Low)</option>
              <option value="name_asc">Sort: Garment Title A-Z</option>
              <option value="sku_asc">Sort: SKU Code A-Z</option>
              <option value="newest">Sort: Recently Updated</option>
            </select>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-900 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
              Stock Status:
            </span>
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-amber-400 text-slate-950 font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              All Items ({summary.totalVariants})
            </button>
            <button
              onClick={() => {
                setStatusFilter("IN_STOCK");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "IN_STOCK"
                  ? "bg-emerald-500 text-white font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>In Stock (&gt;threshold)</span>
            </button>
            <button
              onClick={() => {
                setStatusFilter("LOW_STOCK");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "LOW_STOCK"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Low Stock ({summary.lowStockCount})</span>
            </button>
            <button
              onClick={() => {
                setStatusFilter("OUT_OF_STOCK");
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "OUT_OF_STOCK"
                  ? "bg-rose-500 text-white font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Out of Stock ({summary.outOfStockCount})</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            Total units represented: <span className="font-bold text-white font-mono">{summary.totalStockUnits}</span>
          </div>
        </div>
      </div>

      {/* 5. Flattened Inventory Monitoring Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-4 px-6">Variant SKU & Garment</th>
                <th className="py-4 px-6">Curve & Swatch</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Current Stock</th>
                <th className="py-4 px-6">Safety Threshold</th>
                <th className="py-4 px-6">Price</th>
                <th className="py-4 px-6 text-right">Ledger Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                      <span className="text-xs">Loading flattened warehouse inventory...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item) => {
                  const isOut = item.status === "OUT_OF_STOCK";
                  const isLow = item.status === "LOW_STOCK";

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-900/40 transition-colors ${
                        isOut ? "bg-rose-950/10" : isLow ? "bg-amber-950/10" : ""
                      }`}
                    >
                      {/* SKU & Garment */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={item.thumbnail || "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800"}
                            alt={item.productName}
                            className="w-11 h-13 object-cover rounded-xl border border-slate-800 bg-slate-900 shrink-0"
                          />
                          <div className="space-y-0.5">
                            <span className="font-mono text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded text-[10px] inline-block">
                              {item.sku}
                            </span>
                            <span className="font-bold text-white text-xs block line-clamp-1">
                              {item.productName}
                            </span>
                            <span className="text-[10px] text-slate-500">{item.brand}</span>
                          </div>
                        </div>
                      </td>

                      {/* Size & Swatch */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0"
                            style={{ backgroundColor: item.colorHex || "#0b1b3d" }}
                            title={item.color}
                          />
                          <div>
                            <span className="font-bold text-white text-[11px] block">{item.size}</span>
                            <span className="text-[10px] text-slate-400">{item.color}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-medium inline-block">
                          {item.category?.name || "Apparel"}
                        </span>
                      </td>

                      {/* Current Stock & Status Badge */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isOut ? "text-rose-400" : isLow ? "text-amber-400" : "text-emerald-400"
                            }`}
                          >
                            {item.stockQuantity} units
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold block w-fit border ${
                              isOut
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                : isLow
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            {isOut ? "OUT OF STOCK" : isLow ? "LOW STOCK" : "IN STOCK"}
                          </span>
                        </div>
                      </td>

                      {/* Safety Buffer Threshold (with inline click to edit) */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-300 text-xs">
                            {item.lowStockThreshold} units
                          </span>
                          {rbac.canWriteInventory(user?.role) && (
                            <button
                              onClick={() => {
                                setThresholdItem(item);
                                setNewThreshold(String(item.lowStockThreshold));
                              }}
                              className="p-1 text-slate-500 hover:text-amber-400 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                              title="Configure Safety Threshold"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Pricing */}
                      <td className="py-4 px-6">
                        <span className="font-medium text-white text-xs">
                          {storeConfig.currency.symbol}
                          {Number(item.salePrice || item.regularPrice).toLocaleString()}
                        </span>
                      </td>

                      {/* Ledger Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Restock (+10) */}
                          {rbac.canWriteInventory(user?.role) && (
                            <button
                              onClick={() => handleQuickRestock(item, 10)}
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 rounded-xl transition-colors cursor-pointer text-[10px] font-bold font-mono"
                              title="Quick Restock (+10)"
                            >
                              +10
                            </button>
                          )}

                          {/* Adjust Stock Button */}
                          {rbac.canWriteInventory(user?.role) && (
                            <button
                              onClick={() => openAdjustModal(item, "RESTOCK")}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                            >
                              Adjust
                            </button>
                          )}

                          {/* Audit History Shortcut */}
                          <button
                            onClick={() => handleOpenLedger(item.sku)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
                            title="Inspect SKU Ledger"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    <Package className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <span>No inventory records matching your query.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 6. Pagination Bar */}
        <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-slate-400 text-[11px]">
            Showing <span className="font-bold text-white">{items.length}</span> of{" "}
            <span className="font-bold text-white">{paginationMeta.total}</span> variant records
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <span>Rows:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-slate-300 font-mono text-[11px]">
                {currentPage} / {paginationMeta.totalPages}
              </span>
              <button
                disabled={currentPage >= paginationMeta.totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Auditable Stock Adjustment Modal (Relative Delta vs Physical Reconciliation) */}
      {selectedItemForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-400/10 border border-amber-400/20 rounded-xl">
                  <Layers className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Adjust Stock Level
                  </h3>
                  <span className="text-[11px] text-slate-500">Atomic Safety & Ledger Audit</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedItemForAdjust(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Garment Overview Banner */}
            <div className="flex items-center gap-3.5 p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800">
              <img
                src={selectedItemForAdjust.thumbnail || "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800"}
                alt={selectedItemForAdjust.productName}
                className="w-12 h-14 object-cover rounded-xl border border-slate-800 bg-slate-900 shrink-0"
              />
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-amber-400 font-bold text-[10px] bg-amber-400/10 px-1.5 py-0.5 rounded">
                    {selectedItemForAdjust.sku}
                  </span>
                  <span className="text-slate-400 text-xs font-bold">{selectedItemForAdjust.size}</span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-1">{selectedItemForAdjust.productName}</h4>
                <div className="text-[11px] text-slate-400">
                  Current In-Stock: <span className="text-white font-mono font-bold">{selectedItemForAdjust.stockQuantity} units</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmAdjustment} className="space-y-4 text-xs">
              {/* Toggle Input Mode: Relative (Delta) vs Physical Count Reconciliation (New Stock) */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-400 block text-[11px]">Adjustment Mode</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAdjustMode("DELTA")}
                    className={`py-2 rounded-xl font-bold transition-colors cursor-pointer text-xs ${
                      adjustMode === "DELTA"
                        ? "bg-amber-400 text-slate-950 shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Relative Change (&plusmn; Units)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustMode("NEW_STOCK")}
                    className={`py-2 rounded-xl font-bold transition-colors cursor-pointer text-xs ${
                      adjustMode === "NEW_STOCK"
                        ? "bg-amber-400 text-slate-950 shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Count Reconciliation (Target)
                  </button>
                </div>
              </div>

              {/* Mode Specific Inputs */}
              {adjustMode === "DELTA" ? (
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">
                    Quantity Delta (e.g. +15 or -3) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="+10 or -2"
                    value={deltaValue}
                    onChange={(e) => setDeltaValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono font-bold text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">
                    Absolute Target Stock (Physical Count) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="25"
                    value={newStockValue}
                    onChange={(e) => setNewStockValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono font-bold text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
              )}

              {/* Live Preview Calculation */}
              <div
                className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                  calculatedChange.isNegative
                    ? "bg-rose-950/60 border-rose-800 text-rose-300"
                    : "bg-slate-900/40 border-slate-800 text-slate-300"
                }`}
              >
                <span>Resulting Stock:</span>
                <div className="flex items-center gap-2 font-mono">
                  <span>{calculatedChange.current}</span>
                  <span>&rarr;</span>
                  <span className={`font-bold ${calculatedChange.isNegative ? "text-rose-400" : "text-emerald-400"}`}>
                    {calculatedChange.target} units
                  </span>
                  <span className="text-[11px] text-slate-500">
                    ({calculatedChange.delta > 0 ? `+${calculatedChange.delta}` : calculatedChange.delta})
                  </span>
                </div>
              </div>

              {/* Negative Stock Warning */}
              {calculatedChange.isNegative && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Negative stock protection: Resulting inventory cannot be negative.</span>
                </div>
              )}

              {/* Transaction Type */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Transaction Type *</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="RESTOCK">Inbound Supplier Shipment (RESTOCK)</option>
                  <option value="ADJUSTMENT">Physical Cycle Count Discrepancy (ADJUSTMENT)</option>
                  <option value="DAMAGE">Fitting Room / Warehouse Damage (DAMAGE)</option>
                  <option value="RETURN">Customer Store Return (RETURN)</option>
                  <option value="SALE">Direct Manual Sales Order (SALE)</option>
                </select>
              </div>

              {/* Mandatory Reason */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">
                  Mandatory Explanatory Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Received Autumn Batch replenishment from Milan warehouse"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Optional Reference ID (PO #, Receipt) */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">
                  Reference ID / Purchase Order # (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-2026-9812 or AUDIT-OCT-2026"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedItemForAdjust(null)}
                  className="px-4 py-2.5 text-slate-400 hover:text-white cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust || calculatedChange.isNegative}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmittingAdjust ? "Recording..." : "Record In Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Urgent Low-Stock & Stockout Alerts Drawer */}
      {isAlertsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-950 border-l border-slate-800 w-full max-w-xl h-full overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-400/10 border border-amber-400/20 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white uppercase tracking-wider">
                      Urgent Stock Alerts
                    </h2>
                    <span className="text-[11px] text-slate-500">
                      Items requiring supplier replenishment
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsAlertsDrawerOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {urgentAlerts.length > 0 ? (
                <div className="space-y-3">
                  {urgentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-400 font-bold text-[10px] bg-amber-400/10 px-1.5 py-0.5 rounded">
                            {alert.sku}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              alert.status === "OUT_OF_STOCK"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {alert.status === "OUT_OF_STOCK" ? "OUT OF STOCK" : "LOW STOCK"}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-xs text-white">
                          {alert.stockQuantity} / {alert.lowStockThreshold} units
                        </span>
                      </div>

                      <div className="text-xs font-bold text-white">{alert.productName}</div>
                      <div className="text-[11px] text-slate-400">{alert.variantName}</div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                        <button
                          onClick={() => {
                            const found = items.find((i) => i.id === alert.variantId || i.id === alert.id);
                            if (found) {
                              setIsAlertsDrawerOpen(false);
                              openAdjustModal(found, "RESTOCK");
                            }
                          }}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] uppercase rounded-xl transition-all cursor-pointer"
                        >
                          Restock Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-semibold">Warehouse inventory is fully replenished.</p>
                  <p className="text-[11px]">All items are above their safety stock threshold.</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsAlertsDrawerOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Close Alerts
            </button>
          </div>
        </div>
      )}

      {/* 9. Double-Entry Audit Ledger Drawer (Transaction History) */}
      {isLedgerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-950 border-l border-slate-800 w-full max-w-3xl h-full overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              {/* Ledger Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-400/10 border border-amber-400/20 rounded-xl">
                    <History className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white uppercase tracking-wider">
                      Immutable Inventory Audit Trail
                    </h2>
                    <span className="text-[11px] text-slate-500">
                      Double-entry warehouse balance ledger
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsLedgerOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Ledger Filters */}
              <div className="flex flex-col sm:flex-row gap-2.5 text-xs">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by SKU, product name, PO #, reason..."
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>

                <select
                  value={ledgerFilterType}
                  onChange={(e) => setLedgerFilterType(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs cursor-pointer"
                >
                  <option value="ALL">All Types</option>
                  <option value="RESTOCK">RESTOCK</option>
                  <option value="ADJUSTMENT">ADJUSTMENT</option>
                  <option value="DAMAGE">DAMAGE</option>
                  <option value="RETURN">RETURN</option>
                  <option value="SALE">SALE</option>
                </select>
              </div>

              {/* Ledger Transactions List */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-semibold">
                      <th className="py-2.5 px-4">Date / Time</th>
                      <th className="py-2.5 px-4">Garment & SKU</th>
                      <th className="py-2.5 px-4">Change</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Reason & Ref</th>
                      <th className="py-2.5 px-4 text-right">Authorized By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {isLedgerLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          Loading ledger transactions...
                        </td>
                      </tr>
                    ) : filteredLedgerLogs.length > 0 ? (
                      filteredLedgerLogs.map((tx) => {
                        const isPositive = (tx.quantityChange || tx.deltaQuantity || 0) > 0;
                        const changeVal = tx.quantityChange || tx.deltaQuantity || 0;

                        return (
                          <tr key={tx.id} className="hover:bg-slate-900/40">
                            <td className="py-3 px-4 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(tx.createdAt).toLocaleDateString()}{" "}
                              {new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-mono text-amber-400 font-bold text-[10px] block">
                                {tx.variantSku || tx.variant?.sku}
                              </span>
                              <span className="text-[11px] text-white line-clamp-1">
                                {tx.productName || tx.product?.name}
                              </span>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                  isPositive
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }`}
                              >
                                {isPositive ? `+${changeVal}` : changeVal}
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {tx.previousStock} &rarr; {tx.newStock}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-semibold">
                                {tx.type}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="text-[11px] text-slate-300 block line-clamp-2">
                                {tx.reason}
                              </span>
                              {tx.referenceId && (
                                <span className="font-mono text-[10px] text-amber-400/80 block mt-0.5">
                                  Ref: {tx.referenceId}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <span className="text-[11px] text-slate-300 font-semibold block">
                                {tx.createdBy?.name || tx.performedBy || "Admin"}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {tx.createdBy?.role || "SUPER_ADMIN"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          No audit ledger entries found matching filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={() => setIsLedgerOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Close Audit Trail
            </button>
          </div>
        </div>
      )}

      {/* 10. Safety Stock Threshold Edit Modal */}
      {thresholdItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Safety Stock Threshold
              </h3>
              <button
                onClick={() => setThresholdItem(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Set minimum alert buffer for <span className="text-white font-bold">{thresholdItem.sku}</span>:
            </p>

            <form onSubmit={handleSaveThreshold} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-400 block mb-1">
                  Threshold Count (Units) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono font-bold text-sm focus:border-amber-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Triggers LOW_STOCK warning when count drops &le; this threshold.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setThresholdItem(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase rounded-xl transition-all cursor-pointer"
                >
                  Save Threshold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
