"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ShieldCheck,
  ShieldAlert,
  User,
  Clock,
  Calendar,
  X,
  Copy,
  Check,
  Terminal,
  Activity,
  ArrowRight,
  Database,
  Sliders,
  ShoppingBag,
  Package,
  Layers,
  Tag,
  FolderTree,
  Sparkles,
} from "lucide-react";
import { AdminService } from "@/services/admin.service";
import {
  AdminAuditLog,
  AuditLogListQueryParams,
} from "@/types/admin.types";
import { useAuthStore } from "@/stores/auth.store";
import { rbac } from "@/lib/rbac";

export default function AdminAuditLogsPage() {
  const { user } = useAuthStore();
  const canView = rbac.canViewAuditLogs(user?.role);

  // Data states
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Inspect Modal
  const [inspectingLog, setInspectingLog] = useState<AdminAuditLog | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // Load audit logs
  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const params: AuditLogListQueryParams = {
        search: search.trim() || undefined,
        action: actionFilter !== "ALL" ? actionFilter : undefined,
        entity: entityFilter !== "ALL" ? entityFilter : undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(`${endDate}T23:59:59.000Z`).toISOString() : undefined,
      };

      const res = await AdminService.getAuditLogsList(params);
      if (res && Array.isArray(res.data)) {
        setLogs(res.data);
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load audit logs");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [search, actionFilter, entityFilter, startDate, endDate]);

  const showNotification = (type: "success" | "error" | "info", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleCopyJson = (payload: any) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = logs.length;
    const catalogCount = logs.filter(
      (l) => l.entity === "PRODUCT" || l.entity === "CATEGORY" || l.entity === "COLLECTION"
    ).length;
    const orderAndStockCount = logs.filter(
      (l) => l.entity === "ORDER" || l.entity === "INVENTORY"
    ).length;
    const settingsAndSecurityCount = logs.filter(
      (l) => l.entity === "STORE_CONFIG" || l.entity === "USER" || l.entity === "COUPON" || l.entity === "PROMOTION"
    ).length;

    return { total, catalogCount, orderAndStockCount, settingsAndSecurityCount };
  }, [logs]);

  // Badge Styling based on Action Prefix (Specification 4.3)
  const getActionBadgeClass = (action: string) => {
    const upper = action.toUpperCase();
    if (upper.startsWith("CREATE") || upper.startsWith("RESTOCK") || upper.startsWith("ACTIVATE")) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
    if (upper.startsWith("UPDATE") || upper.startsWith("SWITCH") || upper.startsWith("ADVANCE") || upper.startsWith("ASSIGN")) {
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    }
    if (upper.startsWith("DELETE") || upper.startsWith("CANCEL") || upper.startsWith("DEACTIVATE")) {
      return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    }
    if (upper.startsWith("ADJUST") || upper.startsWith("DAMAGE") || upper.startsWith("WARNING")) {
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    }
    return "bg-slate-800 text-slate-300 border-slate-700";
  };

  const getEntityIcon = (entity: string) => {
    switch (entity.toUpperCase()) {
      case "PRODUCT":
        return Package;
      case "ORDER":
        return ShoppingBag;
      case "INVENTORY":
        return Layers;
      case "COUPON":
        return Tag;
      case "CATEGORY":
        return FolderTree;
      case "COLLECTION":
      case "PROMOTION":
        return Sparkles;
      case "STORE_CONFIG":
        return Sliders;
      case "USER":
        return User;
      default:
        return Database;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            <span>Security & Governance</span>
            <span>/</span>
            <span>Module 07</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <FileText className="w-7 h-7 text-amber-400" />
            <span>Immutable Administrative Audit Logs</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tamper-evident chronological audit trail capturing staff actions, entity targets, network IP, and change snapshots.
          </p>
        </div>

        <button
          onClick={() => {
            setIsRefreshing(true);
            loadLogs();
          }}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
          <span>Sync Audit Stream</span>
        </button>
      </div>

      {/* Permission Warning if viewer lacks audit view */}
      {!canView && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-xs text-rose-200">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            Access Restricted: Viewing security audit trails requires the <code className="bg-rose-950/80 px-1 py-0.5 rounded text-rose-300">audit:view</code> permission or SUPER_ADMIN authorization.
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
          <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{feedback.text}</span>
        </div>
      )}

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Events */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Audit Events</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Recorded in security journal
          </div>
        </div>

        {/* Card 2: Catalog Mutations */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Catalog Operations</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats.catalogCount}
          </div>
          <div className="text-[11px] text-blue-400 mt-1 font-semibold">
            Garments, variants, lookbooks
          </div>
        </div>

        {/* Card 3: Orders & Stock Adjustments */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Orders & Stock Ledger</span>
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats.orderAndStockCount}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 font-semibold">
            Fulfillments & warehouse entries
          </div>
        </div>

        {/* Card 4: Settings & Security Events */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Settings & Security</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats.settingsAndSecurityCount}
          </div>
          <div className="text-[11px] text-purple-400 mt-1 font-semibold">
            Themes, flags, vouchers, RBAC
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
            placeholder="Search action, entity ID, staff name..."
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

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Entity Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">Entity: All</option>
              <option value="STORE_CONFIG">Store Config</option>
              <option value="PRODUCT">Product</option>
              <option value="ORDER">Order</option>
              <option value="INVENTORY">Inventory</option>
              <option value="COUPON">Coupon</option>
              <option value="PROMOTION">Promotion</option>
              <option value="CATEGORY">Category</option>
              <option value="COLLECTION">Collection</option>
              <option value="USER">User / Staff</option>
            </select>
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-400 font-mono text-[11px]"
          >
            <option value="ALL">Action: All Verbs</option>
            <option value="UPDATE_FEATURE_FLAGS">UPDATE_FEATURE_FLAGS</option>
            <option value="UPDATE_STORE_SETTINGS">UPDATE_STORE_SETTINGS</option>
            <option value="SWITCH_THEME">SWITCH_THEME</option>
            <option value="CREATE_PRODUCT">CREATE_PRODUCT</option>
            <option value="ADJUST_STOCK">ADJUST_STOCK</option>
            <option value="CANCEL_ORDER">CANCEL_ORDER</option>
            <option value="CREATE_COUPON">CREATE_COUPON</option>
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 font-mono text-[11px]"
            title="Start date filter"
          />

          {/* Clear Filters Button */}
          {(search || actionFilter !== "ALL" || entityFilter !== "ALL" || startDate || endDate) && (
            <button
              onClick={() => {
                setSearch("");
                setActionFilter("ALL");
                setEntityFilter("ALL");
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 4. Audit Log Timeline Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60 uppercase text-[10px] tracking-wider">
                <th className="py-4 px-6 font-semibold">Timestamp</th>
                <th className="py-4 px-6 font-semibold">Staff Attribution</th>
                <th className="py-4 px-6 font-semibold">Action Verb</th>
                <th className="py-4 px-6 font-semibold">Entity Target</th>
                <th className="py-4 px-6 font-semibold">Network & Client Context</th>
                <th className="py-4 px-6 font-semibold text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto mb-2" />
                    <span>Loading security audit journal...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-400 font-medium">No audit entries match your criteria.</p>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Try clearing search parameters or date filters.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const EntityIcon = getEntityIcon(log.entity);
                  const badgeClass = getActionBadgeClass(log.action);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-900/40 transition-colors group"
                    >
                      {/* Timestamp */}
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <div className="font-mono text-white text-xs font-semibold">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </div>
                      </td>

                      {/* Staff Attribution */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-amber-300 uppercase shrink-0">
                            {log.user?.name ? log.user.name.slice(0, 2) : "AD"}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-semibold text-white truncate max-w-[140px]">
                              {log.user?.name || log.adminName || "Store Admin"}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                              {log.user?.email || log.adminEmail || "admin@maison.com"}
                            </div>
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              {log.user?.role || "ADMIN"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action Verb */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase border ${badgeClass}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Entity Target */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-slate-900 rounded border border-slate-800 text-slate-400">
                            <EntityIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-white font-bold text-[11px] uppercase tracking-wide block">
                              {log.entity}
                            </span>
                            <span className="text-[10px] font-mono text-amber-300/90 block truncate max-w-[120px]">
                              {log.entityId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Client Context (IP & User-Agent) */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <span className="font-mono text-[11px] text-slate-300 block">
                            IP: {log.ipAddress || "192.168.1.1"}
                          </span>
                          <span
                            className="text-[10px] text-slate-500 block truncate max-w-[160px] font-mono"
                            title={log.userAgent}
                          >
                            {log.userAgent ? log.userAgent.split(" ")[0] : "Browser Agent"}
                          </span>
                        </div>
                      </td>

                      {/* Payload Inspect Button */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setInspectingLog(log)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Detailed Audit Log Modal */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 p-6 sm:p-8 rounded-2xl max-w-2xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase border ${getActionBadgeClass(
                      inspectingLog.action
                    )}`}
                  >
                    {inspectingLog.action}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ID: {inspectingLog.id}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  Target Entity: {inspectingLog.entity} ({inspectingLog.entityId})
                </h3>
              </div>

              <button
                onClick={() => setInspectingLog(null)}
                className="text-slate-500 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context Cards */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Staff Attribution
                </span>
                <div className="font-bold text-white">
                  {inspectingLog.user?.name || inspectingLog.adminName || "Store Owner"}
                </div>
                <div className="text-slate-400 text-[11px]">
                  {inspectingLog.user?.email || inspectingLog.adminEmail}
                </div>
                <span className="inline-block mt-1 text-[9px] font-mono font-bold uppercase text-purple-300">
                  Role: {inspectingLog.user?.role || "ADMIN"}
                </span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Network & Client Context
                </span>
                <div className="font-mono text-white text-[11px]">
                  IP: {inspectingLog.ipAddress || "192.168.1.1"}
                </div>
                <div className="font-mono text-slate-400 text-[10px] truncate" title={inspectingLog.userAgent}>
                  {inspectingLog.userAgent || "Desktop Client"}
                </div>
                <div className="text-slate-500 text-[10px] font-mono pt-1">
                  {new Date(inspectingLog.createdAt).toUTCString()}
                </div>
              </div>
            </div>

            {/* JSON Payload Inspection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>Diff Payload Snapshot (detailsJson)</span>
                </div>

                <button
                  onClick={() => handleCopyJson(inspectingLog.detailsJson)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-amber-300 transition-colors"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl font-mono text-[11px] text-amber-300/90 overflow-x-auto max-h-60 leading-relaxed shadow-inner">
                {JSON.stringify(inspectingLog.detailsJson, null, 2)}
              </pre>
            </div>

            {/* Close Button */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectingLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-lg cursor-pointer border border-slate-800"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
