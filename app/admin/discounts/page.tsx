"use client";

import React, { useState } from "react";
import { Tag, Plus, Trash2, Edit, CheckCircle2, Percent, DollarSign, Calendar } from "lucide-react";
import { storeConfig } from "@/config/store.config";

interface DiscountRule {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrder: number;
  maxDiscount?: number;
  usageCount: number;
  usageLimit: number;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRED";
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountRule[]>([
    {
      id: "disc_1",
      code: "LUXE10",
      type: "PERCENTAGE",
      value: 10,
      minOrder: 3000,
      maxDiscount: 2500,
      usageCount: 84,
      usageLimit: 500,
      expiresAt: "2026-12-31",
      status: "ACTIVE",
    },
    {
      id: "disc_2",
      code: "WELCOME1000",
      type: "FIXED",
      value: 1000,
      minOrder: 5000,
      usageCount: 142,
      usageLimit: 1000,
      expiresAt: "2026-12-31",
      status: "ACTIVE",
    },
    {
      id: "disc_3",
      code: "FESTIVE20",
      type: "PERCENTAGE",
      value: 20,
      minOrder: 10000,
      maxDiscount: 5000,
      usageCount: 50,
      usageLimit: 50,
      expiresAt: "2026-01-01",
      status: "EXPIRED",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState("15");
  const [minOrder, setMinOrder] = useState("3500");
  const [expiresAt, setExpiresAt] = useState("2026-12-31");

  const handleCreateDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const newDisc: DiscountRule = {
      id: `disc_${Date.now()}`,
      code: code.trim().toUpperCase(),
      type,
      value: Number(value),
      minOrder: Number(minOrder),
      usageCount: 0,
      usageLimit: 500,
      expiresAt,
      status: "ACTIVE",
    };

    setDiscounts([newDisc, ...discounts]);
    setCode("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Tag className="w-6 h-6 text-amber-400" />
            <span>Discount Codes & Promotional Rules</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure automated cart discounts, percentage off coupons, and VIP client promotions.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-md transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                <th className="py-3.5 px-6 font-semibold">Promo Code</th>
                <th className="py-3.5 px-6 font-semibold">Discount Type</th>
                <th className="py-3.5 px-6 font-semibold">Savings Value</th>
                <th className="py-3.5 px-6 font-semibold">Min Order Requirement</th>
                <th className="py-3.5 px-6 font-semibold">Usage Summary</th>
                <th className="py-3.5 px-6 font-semibold">Status</th>
                <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {discounts.map((disc) => (
                <tr key={disc.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-amber-300 text-sm">
                    {disc.code}
                  </td>
                  <td className="py-4 px-6 font-semibold uppercase">
                    {disc.type}
                  </td>
                  <td className="py-4 px-6 font-bold text-white">
                    {disc.type === "PERCENTAGE" ? `${disc.value}% OFF` : `${storeConfig.currency.symbol}${disc.value} FLAT`}
                  </td>
                  <td className="py-4 px-6">
                    Orders over {storeConfig.currency.symbol}{disc.minOrder.toLocaleString()}
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-mono text-slate-300">
                      {disc.usageCount} / {disc.usageLimit} uses
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        disc.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {disc.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 p-6 sm:p-8 rounded-lg max-w-md w-full space-y-4">
            <h3 className="text-base font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-3">
              Create Promotional Coupon
            </h3>

            <form onSubmit={handleCreateDiscount} className="space-y-4 text-xs">
              <div>
                <label className="font-bold uppercase text-slate-300 block mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP20"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 text-amber-300 font-mono font-bold uppercase border border-slate-700 rounded-md focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">Discount Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-md"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold uppercase text-slate-300 block mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 text-white font-bold border border-slate-700 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold uppercase text-slate-300 block mb-1">Minimum Order Amount ({storeConfig.currency.symbol})</label>
                <input
                  type="number"
                  required
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-md"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-slate-300 block mb-1">Expiration Date</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-md"
                />
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
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
