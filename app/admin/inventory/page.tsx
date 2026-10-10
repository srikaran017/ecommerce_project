"use client";

import React, { useState, useEffect } from "react";
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
  FileSpreadsheet,
} from "lucide-react";
import { storeConfig } from "@/config/store.config";
import { AdminService } from "@/services/admin.service";
import {
  FlatInventoryItem,
  InventoryLedgerEntry,
  InventoryTransactionReason,
} from "@/types/admin.types";
import { exportInventoryCsv } from "@/utils/exportCsv";
import { useAuthStore } from "@/stores/auth.store";
import { rbac } from "@/lib/rbac";

export default function AdminInventoryPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<FlatInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");
  const [adjustmentLog, setAdjustmentLog] = useState<string | null>(null);

  // Auditable Ledger Adjustment Modal
  const [selectedVariant, setSelectedVariant] = useState<FlatInventoryItem | null>(null);
  const [deltaAmount, setDeltaAmount] = useState<number>(10);
  const [isIncrement, setIsIncrement] = useState<boolean>(true);
  const [reason, setReason] = useState<InventoryTransactionReason>("RESTOCK");
  const [notes, setNotes] = useState<string>("");

  // Ledger History Drawer
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [ledgerLogs, setLedgerLogs] = useState<InventoryLedgerEntry[]>([]);

  const loadInventory = () => {
    setIsLoading(true);
    AdminService.getInventory()
      .then((data) => setItems(data))
      .catch((err) => console.error("Error loading inventory:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const openAdjustModal = (item: FlatInventoryItem, isAdd: boolean) => {
    if (!rbac.canAdjustStock(user?.role)) {
      alert("Permission denied to adjust warehouse stock levels.");
      return;
    }
    setSelectedVariant(item);
    setIsIncrement(isAdd);
    setDeltaAmount(isAdd ? 10 : 1);
    setReason(isAdd ? "RESTOCK" : "MANUAL_ADJUSTMENT");
    setNotes("");
  };

  const handleConfirmAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    const actualDelta = isIncrement ? Math.abs(deltaAmount) : -Math.abs(deltaAmount);
    await AdminService.adjustStock({
      variantId: selectedVariant.id,
      delta: actualDelta,
      reason,
      notes: notes.trim() || undefined,
    });

    setAdjustmentLog(
      `SKU ${selectedVariant.sku} stock adjusted by ${actualDelta > 0 ? `+${actualDelta}` : actualDelta} (${reason})`
    );
    setSelectedVariant(null);
    loadInventory();
    setTimeout(() => setAdjustmentLog(null), 3500);
  };

  const handleOpenLedger = () => {
    setLedgerLogs(AdminService.getInventoryTransactions());
    setIsLedgerOpen(true);
  };

  const handleExportManifest = () => {
    exportInventoryCsv(items, storeConfig.name);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.colorName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              LEDGER ENGINE
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400">Double-Entry Stock Accounting</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Layers className="w-6 h-6 text-amber-400" />
            <span>Garment Stock & Inventory Ledger</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track variant quantities, record inbound batches, and monitor safety buffer thresholds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenLedger}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>Audit History</span>
          </button>

          <button
            onClick={handleExportManifest}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Stock CSV</span>
          </button>
        </div>
      </div>

      {/* Real-time Feedback Banner */}
      {adjustmentLog && (
        <div className="p-4 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{adjustmentLog}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by garment title, SKU, or color swatch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-900 text-white border border-slate-700 rounded-lg font-semibold uppercase focus:border-amber-400 focus:outline-none"
          >
            <option value="ALL">All Items ({items.length})</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Flattened Inventory Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6">SKU Identifier</th>
                <th className="py-3.5 px-6">Garment Item</th>
                <th className="py-3.5 px-6">Size</th>
                <th className="py-3.5 px-6">Color Swatch</th>
                <th className="py-3.5 px-6">Price</th>
                <th className="py-3.5 px-6">Current Stock</th>
                <th className="py-3.5 px-6">Threshold</th>
                <th className="py-3.5 px-6 text-right">Ledger Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Loading inventory records...
                  </td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-amber-300">
                      {item.sku}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.productImage || "https://placehold.co/80"}
                          alt={item.productName}
                          className="w-8 h-10 object-cover rounded border border-slate-800 bg-slate-900"
                        />
                        <span className="font-bold text-white text-xs truncate max-w-xs">
                          {item.productName}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono text-[11px]">
                        {item.size}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-700"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <span className="text-[11px] text-slate-300">{item.colorName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-white">
                      {storeConfig.currency.symbol}
                      {item.price.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-sm">
                      <span
                        className={
                          item.stock === 0
                            ? "text-rose-400"
                            : item.stock <= item.lowStockThreshold
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }
                      >
                        {item.stock}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-400">
                      ≤ {item.lowStockThreshold}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openAdjustModal(item, false)}
                          disabled={item.stock === 0}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Audit Decrement / Loss"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openAdjustModal(item, true)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-700 cursor-pointer"
                          title="Restock Batch Inbound"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No garments matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>
                  {isIncrement ? "Restock Inbound Batch" : "Adjust / Record Stock Outflow"}
                </span>
              </h3>
              <button
                onClick={() => setSelectedVariant(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjustment} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-white block">{selectedVariant.productName}</span>
                <p className="text-[11px] text-slate-400 font-mono">
                  SKU: {selectedVariant.sku} • Current Stock: {selectedVariant.stock} units
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">
                  {isIncrement ? "Units Received (+)" : "Units Deducted (-)"} *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={deltaAmount}
                  onChange={(e) => setDeltaAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Auditable Reason Code *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="RESTOCK">Supplier Restock / New Batch</option>
                  <option value="MANUAL_ADJUSTMENT">Manual Warehouse Correction</option>
                  <option value="RETURN">Customer Return / Exchange</option>
                  <option value="DAMAGED">Damaged / Defective Discard</option>
                  <option value="INVENTORY_AUDIT">Physical Stock Count Reconciliation</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Auditor Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Inward PO #849 from Surat weaver"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-[11px]"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedVariant(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Record Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History Drawer */}
      {isLedgerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-950 border-l border-slate-800 w-full max-w-lg p-6 sm:p-8 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-amber-400">
                <History className="w-5 h-5" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Audit Transaction Ledger
                </h3>
              </div>
              <button
                onClick={() => setIsLedgerOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {ledgerLogs.length > 0 ? (
                ledgerLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-white text-[11px]">
                        {log.variantSku}
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          log.deltaQuantity > 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {log.deltaQuantity > 0 ? `+${log.deltaQuantity}` : log.deltaQuantity} units
                      </span>
                    </div>
                    <p className="text-slate-300 font-medium truncate">{log.productName}</p>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                      <span>{log.reason}</span>
                      <span>
                        {log.previousStock} → {log.newStock}
                      </span>
                      <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No inventory transactions logged yet. Adjustments will be recorded here in real time.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
