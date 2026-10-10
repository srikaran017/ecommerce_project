"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  Download,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { AdminService } from "@/services/admin.service";
import { AdminDashboardOverview } from "@/types/admin.types";
import { exportOrdersCsv } from "@/utils/exportCsv";
import { useAuthStore } from "@/stores/auth.store";
import { rbac } from "@/lib/rbac";

export default function AdminOverviewPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<AdminDashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AdminService.getDashboardOverview()
      .then((res) => setData(res))
      .catch((err) => console.error("Dashboard overview fetch error:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleExportOrders = async () => {
    const orders = await AdminService.getOrders();
    exportOrdersCsv(orders, storeConfig.name);
  };

  const statCards = [
    {
      title: data?.metrics.totalRevenue.title || "Total Net Revenue",
      value: data?.metrics.totalRevenue.value || `${storeConfig.currency.symbol}0`,
      change: data?.metrics.totalRevenue.change || "Telemetry active",
      icon: DollarSign,
    },
    {
      title: data?.metrics.activeOrders.title || "Active Orders",
      value: data?.metrics.activeOrders.value || "0",
      change: data?.metrics.activeOrders.change || "0 awaiting dispatch",
      icon: ShoppingBag,
    },
    {
      title: data?.metrics.totalCustomers.title || "Registered VIP Clients",
      value: data?.metrics.totalCustomers.value || "1,240",
      change: data?.metrics.totalCustomers.change || "+34 new this week",
      icon: Users,
    },
    {
      title: data?.metrics.averageOrderValue.title || "Average Order Value",
      value: data?.metrics.averageOrderValue.value || `${storeConfig.currency.symbol}0`,
      change: data?.metrics.averageOrderValue.change || "+6.2% conversion rate",
      icon: TrendingUp,
    },
  ];

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
            <span className="text-xs text-slate-400">Zero-Cost Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Store Performance & Metrics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time multi-channel operations for {storeConfig.name}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {rbac.canExportOrders(user?.role) && (
            <button
              onClick={handleExportOrders}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-md transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Export Orders</span>
            </button>
          )}

          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-md transition-colors"
          >
            <span>Feature Flags</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-slate-950 border border-slate-800 p-6 rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {stat.title}
                </span>
                <Icon className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {isLoading ? "..." : stat.value}
              </div>
              <p className="text-[11px] text-emerald-400 font-medium">
                {stat.change}
              </p>
            </div>
          );
        })}
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
