/**
 * Role-Based Access Control (RBAC) & Granular Permission Matrix
 * Module 01: Admin RBAC & User Hierarchy Implementation
 */

import { AdminRole, AdminPermission, PermissionDefinition, ModulePermissionCode } from "@/types/admin.types";

/**
 * Strict Role Level Hierarchy
 * Higher numbers dominate lower numbers
 */
export const ROLE_LEVEL: Record<AdminRole, number> = {
  SUPER_ADMIN: 4,
  STORE_ADMIN: 3,
  STAFF: 2,
  CUSTOMER: 1,
};

/**
 * Standard Available Permissions List (Grouped by Category)
 * As defined in Module 01 specification
 */
export const AVAILABLE_PERMISSIONS: PermissionDefinition[] = [
  // Catalog
  { code: "products:read", name: "View Products", category: "Catalog" },
  { code: "products:write", name: "Create & Edit Products", category: "Catalog" },
  { code: "products:delete", name: "Archive/Delete Products", category: "Catalog" },
  { code: "categories:manage", name: "Manage Categories & Subcategories", category: "Catalog" },
  { code: "collections:manage", name: "Manage Curated Collections", category: "Catalog" },

  // Inventory
  { code: "inventory:read", name: "View Inventory Stock Levels", category: "Inventory" },
  { code: "inventory:write", name: "Adjust Stock & Restock", category: "Inventory" },

  // Orders
  { code: "orders:read", name: "View Customer Orders", category: "Orders" },
  { code: "orders:write", name: "Advance Order Status & Shipping", category: "Orders" },
  { code: "orders:cancel", name: "Cancel Orders & Restock", category: "Orders" },

  // Marketing
  { code: "coupons:manage", name: "Create & Edit Discount Coupons", category: "Marketing" },
  { code: "promotions:manage", name: "Manage Flash Sale Banners", category: "Marketing" },

  // Settings
  { code: "settings:manage", name: "Manage Themes & Feature Flags", category: "Settings" },

  // Users
  { code: "users:read", name: "View Subordinate Users", category: "Users" },
  { code: "users:write", name: "Edit Subordinate Users", category: "Users" },
  { code: "staff:manage", name: "Create & Manage Staff Members", category: "Users" },

  // Analytics
  { code: "analytics:read", name: "View Sales & Telemetry Dashboards", category: "Analytics" },
];

/**
 * Permission Mapping per Role
 */
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  SUPER_ADMIN: [
    "analytics:view",
    "products:view",
    "products:create",
    "products:edit",
    "products:delete",
    "products:archive",
    "inventory:view",
    "inventory:adjust",
    "orders:view",
    "orders:update_status",
    "orders:cancel",
    "orders:export",
    "categories:manage",
    "collections:manage",
    "discounts:manage",
    "settings:view",
    "settings:edit",
    "audit:view",
  ],
  STORE_ADMIN: [
    "analytics:view",
    "products:view",
    "products:create",
    "products:edit",
    "products:archive",
    "inventory:view",
    "inventory:adjust",
    "orders:view",
    "orders:update_status",
    "orders:cancel",
    "orders:export",
    "categories:manage",
    "collections:manage",
    "discounts:manage",
    "settings:view",
    "settings:edit",
  ],
  STAFF: [
    "analytics:view",
    "products:view",
    "inventory:view",
    "inventory:adjust",
    "orders:view",
    "orders:update_status",
  ],
  CUSTOMER: [],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role?: string | null, permission?: AdminPermission): boolean {
  if (!role || !permission) return false;
  const normalizedRole = role.toUpperCase() as AdminRole;
  const permissions = ROLE_PERMISSIONS[normalizedRole] || [];
  return permissions.includes(permission);
}

/**
 * Check if user can access the admin dashboard
 */
export function canAccessAdmin(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toUpperCase() as AdminRole;
  return r === "SUPER_ADMIN" || r === "STORE_ADMIN" || r === "STAFF" || r.includes("ADMIN");
}

/**
 * Hierarchical Delegation: Can actor manage/edit target user?
 * An admin cannot edit an account with equal or higher role.
 */
export function canManageUser(actorRole?: string | null, targetRole?: string | null): boolean {
  if (!actorRole || !targetRole) return false;
  const actorLevel = ROLE_LEVEL[actorRole.toUpperCase() as AdminRole] || 1;
  const targetLevel = ROLE_LEVEL[targetRole.toUpperCase() as AdminRole] || 1;
  return actorLevel > targetLevel;
}

/**
 * Hierarchical Delegation: Can actor create the specified role?
 * - SUPER_ADMIN can create: STORE_ADMIN, STAFF, CUSTOMER
 * - STORE_ADMIN can create: STAFF, CUSTOMER
 * - STAFF can create: CUSTOMER
 */
