"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Crown,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Edit3,
  Phone,
  Mail,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
  Info,
  Check,
  X,
  UserCheck,
  UserX,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { AdminService } from "@/services/admin.service";
import {
  AdminManagedUser,
  AdminRole,
  ModulePermissionCode,
  PermissionDefinition,
} from "@/types/admin.types";
import {
  ROLE_LEVEL,
  AVAILABLE_PERMISSIONS,
  canCreateRole,
  canManageUser,
  canDeactivateUser,
  rbac,
} from "@/lib/rbac";

type SubordinateRole = "STORE_ADMIN" | "STAFF" | "CUSTOMER";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore();
  const currentRole = (currentUser?.role || "SUPER_ADMIN") as AdminRole;

  // Data State
  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [delegatablePerms, setDelegatablePerms] = useState<ModulePermissionCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createRolePreset, setCreateRolePreset] = useState<SubordinateRole>("STAFF");
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<AdminManagedUser | null>(null);
  const [selectedUserForView, setSelectedUserForView] = useState<AdminManagedUser | null>(null);

  // Form State: Create User
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "STAFF" as SubordinateRole,
    permissions: [] as ModulePermissionCode[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Form State: Edit User
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    permissions: [] as ModulePermissionCode[],
    isActive: true,
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Alert / Feedback Toast
  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  // Load initial data
  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      // 1. Fetch Users
      const usersRes = await AdminService.getUsers();
      if (usersRes.success) {
        setUsers(usersRes.data);
      }

      // 2. Fetch Delegatable Permissions for current user
      const permsRes = await AdminService.getDelegatablePermissions();
      if (permsRes.success && permsRes.data?.permissions) {
        setDelegatablePerms(permsRes.data.permissions);
      }
    } catch (err: any) {
      console.error("[UsersPage] Load failed:", err);
      showAlert("error", "Error Loading Users", err.message || "Failed to load directory.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.role]);

  // Toast Helper
  const showAlert = (type: "success" | "error" | "info", title: string, message: string) => {
    setAlertMessage({ type, title, message });
    setTimeout(() => {
      setAlertMessage((prev) => (prev?.title === title ? null : prev));
    }, 5000);
  };

  // Grouped Permissions for Modal
  const categorizedPermissions = useMemo(() => {
    const groups: Record<string, PermissionDefinition[]> = {};
    AVAILABLE_PERMISSIONS.forEach((p) => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, []);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;

      // Status filter
      if (statusFilter === "ACTIVE" && !u.isActive) return false;
      if (statusFilter === "INACTIVE" && u.isActive) return false;

      // Search query (name, email, phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesPhone = Boolean(u.phone && u.phone.toLowerCase().includes(q));
        if (!matchesName && !matchesEmail && !matchesPhone) return false;
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role === "SUPER_ADMIN" || u.role === "STORE_ADMIN").length,
      staff: users.filter((u) => u.role === "STAFF").length,
      customers: users.filter((u) => u.role === "CUSTOMER").length,
      active: users.filter((u) => u.isActive).length,
    };
  }, [users]);

  // --------------------------------------------------------------------------
  // CREATE USER HANDLERS
  // --------------------------------------------------------------------------
  const openCreateModal = (targetRole: SubordinateRole) => {
    setCreateRolePreset(targetRole);
    // Auto-preselect sensible default permissions for target role
    let initialPerms: ModulePermissionCode[] = [];
    if (targetRole === "STORE_ADMIN") {
      initialPerms = delegatablePerms.filter((p) =>
        ["products:read", "products:write", "inventory:read", "inventory:write", "orders:read", "orders:write"].includes(p)
      );
    } else if (targetRole === "STAFF") {
      initialPerms = delegatablePerms.filter((p) =>
        ["orders:read", "inventory:read", "products:read"].includes(p)
      );
    }

    setCreateForm({
      name: "",
      email: "",
      password: "",
      phone: "",
      role: targetRole,
      permissions: initialPerms,
    });
    setCreateErrors({});
    setIsCreateModalOpen(true);
  };

  const validateCreateForm = () => {
    const errs: Record<string, string> = {};
    if (!createForm.name || createForm.name.trim().length < 2) {
      errs.name = "Name must be between 2 and 100 characters.";
    }
    if (!createForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      errs.email = "Please provide a valid email address.";
    }
    if (!createForm.password || createForm.password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(createForm.password)) {
      errs.password = "Password must include at least 1 letter and 1 number.";
    }
    setCreateErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    setIsSubmittingCreate(true);
    try {
      const res = await AdminService.createUser({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        phone: createForm.phone || undefined,
        permissions: createForm.role !== "CUSTOMER" ? createForm.permissions : [],
      });

      if (!res.success) {
        if (res.error === "USER_ALREADY_EXISTS") {
          setCreateErrors({ email: "Email already in use." });
        } else if (res.error === "FORBIDDEN_ROLE_CREATION") {
          showAlert("error", "Access Denied", res.message || "You cannot create this role.");
        } else if (res.error === "FORBIDDEN_PERMISSION_DELEGATION") {
          showAlert("error", "Permission Denied", res.message || "You cannot grant permissions you do not have.");
        } else {
          showAlert("error", "Creation Failed", res.message || "Failed to create user.");
        }
        return;
      }

      showAlert("success", "User Created", `${createForm.role} ${createForm.name} created successfully!`);
      setIsCreateModalOpen(false);
      await loadData(true);
    } catch (err: any) {
      showAlert("error", "Unexpected Error", err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // --------------------------------------------------------------------------
  // EDIT USER HANDLERS
  // --------------------------------------------------------------------------
  const openEditModal = (targetUser: AdminManagedUser) => {
    // Check permission to manage
    if (!canManageUser(currentRole, targetUser.role) && targetUser.id !== currentUser?.id) {
      showAlert("error", "Action Prohibited", "You cannot edit an account with an equal or higher role than your own.");
      return;
    }

    setSelectedUserForEdit(targetUser);
    setEditForm({
      name: targetUser.name,
      phone: targetUser.phone || "",
      permissions: targetUser.permissions || [],
      isActive: targetUser.isActive,
    });
    setEditErrors({});
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;

    if (!editForm.name || editForm.name.trim().length < 2) {
      setEditErrors({ name: "Name must be at least 2 characters." });
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const res = await AdminService.updateUser(selectedUserForEdit.id, {
        name: editForm.name,
        phone: editForm.phone || undefined,
        permissions: selectedUserForEdit.role !== "CUSTOMER" ? editForm.permissions : [],
        isActive: editForm.isActive,
      });

      if (!res.success) {
        showAlert("error", "Update Failed", res.message || "Failed to update user.");
        return;
      }

      showAlert("success", "User Updated", `Account for ${editForm.name} updated successfully.`);
      setSelectedUserForEdit(null);
      await loadData(true);
    } catch (err: any) {
      showAlert("error", "Error", err.message || "An error occurred.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // --------------------------------------------------------------------------
  // STATUS TOGGLE HANDLER (ACTIVATE / DEACTIVATE)
  // --------------------------------------------------------------------------
  const handleToggleStatus = async (targetUser: AdminManagedUser) => {
    const newStatus = !targetUser.isActive;

    // Check Self-Deactivation Guard
    if (currentUser?.id === targetUser.id && !newStatus) {
      showAlert("error", "Action Blocked", "You cannot deactivate your own account. (CANNOT_DEACTIVATE_SELF)");
      return;
    }

    // Check Equal or Higher Role Guard
    const check = canDeactivateUser(currentUser?.id, targetUser.id, currentRole, targetUser.role);
    if (!check.allowed) {
      showAlert("error", "Permission Denied", check.reason || "You cannot deactivate this account.");
      return;
    }

    try {
      const res = await AdminService.updateUserStatus(targetUser.id, newStatus);
      if (!res.success) {
        if (res.error === "CANNOT_DEACTIVATE_SELF") {
          showAlert("error", "Action Blocked", "You cannot deactivate your own account.");
        } else {
          showAlert("error", "Action Denied", res.message || "Failed to update status.");
        }
        return;
      }

      showAlert(
        "success",
        newStatus ? "Account Activated" : "Account Deactivated",
        `${targetUser.name} has been ${newStatus ? "unlocked" : "deactivated"}.`
      );
      await loadData(true);
    } catch (err: any) {
      showAlert("error", "Error", err.message || "Status change failed.");
    }
  };

  // Helper for Role Badges
  const renderRoleBadge = (role: AdminRole) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/10 border border-violet-500/30 text-violet-400">
            <Crown className="w-3 h-3" />
            SUPER ADMIN (L4)
          </span>
        );
      case "STORE_ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Shield className="w-3 h-3" />
            STORE ADMIN (L3)
          </span>
        );
      case "STAFF":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            STAFF (L2)
          </span>
        );
      case "CUSTOMER":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-700/50 border border-slate-600/50 text-slate-300">
            <Users className="w-3 h-3" />
            CUSTOMER (L1)
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Toast Alert Banner */}
      {alertMessage && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-md w-full p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 ${
            alertMessage.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
              : alertMessage.type === "error"
              ? "bg-rose-950/90 border-rose-500/40 text-rose-200"
              : "bg-slate-900/90 border-slate-700 text-slate-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {alertMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : alertMessage.type === "error" ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider">{alertMessage.title}</h4>
              <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{alertMessage.message}</p>
            </div>
            <button
              onClick={() => setAlertMessage(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Page Header with Role Guidelines */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
              MODULE 01: ADMIN RBAC
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400">
              Logged in as <strong className="text-white">{currentUser?.name || "Admin"}</strong> ({currentRole})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            User Management & Delegated RBAC
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Hierarchical delegation engine: Super Admins manage Store Managers, Store Managers manage Staff, and Staff manage Customers.
          </p>
        </div>

        {/* Action Buttons: Strict Role-Based Visibility (Section 2 Guidelines) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
          </button>

          {/* Visible ONLY to SUPER_ADMIN */}
          {rbac.canCreateStoreAdmin(currentRole) && (
            <button
              id="btn-create-store-admin"
              onClick={() => openCreateModal("STORE_ADMIN")}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-violet-900/30 transition-all hover:scale-[1.02]"
            >
              <Crown className="w-4 h-4" />
              <span>Create Store Admin</span>
            </button>
          )}

          {/* Visible to SUPER_ADMIN & STORE_ADMIN */}
          {rbac.canCreateStaff(currentRole) && (
            <button
              id="btn-create-staff"
              onClick={() => openCreateModal("STAFF")}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-900/30 transition-all hover:scale-[1.02]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Create Staff</span>
            </button>
          )}

          {/* Visible to SUPER_ADMIN, STORE_ADMIN & STAFF */}
          {rbac.canCreateCustomer(currentRole) && (
            <button
              id="btn-create-customer"
              onClick={() => openCreateModal("CUSTOMER")}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.02]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* Directory Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Visible</div>
          <div className="text-xl font-black text-white mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Directory accounts</div>
        </div>
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Managers & Roots</div>
          <div className="text-xl font-black text-violet-300 mt-1">{stats.admins}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">L4 & L3 Admins</div>
        </div>
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Operations Staff</div>
          <div className="text-xl font-black text-amber-300 mt-1">{stats.staff}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">L2 Warehouse/Ops</div>
        </div>
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Buyers / Clients</div>
          <div className="text-xl font-black text-slate-200 mt-1">{stats.customers}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">L1 Storefront</div>
        </div>
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 col-span-2 sm:col-span-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Active Status</div>
          <div className="text-xl font-black text-emerald-300 mt-1">{stats.active}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Unlocked accounts</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-user-search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, email, or phone number..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Role:
            </span>
            {["ALL", "STORE_ADMIN", "STAFF", "CUSTOMER"].map((role) => {
              // Hide tabs not visible to actor's hierarchy
              if (currentRole === "STAFF" && role !== "ALL" && role !== "CUSTOMER") return null;
              if (currentRole === "STORE_ADMIN" && role === "SUPER_ADMIN") return null;

              const isSelected = roleFilter === role;
              return (
                <button
                  key={role}
                  onClick={() => {
                    setRoleFilter(role);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0 ${
                    isSelected
                      ? "bg-amber-500 text-slate-950 shadow-md"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {role === "ALL" ? "All Roles" : role.replace("_", " ")}
                </button>
              );
            })}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Loading user hierarchy...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Users Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No matching records found for the current search query and filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">User & Identity</th>
                  <th className="py-4 px-6">Role & Level</th>
                  <th className="py-4 px-6">Permissions</th>
                  <th className="py-4 px-6">Created By</th>
                  <th className="py-4 px-6">Account Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {paginatedUsers.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  const canManage = canManageUser(currentRole, u.role);
                  const canDeact = canDeactivateUser(currentUser?.id, u.id, currentRole, u.role).allowed;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-900/40 transition-colors group"
                    >
                      {/* User & Contact */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm uppercase flex-shrink-0 ${
                              u.role === "SUPER_ADMIN"
                                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                                : u.role === "STORE_ADMIN"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : u.role === "STAFF"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-slate-800 text-slate-300 border border-slate-700"
                            }`}
                          >
                            {u.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white truncate">{u.name}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[9px] font-mono font-bold">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-0.5">
                              <span className="truncate flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-500" />
                                {u.email}
                              </span>
                              {u.phone && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span className="truncate flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-500" />
                                    {u.phone}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Level */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {renderRoleBadge(u.role)}
                      </td>

                      {/* Permissions Granted */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {u.role === "SUPER_ADMIN" ? (
                          <span className="text-[11px] font-semibold text-violet-400 flex items-center gap-1">
                            <Crown className="w-3 h-3" /> Full Root Access
                          </span>
                        ) : u.role === "CUSTOMER" ? (
                          <span className="text-[11px] text-slate-500 italic">None (Storefront only)</span>
                        ) : (
                          <button
                            onClick={() => setSelectedUserForView(u)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] font-mono transition-colors"
                          >
                            <KeyRound className="w-3 h-3 text-amber-400" />
                            <span>{u.permissions?.length || 0} permissions</span>
                            <ChevronRight className="w-3 h-3 text-slate-500" />
                          </button>
                        )}
                      </td>

                      {/* Creator attribution */}
                      <td className="py-4 px-6 whitespace-nowrap text-slate-400 text-[11px]">
                        {u.creator ? (
                          <div>
                            <span className="text-white font-medium block truncate max-w-[140px]">
                              {u.creator.name}
                            </span>
                            <span className="text-slate-500 text-[10px]">
                              {u.creator.role}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Root System</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={!canDeact}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                            u.isActive
                              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                          } ${!canDeact ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                          title={
                            isSelf
                              ? "Cannot deactivate your own account"
                              : !canManage
                              ? "Cannot modify an account with equal or higher role"
                              : "Click to toggle account access"
                          }
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.isActive ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                            }`}
                          />
                          <span>{u.isActive ? "Active" : "Deactivated"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedUserForView(u)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                            title="View User Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => openEditModal(u)}
                            disabled={!canManage && !isSelf}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              canManage || isSelf
                                ? "bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border-slate-800 hover:border-amber-500/30"
                                : "bg-slate-900/50 text-slate-600 border-slate-800/50 cursor-not-allowed"
                            }`}
                            title={
                              canManage || isSelf
                                ? "Edit Subordinate Profile & Permissions"
                                : "Equal or higher role: Modification locked"
                            }
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredUsers.length > 0 && (
          <div className="border-t border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              Showing <span className="font-bold text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-bold text-white">
                {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
              </span>{" "}
              of <span className="font-bold text-white">{filteredUsers.length}</span> accounts
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1 font-mono text-[11px] text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4.2. CREATE SUBORDINATE USER MODAL                                        */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                  DELEGATED ONBOARDING
                </span>
                <h2 className="text-lg font-bold text-white mt-1">
                  Create {createForm.role.replace("_", " ")}
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              {/* Role Selection Dropdown (Only allowed roles) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Account Hierarchy Role
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => {
                    const newRole = e.target.value as SubordinateRole;
                    setCreateForm((prev) => ({
                      ...prev,
                      role: newRole,
                      permissions: newRole === "CUSTOMER" ? [] : prev.permissions,
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {rbac.canCreateStoreAdmin(currentRole) && (
                    <option value="STORE_ADMIN">STORE_ADMIN (Level 3 - Store Manager)</option>
                  )}
                  {rbac.canCreateStaff(currentRole) && (
                    <option value="STAFF">STAFF (Level 2 - Warehouse & Operations)</option>
                  )}
                  {rbac.canCreateCustomer(currentRole) && (
                    <option value="CUSTOMER">CUSTOMER (Level 1 - Regular Buyer)</option>
                  )}
                </select>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Priya Sharma"
                    className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 ${
                      createErrors.name ? "border-rose-500" : "border-slate-800"
                    }`}
                  />
                  {createErrors.name && (
                    <p className="text-[11px] text-rose-400 mt-1">{createErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="e.g. priya.staff@maison.com"
                    className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 ${
                      createErrors.email ? "border-rose-500" : "border-slate-800"
                    }`}
                  />
                  {createErrors.email && (
                    <p className="text-[11px] text-rose-400 mt-1">{createErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Temporary Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      placeholder="Min 8 chars, 1 letter, 1 number"
                      className={`w-full px-3.5 py-2.5 pr-10 bg-slate-950 border rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 ${
                        createErrors.password ? "border-rose-500" : "border-slate-800"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {createErrors.password && (
                    <p className="text-[11px] text-rose-400 mt-1">{createErrors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Dynamic Permission Checkboxes (Section 3 of spec) */}
              {createForm.role !== "CUSTOMER" && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5" />
                        Grant Permissions (Delegated Checkboxes)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        You can only assign permissions you possess ({delegatablePerms.length} delegatable).
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCreateForm((prev) => ({
                            ...prev,
                            permissions: [...delegatablePerms],
                          }));
                        }}
                        className="text-[10px] font-bold text-amber-400 hover:underline uppercase"
                      >
                        Select All
                      </button>
                      <span className="text-slate-600">|</span>
                      <button
                        type="button"
                        onClick={() => setCreateForm((prev) => ({ ...prev, permissions: [] }))}
                        className="text-[10px] font-bold text-slate-400 hover:underline uppercase"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    {Object.entries(categorizedPermissions).map(([category, perms]) => {
                      // Filter by permissions delegatable by current user
                      const visibleInGroup = perms.filter((p) =>
                        currentRole === "SUPER_ADMIN" ? true : delegatablePerms.includes(p.code)
                      );
                      if (visibleInGroup.length === 0) return null;

                      return (
                        <div key={category} className="space-y-2">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-900">
                            {category}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {visibleInGroup.map((p) => {
                              const isChecked = createForm.permissions.includes(p.code);
                              return (
                                <label
                                  key={p.code}
                                  className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                                    isChecked
                                      ? "bg-amber-500/10 border-amber-500/40 text-amber-200"
                                      : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setCreateForm((prev) => ({
                                          ...prev,
                                          permissions: [...prev.permissions, p.code],
                                        }));
                                      } else {
                                        setCreateForm((prev) => ({
                                          ...prev,
                                          permissions: prev.permissions.filter((code) => code !== p.code),
                                        }));
                                      }
                                    }}
                                    className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-0 focus:ring-offset-0"
                                  />
                                  <div>
                                    <div className="font-semibold text-white leading-tight">{p.name}</div>
                                    <div className="text-[10px] font-mono text-slate-500">{p.code}</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-900/30 transition-all hover:scale-[1.02] disabled:opacity-60"
                >
                  {isSubmittingCreate ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Create {createForm.role.replace("_", " ")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4.5. EDIT SUBORDINATE USER MODAL                                          */}
      {/* ========================================================================= */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                  UPDATE SUBORDINATE
                </span>
                <h2 className="text-lg font-bold text-white mt-1">
                  Edit {selectedUserForEdit.name}
                </h2>
                <div className="text-xs text-slate-400 mt-0.5">
                  Role: <strong className="text-amber-400">{selectedUserForEdit.role}</strong> ({selectedUserForEdit.email})
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForEdit(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  {editErrors.name && (
                    <p className="text-[11px] text-rose-400 mt-1">{editErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Status Switch */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider">Account Active Status</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Deactivating this account prevents login and locks API tokens immediately.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedUserForEdit.id === currentUser?.id && editForm.isActive) {
                      showAlert("error", "Action Prohibited", "You cannot deactivate your own account.");
                      return;
                    }
                    setEditForm({ ...editForm, isActive: !editForm.isActive });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                    editForm.isActive
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  }`}
                >
                  {editForm.isActive ? "Active (Unlocked)" : "Deactivated (Locked)"}
                </button>
              </div>

              {/* Permissions Checklist for Staff/Managers */}
              {selectedUserForEdit.role !== "CUSTOMER" && selectedUserForEdit.role !== "SUPER_ADMIN" && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Subordinate Permissions
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Adjust permission matrix for this employee ({delegatablePerms.length} delegatable).
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditForm((prev) => ({ ...prev, permissions: [...delegatablePerms] }))}
                        className="text-[10px] font-bold text-amber-400 hover:underline uppercase"
                      >
                        Grant All Allowed
                      </button>
                      <span className="text-slate-600">|</span>
                      <button
                        type="button"
                        onClick={() => setEditForm((prev) => ({ ...prev, permissions: [] }))}
                        className="text-[10px] font-bold text-slate-400 hover:underline uppercase"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                    {Object.entries(categorizedPermissions).map(([category, perms]) => {
                      const visibleInGroup = perms.filter((p) =>
                        currentRole === "SUPER_ADMIN" ? true : delegatablePerms.includes(p.code)
                      );
                      if (visibleInGroup.length === 0) return null;

                      return (
                        <div key={category} className="space-y-2">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-900">
                            {category}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {visibleInGroup.map((p) => {
                              const isChecked = editForm.permissions.includes(p.code);
                              return (
                                <label
                                  key={p.code}
                                  className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                                    isChecked
                                      ? "bg-amber-500/10 border-amber-500/40 text-amber-200"
                                      : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setEditForm((prev) => ({
                                          ...prev,
                                          permissions: [...prev.permissions, p.code],
                                        }));
                                      } else {
                                        setEditForm((prev) => ({
                                          ...prev,
                                          permissions: prev.permissions.filter((code) => code !== p.code),
                                        }));
                                      }
                                    }}
                                    className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-0 focus:ring-offset-0"
                                  />
                                  <div>
                                    <div className="font-semibold text-white leading-tight">{p.name}</div>
                                    <div className="text-[10px] font-mono text-slate-500">{p.code}</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUserForEdit(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-900/30 transition-all hover:scale-[1.02] disabled:opacity-60"
                >
                  {isSubmittingEdit ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Updates</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4.4. GET SINGLE USER DETAILS INSPECTION DRAWER                            */}
      {/* ========================================================================= */}
      {selectedUserForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-lg">
                  {selectedUserForView.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedUserForView.name}</h3>
                  <div className="text-xs text-slate-400">{selectedUserForView.email}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForView(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Role Tier</div>
                  <div className="mt-1">{renderRoleBadge(selectedUserForView.role)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</div>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedUserForView.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedUserForView.isActive ? "bg-emerald-400" : "bg-rose-400"}`} />
                      {selectedUserForView.isActive ? "ACTIVE" : "DEACTIVATED"}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone</div>
                  <div className="text-slate-300 font-mono mt-1">{selectedUserForView.phone || "Not set"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Created At</div>
                  <div className="text-slate-300 font-mono mt-1">
                    {new Date(selectedUserForView.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Creator details */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Hierarchical Creator
                </div>
                {selectedUserForView.creator ? (
                  <div className="text-slate-300">
                    <span className="font-bold text-white">{selectedUserForView.creator.name}</span>
                    <span className="text-slate-500 ml-2">({selectedUserForView.creator.role})</span>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">ID: {selectedUserForView.creator.id}</div>
                  </div>
                ) : (
                  <div className="text-slate-400 italic">Master Root (System Initialized)</div>
                )}
              </div>

              {/* Granted Permissions List */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Granted Permissions ({selectedUserForView.permissions?.length || 0})
                  </div>
                </div>
                {selectedUserForView.role === "SUPER_ADMIN" ? (
                  <div className="text-violet-400 font-semibold text-xs flex items-center gap-1.5">
                    <Crown className="w-4 h-4" /> Full Root Access to all modules
                  </div>
                ) : selectedUserForView.permissions && selectedUserForView.permissions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pt-1">
                    {selectedUserForView.permissions.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 italic text-[11px]">No specific permissions assigned.</div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedUserForView(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
