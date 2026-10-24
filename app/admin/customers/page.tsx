"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Edit3,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  CreditCard,
  DollarSign,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  X,
  Upload,
  Link as LinkIcon,
  ShieldAlert,
  ArrowUpDown,
  Lock,
  ExternalLink,
  Building,
  Check,
} from "lucide-react";
import { AdminService } from "@/services/admin.service";
import {
  AdminCustomerListItem,
  AdminCustomer360,
  CustomerListQueryParams,
  CreateCustomerInput,
  UpdateCustomerInput,
} from "@/types/admin.types";
import { useAuthStore } from "@/stores/auth.store";
import { rbac } from "@/lib/rbac";

export default function AdminCustomersPage() {
  const { user: currentUser } = useAuthStore();
  const currentRole = currentUser?.role || "SUPER_ADMIN";
  const canWrite = rbac.canWriteCustomers(currentRole);

  // Main Customer List State
  const [customers, setCustomers] = useState<AdminCustomerListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "warning" | "error";
    message: string;
  } | null>(null);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [sortBy, setSortBy] = useState<"createdAt" | "totalSpent" | "orderCount" | "name">("totalSpent");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, totalPages: 1 });
  const itemsPerPage = 15;

  // Customer 360 Detail Drawer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customer360, setCustomer360] = useState<AdminCustomer360 | null>(null);
  const [isLoading360, setIsLoading360] = useState(false);
  const [active360Tab, setActive360Tab] = useState<"orders" | "addresses">("orders");

  // Create Customer Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    autoPassword: true,
    avatarMode: "url" as "upload" | "url",
    avatarUrl: "",
    avatarFile: null as File | null,
    includeAddress: false,
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Edit Customer Modal State
  const [editingCustomer, setEditingCustomer] = useState<AdminCustomerListItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    isActive: true,
    avatarMode: "url" as "upload" | "url",
    avatarUrl: "",
    avatarFile: null as File | null,
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Customer Confirmation Modal State
  const [customerToDelete, setCustomerToDelete] = useState<AdminCustomerListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalSuccessMessage, setModalSuccessMessage] = useState<string | null>(null);

  const showNotification = (type: "success" | "warning" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  // Load Customers
  const loadCustomers = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const queryParams: CustomerListQueryParams = {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery.trim() || undefined,
          sortBy,
          sortOrder,
          isActive: statusFilter === "ALL" ? undefined : statusFilter === "ACTIVE",
        };

        const res = await AdminService.getCustomers(queryParams);
        if (res.success && res.data) {
          setCustomers(res.data);
          if (res.pagination) {
            setPaginationMeta({
              total: res.pagination.total,
              totalPages: res.pagination.totalPages,
            });
          }
        } else {
          showNotification("error", res.message || "Failed to load customers.");
        }
      } catch (err: any) {
        showNotification("error", err.message || "Network error loading customer directory.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentPage, searchQuery, sortBy, sortOrder, statusFilter]
  );

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Load Customer 360 Detail
  const handleOpen360 = async (id: string) => {
    setSelectedCustomerId(id);
    setIsLoading360(true);
    setActive360Tab("orders");
    try {
      const res = await AdminService.getCustomerById(id);
      if (res.success && res.data) {
        setCustomer360(res.data);
      } else {
        showNotification("error", res.message || "Failed to load customer profile.");
      }
    } catch {
      showNotification("error", "Error fetching customer 360 details.");
    } finally {
      setIsLoading360(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (customer: AdminCustomerListItem) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      password: "",
      isActive: customer.isActive,
      avatarMode: "url",
      avatarUrl: customer.avatarUrl || "",
      avatarFile: null,
    });
  };

  // Handle Create Customer Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim()) {
      showNotification("error", "Name and email are mandatory.");
      return;
    }

    setIsSubmittingCreate(true);
    try {
      let payload: CreateCustomerInput | FormData;

      if (createForm.avatarMode === "upload" && createForm.avatarFile) {
        const fd = new FormData();
        fd.append("name", createForm.name.trim());
        fd.append("email", createForm.email.trim().toLowerCase());
        if (createForm.phone.trim()) fd.append("phone", createForm.phone.trim());
        if (!createForm.autoPassword && createForm.password.trim()) {
          fd.append("password", createForm.password.trim());
        }
        fd.append("avatar", createForm.avatarFile);
        if (createForm.includeAddress && createForm.address1.trim()) {
          fd.append(
            "address",
            JSON.stringify({
              firstName: createForm.name.split(" ")[0] || "Valued",
              lastName: createForm.name.split(" ").slice(1).join(" ") || "Client",
              address1: createForm.address1.trim(),
              address2: createForm.address2.trim() || undefined,
              city: createForm.city.trim() || "Mumbai",
              state: createForm.state.trim() || "Maharashtra",
              postalCode: createForm.postalCode.trim() || "400001",
              country: createForm.country.trim() || "India",
              phoneNumber: createForm.phone.trim() || undefined,
            })
          );
        }
        payload = fd;
      } else {
        payload = {
          name: createForm.name.trim(),
          email: createForm.email.trim().toLowerCase(),
          phone: createForm.phone.trim() || undefined,
          password: !createForm.autoPassword && createForm.password.trim() ? createForm.password.trim() : undefined,
          avatarUrl: createForm.avatarUrl.trim() || undefined,
          address: createForm.includeAddress && createForm.address1.trim()
            ? {
              firstName: createForm.name.split(" ")[0] || "Valued",
              lastName: createForm.name.split(" ").slice(1).join(" ") || "Client",
              address1: createForm.address1.trim(),
              address2: createForm.address2.trim() || undefined,
              city: createForm.city.trim() || "Mumbai",
              state: createForm.state.trim() || "Maharashtra",
              postalCode: createForm.postalCode.trim() || "400001",
              country: createForm.country.trim() || "India",
              phoneNumber: createForm.phone.trim() || undefined,
            }
            : undefined,
        };
      }

      const res = await AdminService.createCustomer(payload);
      if (res.success) {
        // Immediate optimistic table update
        const createdCust = res.data?.customer;
        if (createdCust) {
          setCustomers((prev) => [
            {
              id: createdCust.id,
              name: createdCust.name,
              email: createdCust.email,
              phone: createdCust.phone || "",
              avatarUrl: createdCust.avatarUrl,
              isActive: createdCust.isActive ?? true,
              ordersCount: 0,
              totalSpent: 0,
              averageOrderValue: 0,
              location: createForm.city ? `${createForm.city}, ${createForm.state}` : "Direct Admin",
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
        setModalSuccessMessage(`Customer account created successfully! Updating table...`);
        showNotification("success", res.message || "Customer account created successfully.");
        loadCustomers(true);
        setTimeout(() => {
          setIsCreateModalOpen(false);
          setModalSuccessMessage(null);
        }, 1200);
      } else {
        showNotification("error", res.message || "Failed to create customer.");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error creating customer.");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Handle Edit Customer Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    setIsSubmittingEdit(true);
    try {
      let payload: UpdateCustomerInput | FormData;

      if (editForm.avatarMode === "upload" && editForm.avatarFile) {
        const fd = new FormData();
        if (editForm.name.trim()) fd.append("name", editForm.name.trim());
        if (editForm.email.trim()) fd.append("email", editForm.email.trim().toLowerCase());
        if (editForm.phone.trim()) fd.append("phone", editForm.phone.trim());
        if (editForm.password.trim()) fd.append("password", editForm.password.trim());
        fd.append("isActive", String(editForm.isActive));
        fd.append("avatar", editForm.avatarFile);
        payload = fd;
      } else {
        payload = {
          name: editForm.name.trim() || undefined,
          email: editForm.email.trim().toLowerCase() || undefined,
          phone: editForm.phone.trim() || undefined,
          password: editForm.password.trim() || undefined,
          isActive: editForm.isActive,
          avatarUrl: editForm.avatarUrl.trim() || undefined,
        };
      }

      const res = await AdminService.updateCustomer(editingCustomer.id, payload);
      if (res.success) {
        // Immediate in-place table update
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === editingCustomer.id
              ? {
                ...c,
                name: editForm.name.trim() || c.name,
                email: editForm.email.trim().toLowerCase() || c.email,
                phone: editForm.phone.trim() || c.phone,
                isActive: editForm.isActive,
                avatarUrl: editForm.avatarUrl || c.avatarUrl,
              }
              : c
          )
        );
        setModalSuccessMessage(`Customer profile updated successfully! Refreshing view...`);
        showNotification("success", res.message || "Customer profile updated successfully.");
        loadCustomers(true);
        setTimeout(() => {
          setEditingCustomer(null);
          setModalSuccessMessage(null);
        }, 1200);
      } else {
        showNotification("error", res.message || "Failed to update customer.");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error updating customer.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Quick Account Status Toggle (0ms delay)
  const handleToggleCustomerStatus = async (customer: AdminCustomerListItem) => {
    if (!canWrite) return;
    const nextStatus = !customer.isActive;
    // Optimistic UI update (0ms delay)
    setCustomers((prev) =>
      prev.map((c) => (c.id === customer.id ? { ...c, isActive: nextStatus } : c))
    );
    try {
      const res = await AdminService.updateCustomer(customer.id, { isActive: nextStatus });
      if (res.success) {
        showNotification(
          "success",
          `Customer '${customer.name}' account is now ${nextStatus ? "Active" : "Inactive"}.`
        );
        loadCustomers(true);
      } else {
        // Revert
        setCustomers((prev) =>
          prev.map((c) => (c.id === customer.id ? { ...c, isActive: customer.isActive } : c))
        );
        showNotification("error", res.message || "Failed to update account status.");
      }
    } catch (err: any) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, isActive: customer.isActive } : c))
      );
      showNotification("error", err.message || "Failed to update status.");
    }
  };

  // Handle Delete / Deactivate Customer
  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      const res = await AdminService.deleteCustomer(customerToDelete.id);
      if (res.success) {
        // Immediate in-place table update
        if (customerToDelete.ordersCount && customerToDelete.ordersCount > 0) {
          // Soft-deactivated
          setCustomers((prev) =>
            prev.map((c) => (c.id === customerToDelete.id ? { ...c, isActive: false } : c))
          );
        } else {
          // Hard-deleted
          setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id));
        }
        showNotification("success", res.message || "Customer operation completed.");
        setCustomerToDelete(null);
        loadCustomers(true);
      } else {
        showNotification("error", res.message || "Failed to process customer deletion.");
      }
    } catch (err: any) {
      showNotification("error", err.message || "Error deleting customer.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Summary Metrics from current list
  const metrics = useMemo(() => {
    const total = paginationMeta.total || customers.length;
    const active = customers.filter((c) => c.isActive).length;
    const totalSpentSum = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
    const totalOrdersSum = customers.reduce((acc, c) => acc + (c.ordersCount || 0), 0);
    return {
      total,
      active,
      totalSpentSum,
      totalOrdersSum,
    };
  }, [customers, paginationMeta.total]);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border shadow-lg transition-all animate-fade-in ${feedback.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              : feedback.type === "warning"
                ? "bg-amber-950/40 border-amber-500/30 text-amber-300"
                : "bg-rose-950/40 border-rose-500/30 text-rose-300"
            }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : feedback.type === "warning" ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <p className="text-xs font-semibold">{feedback.message}</p>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Customer Relationship Management (CRM)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Customer Directory & 360 Profiles</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor client lifetime value (LTV), purchase histories, saved delivery addresses, and account status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadCustomers(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-2xl border border-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
          </button>

          {canWrite && (
            <button
              onClick={() => {
                setCreateForm({
                  name: "",
                  email: "",
                  phone: "",
                  password: "",
                  autoPassword: true,
                  avatarMode: "url",
                  avatarUrl: "",
                  avatarFile: null,
                  includeAddress: false,
                  address1: "",
                  address2: "",
                  city: "",
                  state: "",
                  postalCode: "",
                  country: "India",
                });
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg hover:shadow-amber-500/20 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* High-Level CRM Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Registered</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{metrics.total}</div>
          <p className="text-[11px] text-slate-500">Verified platform client accounts</p>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Accounts</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{metrics.active}</div>
          <p className="text-[11px] text-slate-500">Authorized for checkout & orders</p>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Client Orders</span>
            <ShoppingBag className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{metrics.totalOrdersSum}</div>
          <p className="text-[11px] text-slate-500">Completed and active deliveries</p>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cumulative LTV</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">
            ₹{metrics.totalSpentSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500">Total client revenue generation</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by customer name, email, or contact phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400/50 focus:border-amber-400/50"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="INACTIVE">Deactivated</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("-") as [any, any];
                setSortBy(sb);
                setSortOrder(so);
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-400/50"
            >
              <option value="totalSpent-desc">Highest LTV (Spent)</option>
              <option value="totalSpent-asc">Lowest LTV (Spent)</option>
              <option value="orderCount-desc">Most Orders</option>
              <option value="createdAt-desc">Newest Customers</option>
              <option value="createdAt-asc">Oldest Customers</option>
              <option value="name-asc">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading customer CRM directory...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center space-y-3 p-6">
            <div className="w-12 h-12 rounded-full bg-slate-900 text-slate-500 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No customers found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "ALL"
                ? "Try clearing or adjusting your search filters to find registered client accounts."
                : "Create customer accounts or await organic customer registrations through checkout."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 sm:px-6">Customer</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">Orders</th>
                  <th className="py-3.5 px-4 text-right">Lifetime Value (LTV)</th>
                  <th className="py-3.5 px-4">Last Order</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                    {/* Customer Info */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        {c.avatarUrl ? (
                          <img
                            src={c.avatarUrl}
                            alt={c.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white text-xs">{c.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Joined {new Date(c.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                        <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate max-w-[180px]">{c.email}</span>
                      </div>
                      {c.phone ? (
                        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{c.phone}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600 italic">No phone saved</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="py-4 px-4">
                      {c.location ? (
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{c.location}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs italic">Unspecified</span>
                      )}
                    </td>

                    {/* Orders count */}
                    <td className="py-4 px-4 text-center font-bold text-white text-xs">
                      {c.ordersCount || 0}
                    </td>

                    {/* Total Spent (LTV) */}
                    <td className="py-4 px-4 text-right">
                      <p className="font-bold text-amber-400 text-xs">
                        ₹{(c.totalSpent || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                      {c.averageOrderValue > 0 && (
                        <p className="text-[10px] text-slate-500 font-mono">
                          AOV: ₹{c.averageOrderValue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                        </p>
                      )}
                    </td>

                    {/* Last Order Date */}
                    <td className="py-4 px-4 text-slate-400 text-[11px]">
                      {c.lastOrderDate ? (
                        new Date(c.lastOrderDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      ) : (
                        <span className="text-slate-600 italic">No orders yet</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleCustomerStatus(c)}
                        disabled={!canWrite}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${c.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                            : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-750"
                          } ${canWrite ? "cursor-pointer" : "cursor-default"}`}
                        title={canWrite ? `Click to ${c.isActive ? "deactivate" : "activate"} account` : undefined}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${c.isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                            }`}
                        />
                        <span>{c.isActive ? "Active" : "Inactive"}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpen360(c.id)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-lg border border-slate-800 transition-colors"
                          title="View Customer 360"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canWrite && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition-colors"
                              title="Edit Customer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setCustomerToDelete(c)}
                              className="p-1.5 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 hover:border-rose-500/30 transition-colors"
                              title="Delete or Deactivate Customer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {paginationMeta.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {customers.length} of {paginationMeta.total} customer accounts
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-white cursor-pointer"
              >
                Previous
              </button>
              <span className="font-mono text-slate-300">
                Page {currentPage} / {paginationMeta.totalPages}
              </span>
              <button
                disabled={currentPage >= paginationMeta.totalPages}
                onClick={() => setCurrentPage((p) => Math.min(paginationMeta.totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-white cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. CUSTOMER 360 DRAWER / MODAL                          */}
      {/* ======================================================== */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-950 border-l border-slate-800 h-full overflow-y-auto flex flex-col shadow-2xl">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-950/95 backdrop-blur z-10">
              <div className="flex items-center gap-2 text-amber-400">
                <Users className="w-4 h-4" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-white">
                  Customer 360 Profile
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedCustomerId(null);
                  setCustomer360(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoading360 || !customer360 ? (
              <div className="flex-1 flex items-center justify-center py-20 text-center space-y-3">
                <div>
                  <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-amber-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 mt-2">Loading Customer 360 metrics...</p>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-6 flex-1">
                {/* Profile Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                  {customer360.profile.avatarUrl ? (
                    <img
                      src={customer360.profile.avatarUrl}
                      alt={customer360.profile.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-amber-400/30"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-amber-400/30 text-amber-400 font-bold flex items-center justify-center text-lg">
                      {customer360.profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-white">{customer360.profile.name}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${customer360.profile.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400"
                          }`}
                      >
                        {customer360.profile.isActive ? "Active Account" : "Deactivated"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">{customer360.profile.email}</p>
                    {customer360.profile.phone && (
                      <p className="text-xs text-slate-500 font-mono">{customer360.profile.phone}</p>
                    )}
                  </div>
                </div>

                {/* 360 KPI Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Lifetime Value
                    </span>
                    <span className="text-sm font-bold text-amber-400 mt-1 block">
                      ₹{customer360.metrics.lifetimeValue.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Total Orders
                    </span>
                    <span className="text-sm font-bold text-white mt-1 block">
                      {customer360.metrics.totalOrders}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Delivered
                    </span>
                    <span className="text-sm font-bold text-emerald-400 mt-1 block">
                      {customer360.metrics.completedOrders}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Average Order
                    </span>
                    <span className="text-sm font-bold text-white mt-1 block">
                      ₹{customer360.metrics.averageOrderValue.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Drawer Tabs */}
                <div className="border-b border-slate-800 flex gap-4">
                  <button
                    onClick={() => setActive360Tab("orders")}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${active360Tab === "orders"
                        ? "border-amber-400 text-amber-400"
                        : "border-transparent text-slate-400 hover:text-white"
                      }`}
                  >
                    Recent Orders ({customer360.recentOrders.length})
                  </button>
                  <button
                    onClick={() => setActive360Tab("addresses")}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${active360Tab === "addresses"
                        ? "border-amber-400 text-amber-400"
                        : "border-transparent text-slate-400 hover:text-white"
                      }`}
                  >
                    Saved Addresses ({customer360.savedAddresses.length})
                  </button>
                </div>

                {/* Tab 1: Orders */}
                {active360Tab === "orders" && (
                  <div className="space-y-3">
                    {customer360.recentOrders.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center italic">
                        No orders recorded for this customer yet.
                      </p>
                    ) : (
                      customer360.recentOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-400 font-mono">
                                #{ord.orderNumber}
                              </span>
                              <span className="text-slate-500 text-[11px]">
                                {new Date(ord.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {ord.status}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs border-t border-slate-800/80 pt-2">
                            <span className="text-slate-400">
                              {ord.itemsCount} {ord.itemsCount === 1 ? "item" : "items"} •{" "}
                              {ord.paymentMethod}
                            </span>
                            <span className="font-bold text-white">
                              ₹{ord.totalAmount.toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="flex items-center justify-end">
                            <Link
                              href={`/admin/orders/${ord.id}`}
                              className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                            >
                              <span>View Order Full Breakdown</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab 2: Addresses */}
                {active360Tab === "addresses" && (
                  <div className="space-y-3">
                    {customer360.savedAddresses.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center italic">
                        No saved delivery addresses on record.
                      </p>
                    ) : (
                      customer360.savedAddresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`bg-slate-900/80 border rounded-xl p-4 space-y-2 text-xs ${addr.isDefault
                              ? "border-amber-400/50 bg-amber-950/10"
                              : "border-slate-800"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">
                              {addr.firstName} {addr.lastName}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                Default Shipping Address
                              </span>
                            )}
                          </div>
                          {addr.company && (
                            <p className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                              <Building className="w-3 h-3 text-slate-500" />
                              <span>{addr.company}</span>
                            </p>
                          )}
                          <p className="text-slate-300">{addr.address1}</p>
                          {addr.address2 && <p className="text-slate-400">{addr.address2}</p>}
                          <p className="text-slate-300 font-mono">
                            {addr.city}, {addr.state} {addr.postalCode}
                          </p>
                          <p className="text-slate-400">{addr.country}</p>
                          {addr.phoneNumber && (
                            <p className="text-slate-500 font-mono text-[11px] pt-1">
                              Phone: {addr.phoneNumber}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CREATE CUSTOMER MODAL                                */}
      {/* ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-amber-400">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">Create New Customer</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {modalSuccessMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{modalSuccessMessage}</span>
                </div>
              )}
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Victoria Beckham"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="victoria@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* Contact Phone */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                  Contact Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="+91 93612 00683"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* Password Option */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Password Setup
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-400 font-medium">
                    <input
                      type="checkbox"
                      checked={createForm.autoPassword}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, autoPassword: e.target.checked })
                      }
                      className="rounded border-slate-700 text-amber-400 focus:ring-amber-400"
                    />
                    <span>Auto-generate secure password</span>
                  </label>
                </div>
                {!createForm.autoPassword && (
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Enter customer initial password (min 8 chars)"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                )}
              </div>

              {/* Avatar Option */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                  Customer Profile Image (Optional)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, avatarMode: "url" })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${createForm.avatarMode === "url"
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-900 text-slate-400"
                      }`}
                  >
                    Image URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, avatarMode: "upload" })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${createForm.avatarMode === "upload"
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-900 text-slate-400"
                      }`}
                  >
                    Upload File
                  </button>
                </div>
                {createForm.avatarMode === "url" ? (
                  <input
                    type="url"
                    value={createForm.avatarUrl}
                    onChange={(e) => setCreateForm({ ...createForm, avatarUrl: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        avatarFile: e.target.files ? e.target.files[0] : null,
                      })
                    }
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700"
                  />
                )}
              </div>

              {/* Collapsible Address Section */}
              <div className="space-y-3 pt-1 border-t border-slate-800/80">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider text-slate-300">
                  <input
                    type="checkbox"
                    checked={createForm.includeAddress}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, includeAddress: e.target.checked })
                    }
                    className="rounded border-slate-700 text-amber-400 focus:ring-amber-400"
                  />
                  <span>Attach Default Delivery Address</span>
                </label>

                {createForm.includeAddress && (
                  <div className="space-y-3 p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl">
                    <input
                      type="text"
                      value={createForm.address1}
                      onChange={(e) => setCreateForm({ ...createForm, address1: e.target.value })}
                      placeholder="Street address & Building name *"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <input
                      type="text"
                      value={createForm.address2}
                      onChange={(e) => setCreateForm({ ...createForm, address2: e.target.value })}
                      placeholder="Apartment, suite, unit (optional)"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={createForm.city}
                        onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                        placeholder="City *"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                      <input
                        type="text"
                        value={createForm.state}
                        onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                        placeholder="State *"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={createForm.postalCode}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, postalCode: e.target.value })
                        }
                        placeholder="PIN / Postal Code *"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                      <input
                        type="text"
                        value={createForm.country}
                        onChange={(e) => setCreateForm({ ...createForm, country: e.target.value })}
                        placeholder="Country *"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmittingCreate ? "Creating..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. EDIT CUSTOMER MODAL                                  */}
      {/* ======================================================== */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Edit3 className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">Edit Customer Profile</h3>
              </div>
              <button
                onClick={() => setEditingCustomer(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {modalSuccessMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{modalSuccessMessage}</span>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1 pt-1 border-t border-slate-800/80">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                  Reset Password (Leave blank to keep unchanged)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="New strong password (min 8 chars)"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  value={editForm.avatarUrl}
                  onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="rounded border-slate-700 text-amber-400 focus:ring-amber-400"
                  />
                  <span className="text-xs text-slate-300 font-semibold">
                    Account Active (Customer can sign in and complete checkouts)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmittingEdit ? "Saving..." : "Update Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. DELETE / DEACTIVATE CONFIRMATION MODAL                */}
      {/* ======================================================== */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Delete Customer Account</h3>
                <p className="text-xs text-slate-400">{customerToDelete.name}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
              <p>
                Are you sure you want to remove{" "}
                <span className="font-bold text-white">{customerToDelete.name}</span> (
                {customerToDelete.email})?
              </p>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-[11px] text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Safety Policy:</strong> If this customer has placed orders, the account will be{" "}
                  <strong>deactivated</strong> instead of permanently deleted to preserve historical revenue and ledger records.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                {isDeleting ? "Processing..." : "Confirm Delete / Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