export function canCreateRole(actorRole?: string | null, roleToCreate?: string | null): boolean {
  if (!actorRole || !roleToCreate) return false;
  const actorLevel = ROLE_LEVEL[actorRole.toUpperCase() as AdminRole] || 1;
  const targetLevel = ROLE_LEVEL[roleToCreate.toUpperCase() as AdminRole] || 1;
  return actorLevel > targetLevel;
}

/**
 * Deactivation Guard:
 * - Cannot deactivate self
 * - Cannot deactivate equal or higher role
 */
export function canDeactivateUser(
  actorId?: string | null,
  targetId?: string | null,
  actorRole?: string | null,
  targetRole?: string | null
): { allowed: boolean; reason?: string } {
  if (actorId && targetId && actorId === targetId) {
    return { allowed: false, reason: "You cannot deactivate your own account." };
  }
  if (!canManageUser(actorRole, targetRole)) {
    return { allowed: false, reason: "You cannot modify an account with equal or higher role." };
  }
  return { allowed: true };
}

/**
 * Fetch list of delegatable permissions allowed for actorRole
 */
export function getDelegatablePermissions(actorRole?: string | null): ModulePermissionCode[] {
  if (!actorRole) return [];
  const normalized = actorRole.toUpperCase() as AdminRole;

  if (normalized === "SUPER_ADMIN") {
    return AVAILABLE_PERMISSIONS.map((p) => p.code);
  }

  if (normalized === "STORE_ADMIN") {
    // Store admin can delegate everything except staff:manage, settings:manage, products:delete
    return AVAILABLE_PERMISSIONS.filter(
      (p) => !["settings:manage", "staff:manage", "products:delete"].includes(p.code)
    ).map((p) => p.code);
  }

  if (normalized === "STAFF") {
    return ["orders:read", "inventory:read"];
  }

  return [];
}

/**
 * Permission shortcuts for UI conditional rendering
 */
export const rbac = {
  canDeleteProduct: (role?: string) => {
    if (!role) return false;
    if (role.toUpperCase() === "SUPER_ADMIN") return true;
    return hasPermission(role, "products:delete");
  },
  canArchiveProduct: (role?: string) => {
    if (!role) return false;
    if (role.toUpperCase() === "SUPER_ADMIN" || role.toUpperCase() === "STORE_ADMIN") return true;
    return hasPermission(role, "products:archive");
  },
  canCreateProduct: (role?: string) => {
    if (!role) return false;
    if (role.toUpperCase() === "SUPER_ADMIN" || role.toUpperCase() === "STORE_ADMIN") return true;
    return hasPermission(role, "products:create");
  },
  canAdjustStock: (role?: string) => hasPermission(role, "inventory:adjust"),
  canExportOrders: (role?: string) => hasPermission(role, "orders:export"),
  canUpdateOrderStatus: (role?: string) => hasPermission(role, "orders:update_status"),
  canManageSettings: (role?: string) => hasPermission(role, "settings:edit"),
  canManageDiscounts: (role?: string) => hasPermission(role, "discounts:manage"),
  canViewAuditLogs: (role?: string) => hasPermission(role, "audit:view"),

  // Module 01 UI Role Helpers
  canCreateStoreAdmin: (role?: string) => canCreateRole(role, "STORE_ADMIN"),
  canCreateStaff: (role?: string) => canCreateRole(role, "STAFF"),
  canCreateCustomer: (role?: string) => canCreateRole(role, "CUSTOMER"),
  canAccessUsersPage: (role?: string) => canAccessAdmin(role),

  // Module 02 Category & Collection Helpers
  canManageCategories: (role?: string) => {
    if (!role) return false;
    const r = role.toUpperCase();
    if (r === "SUPER_ADMIN" || r === "STORE_ADMIN") return true;
    return hasPermission(role, "categories:manage");
  },
  canManageCollections: (role?: string) => {
    if (!role) return false;
    const r = role.toUpperCase();
    if (r === "SUPER_ADMIN" || r === "STORE_ADMIN") return true;
    return hasPermission(role, "collections:manage");
  },

  // Module 03 Product & Multi-Variant Catalog Helpers
  canReadProducts: (role?: string) => {
    if (!role) return false;
    const r = role.toUpperCase();
    if (r === "SUPER_ADMIN" || r === "STORE_ADMIN" || r === "STAFF") return true;
    return hasPermission(role, "products:view");
  },
  canWriteProducts: (role?: string) => {
    if (!role) return false;
    const r = role.toUpperCase();
    if (r === "SUPER_ADMIN" || r === "STORE_ADMIN") return true;
    return hasPermission(role, "products:edit") || hasPermission(role, "products:create");
  },
  canDeleteProducts: (role?: string) => {
    if (!role) return false;
    const r = role.toUpperCase();
    if (r === "SUPER_ADMIN") return true;
    return hasPermission(role, "products:delete");
  },
};
