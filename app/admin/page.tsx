import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { featureConfig } from "@/config/feature.config";

export default function AdminOverviewPage() {
  const stats = [
    {
      title: "Total Net Revenue",
      value: `${storeConfig.currency.symbol}1,248,500`,
      change: "+18.4% vs last month",
      icon: DollarSign,
    },
    {
      title: "Active Orders",
      value: "42",
      change: "8 pending dispatch",
      icon: ShoppingBag,
    },
    {
      title: "Registered VIP Clients",
      value: "1,240",
      change: "+34 new this week",
      icon: Users,
    },
    {
      title: "Average Order Value",
      value: `${storeConfig.currency.symbol}12,450`,
      change: "+6.2% conversion rate",
      icon: TrendingUp,
    },
  ];

  const recentOrders = [
    { id: "ORD-98231", customer: "Aarav Sharma", total: "₹18,999", status: "CONFIRMED", date: "Today, 2:15 PM" },
    { id: "ORD-98230", customer: "Priya Sengupta", total: "₹28,999", status: "SHIPPED", date: "Today, 11:40 AM" },
    { id: "ORD-98229", customer: "Rohan Varma", total: "₹4,999", status: "DELIVERED", date: "Yesterday" },
    { id: "ORD-98228", customer: "Meera Kapoor", total: "₹24,999", status: "PROCESSING", date: "Yesterday" },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Store Performance & Metrics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time telemetry and management for {storeConfig.name}.
          </p>
        </div>

        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-md transition-colors"
        >
          <span>Feature Flags Engine</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
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
                {stat.value}
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
              View All
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
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-900/50">
                    <td className="py-3 font-mono font-semibold text-white">{order.id}</td>
                    <td className="py-3">{order.customer}</td>
                    <td className="py-3 font-bold text-white">{order.total}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alert Box (4 cols) */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 border-b border-slate-800 pb-4">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Inventory Alerts
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1">
              <div className="flex justify-between font-bold text-white">
                <span>Banarasi Silk Saree</span>
                <span className="text-red-400">12 left</span>
              </div>
              <p className="text-[11px] text-slate-400">SKU: BN-SAR-003 • Low safety threshold</p>
            </div>

            <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1">
              <div className="flex justify-between font-bold text-white">
                <span>Italian Wool Blazer (38R)</span>
                <span className="text-amber-400">5 left</span>
              </div>
              <p className="text-[11px] text-slate-400">SKU: DB-BLZ-004-38-CS</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
