/**
 * Role-Based Access Control (RBAC) & Granular Permission Matrix
 * Enforces Layer 3 and Layer 4 of Admin Defense-in-Depth
 */

import { AdminRole, AdminPermission } from "@/types/admin.types";

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
  const r = role.toUpperCase();
  return r === "SUPER_ADMIN" || r === "STORE_ADMIN" || r === "STAFF" || r.includes("ADMIN");
}

/**
 * Permission shortcuts for UI conditional rendering
 */
export const rbac = {
  canDeleteProduct: (role?: string) => hasPermission(role, "products:delete"),
  canArchiveProduct: (role?: string) => hasPermission(role, "products:archive"),
  canCreateProduct: (role?: string) => hasPermission(role, "products:create"),
  canAdjustStock: (role?: string) => hasPermission(role, "inventory:adjust"),
  canExportOrders: (role?: string) => hasPermission(role, "orders:export"),
  canUpdateOrderStatus: (role?: string) => hasPermission(role, "orders:update_status"),
  canManageSettings: (role?: string) => hasPermission(role, "settings:edit"),
  canManageDiscounts: (role?: string) => hasPermission(role, "discounts:manage"),
  canViewAuditLogs: (role?: string) => hasPermission(role, "audit:view"),
};
