"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  Download,
  Package,
  Layers,
  Sparkles,
  RefreshCw,
  BarChart3,
  Zap,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { AdminService } from "@/services/admin.service";
import {
  AdminDashboardOverview,
  AnalyticsPeriod,
  AnalyticsOverviewData,
  AnalyticsMeta,
} from "@/types/admin.types";
import { exportOrdersCsv } from "@/utils/exportCsv";
import { useAuthStore } from "@/stores/auth.store";
import { rbac } from "@/lib/rbac";

export default function AdminOverviewPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<AdminDashboardOverview | null>(null);
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const [analytics, setAnalytics] = useState<AnalyticsOverviewData | null>(null);
  const [analyticsMeta, setAnalyticsMeta] = useState<AnalyticsMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (activePeriod: AnalyticsPeriod = period) => {
    try {
      setIsLoading(true);
      const [overviewRes, analyticsRes] = await Promise.all([
        AdminService.getDashboardOverview(),
        AdminService.getAnalyticsOverview(activePeriod),
      ]);
      setData(overviewRes);
      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
        setAnalyticsMeta(analyticsRes.meta);
      }
    } catch (err) {
      console.error("Dashboard overview fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(period);
  }, [period]);

  const handleRefreshTelemetry = async () => {
    try {
      setIsRefreshing(true);
      await AdminService.purgeAnalyticsCache();
      await loadData(period);
    } catch (err) {
      console.error("Failed to purge telemetry cache:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportOrders = async () => {
    const orders = await AdminService.getOrders();
    exportOrdersCsv(orders, storeConfig.name);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              {user?.role || "ADMIN"} CONSOLE
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              {analyticsMeta?.fromCache ? "In-Memory Telemetry (60s TTL)" : "Live SQL Telemetry"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Store Performance & Metrics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time multi-channel operations for {storeConfig.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector Tabs (Spec 3.2) */}
          <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium">
            {(["7d", "30d", "90d", "year"] as AnalyticsPeriod[]).map((tabKey) => {
              const isActive = period === tabKey;
              const label =
                tabKey === "7d"
                  ? "7D"
                  : tabKey === "30d"
                  ? "30D"
                  : tabKey === "90d"
                  ? "90D"
                  : "1Y";

              return (
                <button
                  key={tabKey}
                  onClick={() => setPeriod(tabKey)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Refresh / Purge Telemetry (Spec 3.3) */}
          <button
            onClick={handleRefreshTelemetry}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs rounded-md transition-colors cursor-pointer"
            title="Refresh Telemetry (Flushes 60s Cache)"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isRefreshing || isLoading ? "animate-spin text-amber-400" : ""
              }`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {rbac.canExportOrders(user?.role) && (
            <button
              onClick={handleExportOrders}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-md transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Export</span>
            </button>
          )}

          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-md transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Deep Analytics</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid - Module 08 Spec 3.1 Hero Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Revenue */}
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Revenue
            </span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {isLoading
              ? "..."
              : analytics
              ? `${analytics.currencySymbol}${Number(analytics.totalRevenue).toLocaleString()}`
              : `${storeConfig.currency.symbol}0`}
          </div>
          <div className="flex items-center gap-2">
            {analytics && analytics.revenueChangePct >= 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-3 h-3" />
                <span>+{analytics.revenueChangePct}% vs last period</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <TrendingDown className="w-3 h-3" />
                <span>{analytics?.revenueChangePct}% vs last period</span>
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Orders
            </span>
            <ShoppingBag className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {isLoading ? "..." : analytics?.ordersCount ?? data?.metrics.activeOrders.value ?? "0"}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              <span>+{analytics?.ordersChangePct ?? 12}%</span>
            </span>
            <span className="text-slate-400">
              Active Pipeline: <strong className="text-white">{analytics?.activeOrdersCount ?? 42}</strong>
            </span>
          </div>
        </div>

        {/* Card 3: Average Order Value (AOV) */}
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Average Order Value (AOV)
            </span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {isLoading
              ? "..."
              : analytics
              ? `${analytics.currencySymbol}${Number(analytics.averageOrderValue).toLocaleString()}`
              : `${storeConfig.currency.symbol}0`}
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              <span>+{analytics?.aovChangePct ?? 5.7}%</span>
            </span>
            <span className="text-[11px] text-slate-400">vs prior period</span>
          </div>
        </div>

        {/* Card 4: Urgent Inventory Alert */}
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Urgent Inventory Alert
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {isLoading
              ? "..."
              : analytics
              ? `${analytics.lowStockCount} Low / ${analytics.outOfStockCount} Out`
              : "6 Low / 2 Out"}
          </div>
          <div>
            <Link
              href="/admin/inventory?status=LOW_STOCK"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
            >
              <span>Manage Low Stock</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders & Quick Inventory Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Orders Table (8 cols) */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Recent Customer Orders
            </h3>
            <Link href="/admin/orders" className="text-xs text-amber-400 hover:underline">
              View All Orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="pb-3 font-semibold">Order ID</th>
                  <th className="pb-3 font-semibold">Client</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {data?.recentOrders && data.recentOrders.length > 0 ? (
                  data.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-900/50">
                      <td className="py-3 font-mono font-semibold text-white">
                        <Link href={`/admin/orders`} className="hover:text-amber-400">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3">{order.customerName}</td>
                      <td className="py-3 font-bold text-white">
                        {storeConfig.currency.symbol}
                        {order.total.toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            order.status === "DELIVERED"
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                              : order.status === "SHIPPED"
                              ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                              : order.status === "CONFIRMED"
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{order.createdAt}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No customer orders recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alert Box (4 cols) */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Inventory Alerts
              </h3>
            </div>
            <Link href="/admin/inventory" className="text-xs text-amber-400 hover:underline">
              Manage →
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            {data?.inventoryAlerts && data.inventoryAlerts.length > 0 ? (
              data.inventoryAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1"
                >
                  <div className="flex justify-between font-bold text-white">
                    <span className="truncate pr-2">{alert.productName}</span>
                    <span
                      className={
                        alert.stock === 0 ? "text-rose-400 font-mono" : "text-amber-400 font-mono"
                      }
                    >
                      {alert.stock === 0 ? "0 left" : `${alert.stock} left`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    SKU: {alert.variantSku} ({alert.size}, {alert.colorName})
                  </p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500 text-xs">
                All garments in healthy stock threshold.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
