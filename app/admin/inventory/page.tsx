"use client";

import React, { useState } from "react";
import {
  Layers,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  ArrowUpDown,
  History,
  Sparkles,
} from "lucide-react";
import { FALLBACK_PRODUCTS, ProductVariantData } from "@/data/products.data";
import { storeConfig } from "@/config/store.config";

interface FlatInventoryItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  sku: string;
  size: string;
  colorName: string;
  colorHex: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
}

export default function AdminInventoryPage() {
  // Flatten variants from all products
  const initialItems: FlatInventoryItem[] = FALLBACK_PRODUCTS.flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      productId: p.id,
      productName: p.name,
      productImage: p.images[0]?.url || "",
      sku: v.sku,
      size: v.size,
      colorName: v.colorName,
      colorHex: v.colorHex || "#000000",
      price: v.price,
      stock: v.stock,
      lowStockThreshold: v.lowStockThreshold || 5,
    }))
  );

  const [items, setItems] = useState<FlatInventoryItem[]>(initialItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");
  const [adjustmentLog, setAdjustmentLog] = useState<string | null>(null);

  const handleStockAdjust = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newStock = Math.max(0, item.stock + delta);
          setAdjustmentLog(`Updated SKU ${item.sku} stock from ${item.stock} to ${newStock}`);
          setTimeout(() => setAdjustmentLog(null), 3000);
          return { ...item, stock: newStock };
        }
        return item;
      })
    );
  };

  const handleDirectStockChange = (id: string, val: number) => {
    const safeVal = Math.max(0, isNaN(val) ? 0 : val);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, stock: safeVal } : item))
    );
  };

  // KPIs
  const totalVariants = items.length;
  const totalStockUnits = items.reduce((acc, i) => acc + i.stock, 0);
  const lowStockCount = items.filter(
    (i) => i.stock > 0 && i.stock <= i.lowStockThreshold
  ).length;
  const outOfStockCount = items.filter((i) => i.stock === 0).length;
  const totalInventoryValue = items.reduce((acc, i) => acc + i.stock * i.price, 0);

  // Filtered List
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.colorName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "IN_STOCK") return item.stock > item.lowStockThreshold;
    if (statusFilter === "LOW_STOCK") return item.stock > 0 && item.stock <= item.lowStockThreshold;
    if (statusFilter === "OUT_OF_STOCK") return item.stock === 0;

    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Layers className="w-6 h-6 text-amber-400" />
            <span>Variant-Level Inventory & Stock Control</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time multi-variant inventory management with low-stock alert thresholds and live adjustments.
          </p>
        </div>

        {adjustmentLog && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-md animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{adjustmentLog}</span>
          </div>
        )}
      </div>

      {/* Inventory KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-lg space-y-1">
          <span className="text-slate-400 uppercase font-semibold">Total Garment SKUs</span>
          <div className="text-2xl font-bold text-white">{totalVariants} SKUs</div>
          <p className="text-[11px] text-slate-500 font-mono">Across all sizes & colors</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-5 rounded-lg space-y-1">
          <span className="text-slate-400 uppercase font-semibold">Available Units</span>
          <div className="text-2xl font-bold text-emerald-400">{totalStockUnits.toLocaleString()}</div>
          <p className="text-[11px] text-slate-500 font-mono">
            Value: {storeConfig.currency.symbol}{totalInventoryValue.toLocaleString()}
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-5 rounded-lg space-y-1">
          <span className="text-slate-400 uppercase font-semibold">Low-Stock Warnings</span>
          <div className="text-2xl font-bold text-amber-400">{lowStockCount} Variants</div>
          <p className="text-[11px] text-amber-400/80 font-mono">≤ Threshold limits</p>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-5 rounded-lg space-y-1">
          <span className="text-slate-400 uppercase font-semibold">Out of Stock</span>
          <div className="text-2xl font-bold text-red-400">{outOfStockCount} Variants</div>
          <p className="text-[11px] text-red-400/80 font-mono">Immediate restock needed</p>
        </div>
      </div>

      {/* Search and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by SKU, silhouette, or color..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 text-white border border-slate-700 rounded-md focus:border-amber-400 focus:outline-none"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors ${
              statusFilter === "ALL"
                ? "bg-amber-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setStatusFilter("IN_STOCK")}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors ${
              statusFilter === "IN_STOCK"
                ? "bg-amber-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Healthy
          </button>
          <button
            onClick={() => setStatusFilter("LOW_STOCK")}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors ${
              statusFilter === "LOW_STOCK"
                ? "bg-amber-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setStatusFilter("OUT_OF_STOCK")}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors ${
              statusFilter === "OUT_OF_STOCK"
                ? "bg-amber-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
        </div>

      </div>

      {/* Variant Inventory Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                <th className="py-3.5 px-6 font-semibold">SKU / Variant</th>
                <th className="py-3.5 px-6 font-semibold">Silhouette</th>
                <th className="py-3.5 px-6 font-semibold">Color & Size</th>
                <th className="py-3.5 px-6 font-semibold">Unit Price</th>
                <th className="py-3.5 px-6 font-semibold">Stock Status</th>
                <th className="py-3.5 px-6 font-semibold">Available Units</th>
                <th className="py-3.5 px-6 font-semibold text-right">Quick Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredItems.map((item) => {
                const isLow = item.stock > 0 && item.stock <= item.lowStockThreshold;
                const isOut = item.stock === 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-amber-300">
                      {item.sku}
                    </td>
                    <td className="py-4 px-6 flex items-center gap-3">
                      {item.productImage && (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-8 h-10 object-cover rounded bg-slate-800 flex-shrink-0"
                        />
                      )}
                      <span className="font-bold text-white line-clamp-1">{item.productName}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full border border-black/20"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <span>{item.colorName}</span>
                        <span className="font-bold text-white bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {item.size}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-white">
                      {storeConfig.currency.symbol}{item.price.toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                          <XCircle className="w-3 h-3" />
                          <span>OUT OF STOCK</span>
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          <span>LOW (≤{item.lowStockThreshold})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>IN STOCK</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <input
                        type="number"
                        min="0"
                        value={item.stock}
                        onChange={(e) => handleDirectStockChange(item.id, parseInt(e.target.value))}
                        className={`w-18 px-2.5 py-1 text-xs font-bold rounded border bg-slate-900 text-center ${
                          isOut
                            ? "text-red-400 border-red-700"
                            : isLow
                            ? "text-amber-400 border-amber-700"
                            : "text-white border-slate-700"
                        }`}
                      />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStockAdjust(item.id, -1)}
                          disabled={item.stock <= 0}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Decrease Stock (-1)"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleStockAdjust(item.id, +1)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 cursor-pointer"
                          title="Increase Stock (+1)"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleStockAdjust(item.id, +10)}
                          className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold rounded border border-amber-500/30 cursor-pointer"
                          title="Batch Restock (+10)"
                        >
                          +10
                        </button>
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
  );
}
