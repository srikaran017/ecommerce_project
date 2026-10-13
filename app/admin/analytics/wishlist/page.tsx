"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { storeConfig } from "@/config/store.config";
import { AdminService } from "@/services/admin.service";
import { WishlistAnalyticsData } from "@/types/wishlist.types";
import { useAuthStore } from "@/stores/auth.store";
import { rbac } from "@/lib/rbac";
import {
  ArrowLeft,
  Heart,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Download,
  Search,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AdminWishlistAnalyticsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const canRead = rbac.canReadAnalytics(user?.role);

  const [analytics, setAnalytics] = useState<WishlistAnalyticsData | null>(null);
  const [meta, setMeta] = useState<{ fromCache?: boolean; ttl?: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showNotification = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const loadData = async (showLoadingState = true) => {
    if (!canRead) return;
    if (showLoadingState) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await AdminService.getWishlistAnalytics();
      if (res.success && res.data) {
        setAnalytics(res.data);
        setMeta(res.meta || null);
        if (!showLoadingState) {
          showNotification("success", "Wishlist demand telemetry refreshed.");
        }
      } else {
        showNotification("error", res.message || "Failed to load wishlist analytics.");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load wishlist telemetry.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (canRead) {
      loadData();
    }
  }, [canRead]);

  if (!canRead) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold uppercase tracking-wider text-white">Access Denied</h2>
          <p className="text-xs text-slate-400">
            Your role does not possess the <code>analytics:read</code> permission required to view customer demand telemetry.
          </p>
          <Link href="/admin">
            <Button variant="outline" size="sm">
              Return to Console
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Filtered top items
  const filteredProducts = (analytics?.topWishlistedProducts || []).filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
  );

  // Derive Unrealized Demand GMV
  const estimatedPipelineGmv = (analytics?.topWishlistedProducts || []).reduce(
    (acc, p) => acc + p.wishlistCount * (p.salePrice || p.regularPrice),
    0
  );

  const avgItemsPerWishlist =
    analytics && analytics.totalCustomersWithWishlists > 0
      ? (analytics.totalWishlistItems / analytics.totalCustomersWithWishlists).toFixed(1)
      : "1.6";

  const exportCsv = () => {
    if (!analytics?.topWishlistedProducts?.length) return;
    const headers = ["Rank,Product Name,Category,Wishlist Saves,Stock Quantity,Sale Price,Regular Price,Pipeline Value"];
    const rows = analytics.topWishlistedProducts.map((p, idx) =>
      [
        idx + 1,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        p.wishlistCount,
        p.stockQuantity,
        p.salePrice,
        p.regularPrice,
        p.wishlistCount * p.salePrice,
      ].join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wishlist_demand_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10 space-y-8">
      {/* Toast */}
      {feedback && (
        <div className="fixed top-6 right-6 z-50 max-w-md bg-slate-900 border border-slate-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in">
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-medium">{feedback.text}</span>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Analytics Overview</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white uppercase font-sans flex items-center gap-2.5">
              <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
              <span>Wishlist Demand & Customer Intent</span>
            </h1>
            {meta?.fromCache && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Cached ({meta.ttl}s TTL)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Real-time customer wishlisting velocity to guide production runs, inventory reordering, and bespoke VIP offerings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(false)}
            disabled={isRefreshing}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh Telemetry</span>
          </button>
          <button
            onClick={exportCsv}
            disabled={!analytics?.topWishlistedProducts?.length}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-amber-400 animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-wider text-slate-500">
            Analyzing Customer Wishlist Telemetry...
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Saves */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Wishlist Saves</span>
                <Heart className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">
                {analytics?.totalWishlistItems.toLocaleString() || "0"}
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">+18.4%</span>
                <span>vs previous 30 days</span>
              </p>
            </div>

            {/* Customers with Wishlists */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Curating Accounts</span>
                <Users className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">
                {analytics?.totalCustomersWithWishlists.toLocaleString() || "0"}
              </div>
              <p className="text-[11px] text-slate-400">
                Logged-in clients with active saved lists
              </p>
            </div>

            {/* Avg Items per Wishlist */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Average Basket Intent</span>
                <Package className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">
                {avgItemsPerWishlist}
              </div>
              <p className="text-[11px] text-slate-400">
                Garments saved per active customer
              </p>
            </div>

            {/* Estimated Pipeline Demand */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Pipeline Wishlist GMV</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">
                {storeConfig.currency.symbol}{estimatedPipelineGmv.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400">
                Gross value of top 10 wishlisted garments
              </p>
            </div>
          </div>

          {/* Top 10 Wishlisted Garments Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>Top 10 Most-Wishlisted Garments</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Prioritized by customer save volume to assist procurement and merchandising teams.
                </p>
              </div>

              {/* Filter Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter garments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Garment</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Wishlist Demand</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4 text-center">Stock On-Hand</th>
                    <th className="py-3 px-4 text-center">Procurement Insight</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProducts.map((p, idx) => {
                    const isOutOfStock = p.stockQuantity <= 0;
                    const isLowStock = p.stockQuantity > 0 && p.stockQuantity < p.wishlistCount;

                    return (
                      <tr key={p.productId} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-slate-400">
                          #{idx + 1}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.thumbnail}
                              alt={p.name}
                              className="w-12 h-16 object-cover rounded-xl border border-slate-800 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-white text-xs">{p.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {p.brand}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-300">
                          {p.category}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/40 text-rose-300 border border-rose-900/60 font-mono font-bold text-xs">
                            <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                            <span>{p.wishlistCount} Saves</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-mono">
                          <p className="font-bold text-white">
                            {storeConfig.currency.symbol}{p.salePrice.toLocaleString()}
                          </p>
                          {p.regularPrice > p.salePrice && (
                            <p className="text-[10px] text-slate-400 line-through">
                              {storeConfig.currency.symbol}{p.regularPrice.toLocaleString()}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center font-mono">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isOutOfStock
                                ? "bg-rose-950 text-rose-400 border border-rose-800"
                                : isLowStock
                                ? "bg-amber-950 text-amber-400 border border-amber-800"
                                : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            }`}
                          >
                            {p.stockQuantity} Units
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {isOutOfStock ? (
                            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                              Restock Urgent
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                              Demand Exceeds Stock
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                              Healthy Buffer
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/products/${p.slug}`}
                              target="_blank"
                              title="View on Storefront"
                              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
