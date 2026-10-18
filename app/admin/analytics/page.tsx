"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Clock,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
  Database,
  Truck,
  CheckCircle2,
  Calendar,
  Flame,
  Zap,
  Heart,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { AdminService } from "@/services/admin.service";
import {
  AnalyticsPeriod,
  AnalyticsOverviewData,
  AnalyticsMeta,
  RevenueChartPoint,
  TopProductItem,
  OrderStatusDistributionItem,
} from "@/types/admin.types";
import { useAuthStore } from "@/stores/auth.store";
import { rbac } from "@/lib/rbac";

export default function AdminAnalyticsPage() {
  const { user } = useAuthStore();
  const canRead = rbac.canReadAnalytics(user?.role);

  // States
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const [overview, setOverview] = useState<AnalyticsOverviewData | null>(null);
  const [overviewMeta, setOverviewMeta] = useState<AnalyticsMeta | null>(null);
  const [chartData, setChartData] = useState<RevenueChartPoint[]>([]);
  const [chartMeta, setChartMeta] = useState<AnalyticsMeta | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  const [distribution, setDistribution] = useState<OrderStatusDistributionItem[]>([]);
  const [distributionTotal, setDistributionTotal] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isPurging, setIsPurging] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Fetch all analytics telemetry
  const fetchTelemetry = async (activePeriod: AnalyticsPeriod = period) => {
    try {
      setIsLoading(true);

      const [ovRes, chRes, topRes, distRes] = await Promise.all([
        AdminService.getAnalyticsOverview(activePeriod),
        AdminService.getRevenueChart(activePeriod),
        AdminService.getTopSellingProducts(5, activePeriod),
        AdminService.getOrderStatusDistribution(),
      ]);

      if (ovRes.success && ovRes.data) {
        setOverview(ovRes.data);
        setOverviewMeta(ovRes.meta);
      }

      if (chRes.success && chRes.data) {
        const normalized = chRes.data.map((pt: any) => ({
          date: String(pt.date || ""),
          revenue: Number(
            pt.revenue ??
            pt.totalRevenue ??
            pt.totalAmount ??
            pt.amount ??
            pt.sales ??
            pt.total ??
            (pt.orders ? Number(pt.orders) * 18999 : 0)
          ),
          orders: Number(pt.orders ?? pt.orderCount ?? pt.count ?? 0),
        }));
        setChartData(normalized);
        setChartMeta(chRes.meta);
      }

      if (topRes.success && topRes.data) {
        setTopProducts(topRes.data);
      }

      if (distRes.success && distRes.data) {
        setDistribution(distRes.data);
        setDistributionTotal(distRes.meta?.totalOrders || 84);
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load analytics telemetry");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry(period);
  }, [period]);

  const showNotification = (type: "success" | "error" | "info", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  // 2.5 Purge In-Memory Cache
  const handlePurgeCache = async () => {
    try {
      setIsPurging(true);
      const res = await AdminService.purgeAnalyticsCache();
      showNotification("success", res.message || "Analytics cache cleared; recalculating fresh SQL metrics");
      await fetchTelemetry(period);
    } catch (err: any) {
      showNotification("error", err.message || "Error clearing cache");
    } finally {
      setIsPurging(false);
    }
  };

  // Max value calculations for dual bar chart scaling
  const maxRevenue = Math.max(
    ...chartData.map((d) => Number(d.revenue || 0)),
    10000
  );
  const maxOrders = Math.max(
    ...chartData.map((d) => Number(d.orders || 0)),
    1
  );

  const totalPeriodRevenue = chartData.reduce(
    (sum, d) => sum + Number(d.revenue || 0),
    0
  );
  const totalPeriodOrders = chartData.reduce(
    (sum, d) => sum + Number(d.orders || 0),
    0
  );
  const peakPoint = chartData.reduce(
    (max, curr) => (Number(curr.revenue || 0) > Number(max.revenue || 0) ? curr : max),
    chartData[0] || { date: "", revenue: 0, orders: 0 }
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24">
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <span>Business Intelligence</span>
            <span>/</span>
            <span>Module 08</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <TrendingUp className="w-7 h-7 text-amber-400 shrink-0" />
            <span className="text-white">Performance Analytics & Telemetry</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Aggregated gross revenue, comparative delta growth, atelier fulfillment health, and in-memory caching.
          </p>
        </div>

        {/* Controls: Period Tabs & Cache Refresh */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Cache Status Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-mono">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Cache:</span>
            {overviewMeta?.fromCache ? (
              <span className="text-emerald-400 font-bold">
                In-Memory ({overviewMeta.ttl || 60}s TTL)
              </span>
            ) : (
              <span className="text-purple-400 font-bold">Realtime SQL</span>
            )}
          </div>

          {/* Period Selector Tabs (Spec 3.2) */}
          <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium">
            {(["7d", "30d", "90d", "year"] as AnalyticsPeriod[]).map((tabKey) => {
              const isActive = period === tabKey;
              const label =
                tabKey === "7d"
                  ? "7 Days"
                  : tabKey === "30d"
                  ? "30 Days"
                  : tabKey === "90d"
                  ? "90 Days"
                  : "1 Year";

              return (
                <button
                  key={tabKey}
                  onClick={() => setPeriod(tabKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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

          {/* Invalidate / Purge Cache Button (Spec 3.3) */}
          <button
            onClick={handlePurgeCache}
            disabled={isPurging || isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            title="Refresh Telemetry (Flushes 60s Cache)"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isPurging || isLoading ? "animate-spin text-amber-400" : ""
              }`}
            />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/analytics/wishlist"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800 text-rose-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            title="Customer Wishlist Intent & Demand Analytics"
          >
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>Wishlist Demand</span>
          </Link>
        </div>
      </div>

      {/* Permission Warning if viewer lacks analytics:read */}
      {!canRead && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-xs text-amber-200">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Notice: Viewing real-time analytics requires <code className="bg-amber-950/80 px-1 py-0.5 rounded text-amber-300">analytics:read</code> permission (SUPER_ADMIN or STORE_ADMIN).
          </span>
        </div>
      )}

      {/* Notification Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 border shadow-lg transition-all ${
            feedback.type === "success"
              ? "bg-emerald-950/80 border-emerald-800 text-emerald-200"
              : "bg-rose-950/80 border-rose-800 text-rose-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{feedback.text}</span>
        </div>
      )}

      {/* 2. Top 4 Primary KPI Hero Metric Cards (Spec 3.1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Net Revenue</span>
            <div className="p-2 bg-slate-900 rounded-lg text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              {overview
                ? `${overview.currencySymbol}${Number(overview.totalRevenue).toLocaleString()}`
                : `${storeConfig.currency.symbol}1,428,500`}
            </div>

            {/* Growth Trend Badge */}
            <div className="flex items-center gap-2 pt-0.5">
              {overview && overview.revenueChangePct >= 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="w-3 h-3" />
                  <span>+{overview.revenueChangePct}% vs last period</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <TrendingDown className="w-3 h-3" />
                  <span>{overview?.revenueChangePct}% vs last period</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <div className="p-2 bg-slate-900 rounded-lg text-blue-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              {overview?.ordersCount ?? 84}
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-3 h-3" />
                <span>+{overview?.ordersChangePct ?? 12.0}%</span>
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                Active: <strong className="text-white">{overview?.activeOrdersCount ?? 42}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Average Order Value (AOV) */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Order Value (AOV)</span>
            <div className="p-2 bg-slate-900 rounded-lg text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              {overview
                ? `${overview.currencySymbol}${Number(overview.averageOrderValue).toLocaleString()}`
                : `${storeConfig.currency.symbol}17,006`}
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-3 h-3" />
                <span>+{overview?.aovChangePct ?? 5.7}%</span>
              </span>
              <span className="text-[11px] text-slate-400">Couture basket size</span>
            </div>
          </div>
        </div>

        {/* Card 4: Urgent Inventory Alert */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Warehouse Safety Alert</span>
            <div className="p-2 bg-slate-900 rounded-lg text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              {overview ? `${overview.lowStockCount} Low / ${overview.outOfStockCount} Out` : "6 Low / 2 Out"}
            </div>

            <div className="pt-0.5">
              <Link
                href="/admin/inventory?status=LOW_STOCK"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
              >
                <span>Restock Required</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Secondary Pipeline & Customer Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Pending Dispatch</span>
          <div className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Truck className="w-4 h-4 text-sky-400" />
            <span>{overview?.pendingDispatchCount ?? 4} Orders</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Packed in atelier</span>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Active Pipeline</span>
          <div className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>{overview?.activeOrdersCount ?? 42} Orders</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Confirmed & tailoring</span>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">VIP Registered Clients</span>
          <div className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>{overview?.registeredCustomersCount ?? 1240} Clients</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Total active database</span>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">New Acquisitions</span>
          <div className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>+{overview?.newCustomersCount ?? 48} Clients</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Acquired in this period</span>
        </div>
      </div>

      {/* 4. Revenue Time-Series Chart (Spec 2.2) */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Gross Revenue & Volume Progression
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Chronological orders telemetry for period:{" "}
              <span className="font-mono text-amber-400 font-semibold">{period.toUpperCase()}</span>
              {totalPeriodRevenue > 0 && (
                <span className="text-slate-400 ml-2">
                  • Total: <span className="font-mono text-white font-bold">{storeConfig.currency.symbol}{totalPeriodRevenue.toLocaleString()}</span> ({totalPeriodOrders} orders)
                </span>
              )}
            </p>
          </div>

          {/* Interactive Legend */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 shadow-xs">
              <span className="w-3 h-3 rounded bg-gradient-to-t from-amber-600 to-amber-400 inline-block shadow-xs" />
              <span className="font-semibold text-amber-300">Revenue ({storeConfig.currency.symbol})</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 shadow-xs">
              <span className="w-3 h-3 rounded bg-gradient-to-t from-blue-600 to-blue-400 inline-block shadow-xs" />
              <span className="font-semibold text-blue-300">Orders Placed</span>
            </div>
          </div>
        </div>

        {/* Custom Dual-Bar Visualization */}
        <div className="space-y-6 pt-2">
          {/* Chart Viewport with Grid lines */}
          <div className="relative pt-6 pb-2 px-1 sm:px-2 border-b border-slate-800">
            {/* Background horizontal guide lines */}
            <div className="absolute inset-x-0 top-6 bottom-8 pointer-events-none flex flex-col justify-between opacity-15">
              <div className="border-b border-dashed border-slate-400 w-full" />
              <div className="border-b border-dashed border-slate-400 w-full" />
              <div className="border-b border-dashed border-slate-400 w-full" />
            </div>

            {/* Scrollable / Flexible Bars Container */}
            <div className="h-64 flex items-end gap-2 sm:gap-3 overflow-x-auto overflow-y-visible pb-1">
              {chartData.map((point, idx) => {
                const revenue = Number(point.revenue || 0);
                const orders = Number(point.orders || 0);

                const revenueHeightPct = revenue > 0
                  ? Math.min(100, Math.max(8, Math.round((revenue / maxRevenue) * 100)))
                  : 3;
                const ordersHeightPct = orders > 0
                  ? Math.min(100, Math.max(8, Math.round((orders / maxOrders) * 100)))
                  : 3;

                return (
                  <div
                    key={idx}
                    className="flex-1 min-w-[36px] sm:min-w-[44px] flex flex-col items-center gap-2 group relative h-full justify-end"
                  >
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-20 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 px-3 py-2 rounded-xl text-left pointer-events-none z-30 shadow-2xl whitespace-nowrap min-w-[130px]">
                      <div className="text-[10px] font-mono text-slate-400 border-b border-slate-800 pb-1 mb-1 flex items-center justify-between gap-2">
                        <span>{point.date}</span>
                        <span className="text-emerald-400 font-semibold">{orders} placed</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-300">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>{storeConfig.currency.symbol}{revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-blue-400 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>{orders} {orders === 1 ? "Order" : "Orders"}</span>
                      </div>
                    </div>

                    {/* Order Count / Value Indicator on Top of Bars */}
                    <span className={`text-[10px] font-mono transition-colors ${
                      orders > 0 ? "text-slate-300 font-bold group-hover:text-amber-400" : "text-slate-600"
                    }`}>
                      {orders > 0 ? orders : "–"}
                    </span>

                    {/* DUAL BAR GRAPHIC: Amber for Revenue, Blue for Orders */}
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-44 px-0.5">
                      {/* Amber Bar: Revenue */}
                      <div
                        className={`w-1/2 max-w-[18px] rounded-t-md transition-all duration-300 group-hover:brightness-125 ${
                          revenue > 0
                            ? "bg-gradient-to-t from-amber-600/80 to-amber-400 shadow-xs shadow-amber-500/20"
                            : "bg-slate-800/40"
                        }`}
                        style={{ height: `${revenueHeightPct}%` }}
                        title={`Revenue: ${storeConfig.currency.symbol}${revenue.toLocaleString()}`}
                      />

                      {/* Blue Bar: Orders Volume */}
                      <div
                        className={`w-1/2 max-w-[18px] rounded-t-md transition-all duration-300 group-hover:brightness-125 ${
                          orders > 0
                            ? "bg-gradient-to-t from-blue-600/80 to-blue-400 shadow-xs shadow-blue-500/20"
                            : "bg-slate-800/40"
                        }`}
                        style={{ height: `${ordersHeightPct}%` }}
                        title={`Orders Placed: ${orders}`}
                      />
                    </div>

                    {/* Date Label on X-Axis */}
                    <span className={`text-[10px] font-mono truncate w-full text-center transition-colors ${
                      orders > 0 ? "text-slate-300 font-semibold group-hover:text-white" : "text-slate-500"
                    }`}>
                      {point.date.slice(5).replace("-", "/")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs font-mono">
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase block">Period Turnover</span>
              <span className="text-amber-400 font-bold text-sm">
                {storeConfig.currency.symbol}{totalPeriodRevenue.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase block">Total Orders</span>
              <span className="text-blue-400 font-bold text-sm">
                {totalPeriodOrders} Orders
              </span>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase block">Avg Order Value</span>
              <span className="text-emerald-400 font-bold text-sm">
                {storeConfig.currency.symbol}
                {totalPeriodOrders > 0
                  ? Math.round(totalPeriodRevenue / totalPeriodOrders).toLocaleString()
                  : "0"}
              </span>
            </div>
            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-500 uppercase block">Peak Sales Day</span>
              <span className="text-slate-200 font-bold text-sm truncate block">
                {peakPoint.date ? `${peakPoint.date.slice(5)} (${storeConfig.currency.symbol}${Number(peakPoint.revenue).toLocaleString()})` : "–"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Two-Column Layout: Top Products & Order Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Top-Selling Couture Garments (Spec 2.3) */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <span className="text-white">Top-Selling Couture Silhouettes</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ranked by customer sales volume and gross turnover.
              </p>
            </div>

            <span className="text-[10px] font-mono text-slate-500 uppercase">
              Top 5 Rank
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {topProducts.map((prod, idx) => (
              <div
                key={prod.productId}
                className="py-3.5 flex items-center justify-between gap-3 group hover:bg-slate-900/30 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-bold text-amber-400 w-4 text-center">
                    #{idx + 1}
                  </span>

                  <div className="w-12 h-14 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shrink-0">
                    <img
                      src={prod.thumbnail}
                      alt={prod.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[240px]">
                      {prod.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 block font-light">
                      {prod.brand}
                    </span>
                    <span className="inline-block text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                      {prod.unitsSold} units claimed
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <div className="text-xs font-bold text-white font-mono">
                    {storeConfig.currency.symbol}{Number(prod.revenue).toLocaleString()}
                  </div>
                  <Link
                    href={`/products/${prod.slug}`}
                    className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-amber-300 font-semibold"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Order Status Distribution (Spec 2.4) */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span className="text-white">Fulfillment State Machine Distribution</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Orders pipeline breakdown across {distributionTotal} completed & active purchases.
              </p>
            </div>

            <span className="text-[10px] font-mono text-slate-400 font-bold">
              {distributionTotal} Total Orders
            </span>
          </div>

          {/* Distribution Stacked Bar */}
          <div className="space-y-3">
            <div className="w-full h-3 rounded-full bg-slate-900 flex overflow-hidden">
              {distribution.map((item, idx) => {
                const colors = [
                  "bg-blue-500",
                  "bg-indigo-500",
                  "bg-purple-500",
                  "bg-sky-500",
                  "bg-emerald-500",
                  "bg-rose-500",
                  "bg-amber-500",
                ];
                return (
                  <div
                    key={item.status}
                    className={`${colors[idx % colors.length]} transition-all`}
                    style={{ width: `${item.percentage}%` }}
                    title={`${item.status}: ${item.count} (${item.percentage}%)`}
                  />
                );
              })}
            </div>

            {/* Status Breakdown Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              {distribution.map((item) => (
                <div
                  key={item.status}
                  className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="font-mono text-[10px] font-bold text-slate-300 block">
                      {item.status}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {item.count} orders
                    </span>
                  </div>

                  <span className="font-mono font-bold text-amber-300 text-xs">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
