/**
 * Production Admin Service Layer
 * Target: /api/v1/admin/*
 * Features:
 * - Real Bearer JWT authorization headers via AuthService
 * - Graceful fallback engine: If backend is offline or not yet created,
 *   persists data locally so the frontend is 100% functional, responsive, and testable.
 */

import { getApiBaseUrl } from "@/services/apiConfig";
import { AuthService } from "@/services/auth.service";
import {
  AdminDashboardOverview,
  AdminProduct,
  CreateProductInput,
  UpdateProductInput,
  FlatInventoryItem,
  StockAdjustmentInput,
  InventoryLedgerEntry,
  AdminOrder,
  OrderStatus,
  CourierInfo,
  AdminCategory,
  AdminCollection,
  AdminCoupon,
  AuditLogEntry,
  AdminManagedUser,
  CreateSubordinateUserInput,
  UpdateSubordinateUserInput,
  UserListQueryParams,
  UsersListResponse,
  ModulePermissionCode,
  AdminRole,
} from "@/types/admin.types";
import { FALLBACK_PRODUCTS } from "@/data/products.data";
import { storeConfig } from "@/config/store.config";
import { SAMPLE_ADMIN_ORDERS } from "@/app/admin/orders/page";
import { useAuthStore } from "@/stores/auth.store";
import {
  getDelegatablePermissions as getDelegatablePermsHelper,
  canCreateRole,
  canManageUser,
  canDeactivateUser,
} from "@/lib/rbac";

const getBaseUrl = () => `${getApiBaseUrl()}/admin`;

// ==========================================
// LOCAL PERSISTENT STORAGE MOCKS
// (Ensures complete interactivity while DB/backend is under construction)
// ==========================================

const STORAGE_KEYS = {
  PRODUCTS: "admin_mock_products_v1",
  ORDERS: "admin_mock_orders_v1",
  INVENTORY_LOGS: "admin_mock_inventory_logs_v1",
  CATEGORIES: "admin_mock_categories_v1",
  COLLECTIONS: "admin_mock_collections_v1",
  COUPONS: "admin_mock_coupons_v1",
  AUDIT_LOGS: "admin_mock_audit_logs_v1",
  USERS: "admin_mock_users_v1",
};

function getLocalData<T>(key: string, defaultVal: T): T {
  if (typeof window === "undefined") return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocalData<T>(key: string, val: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn(`[AdminService] Storage save error for ${key}:`, err);
  }
}

// Initialize seed products
function getInitialProducts(): AdminProduct[] {
  return FALLBACK_PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    shortDescription: p.shortDescription || undefined,
    status: "ACTIVE",
    categorySlug: p.categorySlug || "sarees",
    categoryName: p.categoryName || "Sarees",
    tags: p.tags || [],
    gender: "WOMEN",
    brand: p.brand || storeConfig.name,
    images: (p.images || []).map((img, idx) => ({
      url: img.url,
      altText: p.name,
      isPrimary: idx === 0,
      displayOrder: idx,
    })),
    variants: (p.variants || []).map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      colorName: v.colorName,
      colorHex: v.colorHex || "#000000",
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      costPrice: Math.round(v.price * 0.45),
      stock: v.stock,
      lowStockThreshold: v.lowStockThreshold || 5,
      isActive: true,
    })),
    totalStock: p.stock,
    basePrice: p.price,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

// Initialize seed users for Module 01 User Hierarchy
function getInitialUsers(): AdminManagedUser[] {
  return [
    {
      id: "usr_super_admin_1",
      name: "Store Owner",
      email: "owner@maison.com",
      role: "SUPER_ADMIN",
      permissions: [
        "products:read",
        "products:write",
        "products:delete",
        "categories:manage",
        "collections:manage",
        "inventory:read",
        "inventory:write",
        "orders:read",
        "orders:write",
        "orders:cancel",
        "coupons:manage",
        "promotions:manage",
        "settings:manage",
        "users:read",
        "users:write",
        "staff:manage",
        "analytics:read",
      ],
      phone: "+91 98765 00001",
      isActive: true,
      createdById: null,
      creator: null,
      createdAt: "2026-10-01T10:00:00.000Z",
      updatedAt: "2026-10-01T10:00:00.000Z",
    },
    {
      id: "usr_store_admin_2",
      name: "Rajesh Kumar (Store Manager)",
      email: "rajesh.manager@maison.com",
      role: "STORE_ADMIN",
      permissions: [
        "products:read",
        "products:write",
        "categories:manage",
        "collections:manage",
        "inventory:read",
        "inventory:write",
        "orders:read",
        "orders:write",
        "coupons:manage",
        "promotions:manage",
        "analytics:read",
        "users:read",
        "staff:manage",
      ],
      phone: "+91 98765 43210",
      isActive: true,
      createdById: "usr_super_admin_1",
      creator: {
        id: "usr_super_admin_1",
        name: "Store Owner",
        role: "SUPER_ADMIN",
      },
      createdAt: "2026-10-05T12:00:00.000Z",
      updatedAt: "2026-10-05T12:00:00.000Z",
    },
    {
      id: "usr_staff_3",
      name: "Priya Sharma (Operations)",
      email: "priya.staff@maison.com",
      role: "STAFF",
      permissions: [
        "products:read",
        "inventory:read",
        "inventory:write",
        "orders:read",
        "orders:write",
      ],
      phone: "+91 98765 99887",
      isActive: true,
      createdById: "usr_store_admin_2",
      creator: {
        id: "usr_store_admin_2",
        name: "Rajesh Kumar",
        role: "STORE_ADMIN",
      },
      createdAt: "2026-10-08T18:00:00.000Z",
      updatedAt: "2026-10-08T18:00:00.000Z",
    },
    {
      id: "usr_cust_4",
      name: "Aarav Sharma",
      email: "aarav@example.com",
      role: "CUSTOMER",
      permissions: [],
      phone: "+91 98765 00002",
      isActive: true,
      createdById: null,
      creator: null,
      createdAt: "2026-10-09T08:00:00.000Z",
      updatedAt: "2026-10-09T08:00:00.000Z",
    },
  ];
}

// ==========================================
// ADMIN SERVICE IMPLEMENTATION
// ==========================================

export class AdminService {
  /**
   * Helper to make authenticated admin API calls
   */
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; message?: string; error?: any; statusCode?: number }> {
    const token = AuthService.getAccessToken();
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    try {
      const response = await fetch(`${getBaseUrl()}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        try {
          const errJson = await response.json();
          return {
            success: false,
            ...errJson,
            statusCode: response.status,
            message: errJson.message || `HTTP ${response.status}`,
            error: errJson.error || errJson.code || response.statusText,
          };
        } catch {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const json = await response.json();
      return json;
    } catch (err: any) {
      // Backend not yet available -> Return error to trigger smart fallback
      return { success: false, error: err.message };
    }
  }

  // ----------------------------------------------------
  // 1. DASHBOARD & ANALYTICS (/api/v1/admin/analytics)
  // ----------------------------------------------------

  static async getDashboardOverview(): Promise<AdminDashboardOverview> {
    const res = await this.request<AdminDashboardOverview>("/analytics/overview");
    if (res.success && res.data) return res.data;

    // Fallback calculation from local data
    const orders = this.getLocalOrders();
    const products = this.getLocalProducts();

    const totalRev = orders.reduce((acc, o) => acc + (o.paymentStatus === "COMPLETED" ? o.total : 0), 0);
    const activeOrders = orders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED").length;
    const aov = orders.length > 0 ? Math.round(totalRev / orders.length) : 0;

    const inventoryAlerts = products.flatMap((p) =>
      p.variants
        .filter((v) => v.stock <= (v.lowStockThreshold || 5))
        .map((v) => ({
          id: `alert_${v.id}`,
          productId: p.id,
          productName: p.name,
          variantSku: v.sku,
          size: v.size,
          colorName: v.colorName,
          stock: v.stock,
          lowStockThreshold: v.lowStockThreshold || 5,
          urgency: (v.stock === 0 ? "CRITICAL" : "LOW") as "CRITICAL" | "LOW",
        }))
    );

    return {
      metrics: {
        totalRevenue: {
          title: "Total Net Revenue",
          value: `${storeConfig.currency.symbol}${totalRev.toLocaleString()}`,
          numericValue: totalRev,
          change: "+18.4% vs last month",
          isPositive: true,
        },
        activeOrders: {
          title: "Active Orders",
          value: activeOrders.toString(),
          numericValue: activeOrders,
          change: `${orders.filter((o) => o.status === "PENDING").length} awaiting dispatch`,
          isPositive: true,
        },
        totalCustomers: {
          title: "Total Customers",
          value: "1,240",
          numericValue: 1240,
          change: "+34 new this week",
          isPositive: true,
        },
        averageOrderValue: {
          title: "Average Order Value",
          value: `${storeConfig.currency.symbol}${aov.toLocaleString()}`,
          numericValue: aov,
          change: "+6.2% conversion rate",
          isPositive: true,
        },
      },
      recentOrders: orders.slice(0, 5).map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        total: o.total,
        status: o.status,
        paymentStatus: o.paymentStatus,
        itemsCount: o.items.length,
        createdAt: o.createdAt || "Today",
      })),
      inventoryAlerts: inventoryAlerts.slice(0, 5),
      salesChart: [
        { date: "Mon", revenue: 45000, orders: 4 },
        { date: "Tue", revenue: 82000, orders: 7 },
        { date: "Wed", revenue: 64000, orders: 5 },
        { date: "Thu", revenue: 110000, orders: 9 },
        { date: "Fri", revenue: 145000, orders: 12 },
        { date: "Sat", revenue: 210000, orders: 16 },
        { date: "Sun", revenue: 185000, orders: 14 },
      ],
    };
  }

  // ----------------------------------------------------
  // 2. PRODUCT MANAGEMENT (/api/v1/admin/products)
  // ----------------------------------------------------

  static getLocalProducts(): AdminProduct[] {
    return getLocalData<AdminProduct[]>(STORAGE_KEYS.PRODUCTS, getInitialProducts());
  }

  static async getProducts(search?: string): Promise<AdminProduct[]> {
    const res = await this.request<AdminProduct[]>(`/products${search ? `?search=${encodeURIComponent(search)}` : ""}`);
    if (res.success && Array.isArray(res.data)) return res.data;

    let list = this.getLocalProducts();
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          p.variants.some((v) => v.sku.toLowerCase().includes(q))
      );
    }
    return list;
  }

  static async createProduct(input: CreateProductInput): Promise<{ success: boolean; product?: AdminProduct; message?: string }> {
    const res = await this.request<AdminProduct>("/products", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (res.success && res.data) return { success: true, product: res.data };

    // Fallback local save
    const products = this.getLocalProducts();
    const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const totalStock = input.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
    const basePrice = input.variants[0]?.price || 0;

    const newProd: AdminProduct = {
      id: `prod_${Date.now()}`,
      name: input.name,
      slug,
      description: input.description,
      shortDescription: input.shortDescription,
      status: "ACTIVE",
      categorySlug: input.categorySlug,
      categoryName: input.categoryName,
      tags: input.tags,
      gender: input.gender || "WOMEN",
      brand: storeConfig.name,
      images: input.images.map((img, i) => ({
        url: img.url,
        isPrimary: img.isPrimary ?? i === 0,
        displayOrder: i,
      })),
      variants: input.variants.map((v, i) => ({
        id: `v_${Date.now()}_${i}`,
        sku: v.sku || `${input.name.slice(0, 3).toUpperCase()}-${v.size}-${v.colorName.slice(0, 2).toUpperCase()}`,
        size: v.size,
        colorName: v.colorName,
        colorHex: v.colorHex || "#000000",
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        costPrice: v.costPrice ? Number(v.costPrice) : null,
        stock: Number(v.stock),
        lowStockThreshold: v.lowStockThreshold || 5,
        isActive: true,
      })),
      totalStock,
      basePrice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    products.unshift(newProd);
    setLocalData(STORAGE_KEYS.PRODUCTS, products);
    this.logAudit("PRODUCT", newProd.id, `Created product "${newProd.name}" with ${newProd.variants.length} variants`);
    return { success: true, product: newProd };
  }

  static async updateProduct(id: string, input: UpdateProductInput): Promise<{ success: boolean; product?: AdminProduct }> {
    const res = await this.request<AdminProduct>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    if (res.success && res.data) return { success: true, product: res.data };

    const products = this.getLocalProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false };

    const updated = {
      ...products[idx],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    products[idx] = updated as AdminProduct;
    setLocalData(STORAGE_KEYS.PRODUCTS, products);
    this.logAudit("PRODUCT", id, `Updated product "${updated.name}"`);
    return { success: true, product: updated as AdminProduct };
  }

  static async archiveProduct(id: string): Promise<{ success: boolean }> {
    return this.updateProduct(id, { status: "ARCHIVED" });
  }

  static async deleteProduct(id: string): Promise<{ success: boolean }> {
    const res = await this.request(`/products/${id}`, { method: "DELETE" });
    if (res.success) return { success: true };

    const products = this.getLocalProducts().filter((p) => p.id !== id);
    setLocalData(STORAGE_KEYS.PRODUCTS, products);
    this.logAudit("PRODUCT", id, "Deleted product record");
    return { success: true };
  }

  // ----------------------------------------------------
  // 3. INVENTORY & STOCK LEDGER (/api/v1/admin/inventory)
  // ----------------------------------------------------

  static async getInventory(): Promise<FlatInventoryItem[]> {
    const res = await this.request<FlatInventoryItem[]>("/inventory");
    if (res.success && Array.isArray(res.data)) return res.data;

    const products = this.getLocalProducts();
    return products.flatMap((p) =>
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
        status: v.stock === 0 ? "OUT_OF_STOCK" : v.stock <= (v.lowStockThreshold || 5) ? "LOW_STOCK" : "IN_STOCK",
      }))
    );
  }

  static async adjustStock(input: StockAdjustmentInput): Promise<{ success: boolean; newStock?: number }> {
    const res = await this.request<{ newStock: number }>("/inventory/adjust", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (res.success && res.data) return { success: true, newStock: res.data.newStock };

    const products = this.getLocalProducts();
    let updatedStock = 0;
    let foundSku = "";
    let foundProductName = "";

    for (const prod of products) {
      for (const variant of prod.variants) {
        if (variant.id === input.variantId) {
          const prev = variant.stock;
          variant.stock = Math.max(0, variant.stock + input.delta);
          updatedStock = variant.stock;
          foundSku = variant.sku;
          foundProductName = prod.name;

          // Record ledger transaction
          this.logInventoryTransaction({
            id: `tx_${Date.now()}`,
            variantId: variant.id,
            productId: prod.id,
            productName: prod.name,
            variantSku: variant.sku,
            deltaQuantity: input.delta,
            previousStock: prev,
            newStock: variant.stock,
            reason: input.reason,
            notes: input.notes,
            performedBy: "Admin",
            createdAt: new Date().toISOString(),
          });
          break;
        }
      }
      prod.totalStock = prod.variants.reduce((acc, v) => acc + v.stock, 0);
    }

    setLocalData(STORAGE_KEYS.PRODUCTS, products);
    this.logAudit("INVENTORY", input.variantId, `Adjusted ${foundSku} (${foundProductName}) by ${input.delta > 0 ? `+${input.delta}` : input.delta} (${input.reason})`);
    return { success: true, newStock: updatedStock };
  }

  static getInventoryTransactions(): InventoryLedgerEntry[] {
    return getLocalData<InventoryLedgerEntry[]>(STORAGE_KEYS.INVENTORY_LOGS, []);
  }

  private static logInventoryTransaction(entry: InventoryLedgerEntry): void {
    const logs = this.getInventoryTransactions();
    logs.unshift(entry);
    setLocalData(STORAGE_KEYS.INVENTORY_LOGS, logs.slice(0, 100)); // retain last 100
  }

  // ----------------------------------------------------
  // 4. ORDER FULFILLMENT (/api/v1/admin/orders)
  // ----------------------------------------------------

  static getLocalOrders(): AdminOrder[] {
    return getLocalData<AdminOrder[]>(STORAGE_KEYS.ORDERS, SAMPLE_ADMIN_ORDERS as any);
  }

  static async getOrders(status?: string, search?: string): Promise<AdminOrder[]> {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.set("status", status);
    if (search) params.set("search", search);

    const res = await this.request<AdminOrder[]>(`/orders?${params.toString()}`);
    if (res.success && Array.isArray(res.data)) return res.data;

    let orders = this.getLocalOrders();
    if (status && status !== "ALL") {
      orders = orders.filter((o) => o.status === status);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      orders = orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q)
      );
    }
    return orders;
  }

  static async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    courier?: CourierInfo
  ): Promise<{ success: boolean; order?: AdminOrder }> {
    const res = await this.request<AdminOrder>(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, courier }),
    });
    if (res.success && res.data) return { success: true, order: res.data };

    const orders = this.getLocalOrders();
    const idx = orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
    if (idx === -1) return { success: false };

    orders[idx].status = status;
    if (courier) orders[idx].courier = courier;
    orders[idx].updatedAt = new Date().toISOString();

    setLocalData(STORAGE_KEYS.ORDERS, orders);
    this.logAudit("ORDER", orders[idx].orderNumber, `Fulfillment state changed to ${status}${courier ? ` with ${courier.carrierName} (${courier.trackingNumber})` : ""}`);
    return { success: true, order: orders[idx] };
  }

  // ----------------------------------------------------
  // 5. AUDIT LOGGING HELPER
  // ----------------------------------------------------

  static getAuditLogs(): AuditLogEntry[] {
    return getLocalData<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  private static logAudit(targetType: AuditLogEntry["targetType"], targetId: string, details: string): void {
    const logs = this.getAuditLogs();
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}`,
      adminName: "Admin User",
      adminEmail: "admin@store.com",
      action: details,
      targetType,
      targetId,
      details,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(entry);
    setLocalData(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 100));
  }

  // ----------------------------------------------------
  // 6. MODULE 01: USER HIERARCHY & RBAC MANAGEMENT
  // ----------------------------------------------------

  static getLocalUsers(): AdminManagedUser[] {
    const users = getLocalData<AdminManagedUser[]>(STORAGE_KEYS.USERS, []);
    if (!users || users.length === 0) {
      const initial = getInitialUsers();
      setLocalData(STORAGE_KEYS.USERS, initial);
      return initial;
    }
    return users;
  }

  /**
   * 4.1. Get Delegatable Permissions
   * Fetches the permissions the current logged-in user can assign to subordinates.
   * Endpoint: GET /api/v1/admin/users/permissions/delegatable
   */
  static async getDelegatablePermissions(): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: { permissions: ModulePermissionCode[] };
  }> {
    const res = await this.request<{ permissions: ModulePermissionCode[] }>("/users/permissions/delegatable");
    if (res.success && res.data && Array.isArray(res.data.permissions)) {
      return {
        success: true,
        statusCode: 200,
        message: res.message || "Delegatable permissions fetched successfully",
        data: res.data,
      };
    }

    // Smart Fallback
    const currentUser = useAuthStore.getState().user;
    const perms = getDelegatablePermsHelper(currentUser?.role);
    return {
      success: true,
      statusCode: 200,
      message: "Delegatable permissions fetched successfully",
      data: { permissions: perms },
    };
  }

  /**
   * 4.2. Create Subordinate User
   * Endpoint: POST /api/v1/admin/users
   */
  static async createUser(input: CreateSubordinateUserInput): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: { user: AdminManagedUser };
    error?: string;
  }> {
    const res = await this.request<{ user: AdminManagedUser }>("/users", {
      method: "POST",
      body: JSON.stringify(input),
    });

    if (res.success && res.data?.user) {
      const users = this.getLocalUsers();
      users.unshift(res.data.user);
      setLocalData(STORAGE_KEYS.USERS, users);
      this.logAudit("USER", res.data.user.id, `Created ${res.data.user.role} user (${res.data.user.name})`);
      return {
        success: true,
        statusCode: 201,
        message: res.message || `${input.role} user created successfully`,
        data: res.data,
      };
    }

    // If server returned a business error (e.g. 400, 403, 409), return it directly
    if (res.statusCode && res.statusCode >= 400) {
      return {
        success: false,
        statusCode: res.statusCode,
        error: res.error || "REQUEST_FAILED",
        message: res.message || "Failed to create user.",
      };
    }

    // Smart Local Fallback
    const currentUser = useAuthStore.getState().user;
    const currentRole = currentUser?.role || "SUPER_ADMIN";

    // Business Guard: Check role hierarchy
    if (!canCreateRole(currentRole, input.role)) {
      return {
        success: false,
        statusCode: 403,
        error: "FORBIDDEN_ROLE_CREATION",
        message: `Your role (${currentRole}) is not permitted to create a ${input.role}.`,
      };
    }

    // Validation Guard: Unique email check
    const users = this.getLocalUsers();
    if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      return {
        success: false,
        statusCode: 409,
        error: "USER_ALREADY_EXISTS",
        message: "Email is already registered.",
      };
    }

    // Business Guard: Delegation of permissions
    if (input.permissions && input.permissions.length > 0 && currentRole !== "SUPER_ADMIN") {
      const allowed = getDelegatablePermsHelper(currentRole);
      const invalid = input.permissions.filter((p) => !allowed.includes(p));
      if (invalid.length > 0) {
        return {
          success: false,
          statusCode: 403,
          error: "FORBIDDEN_PERMISSION_DELEGATION",
          message: "You cannot grant permissions you do not possess.",
        };
      }
    }

    const newUser: AdminManagedUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role,
      permissions: input.permissions || [],
      phone: input.phone?.trim() || undefined,
      isActive: true,
      createdById: currentUser?.id || "admin_super",
      creator: currentUser
        ? {
            id: currentUser.id,
            name: currentUser.name || "Administrator",
            role: (currentUser.role || "SUPER_ADMIN") as AdminRole,
          }
        : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.unshift(newUser);
    setLocalData(STORAGE_KEYS.USERS, users);
    this.logAudit("USER", newUser.id, `Created ${newUser.role} user (${newUser.name})`);

    return {
      success: true,
      statusCode: 201,
      message: `${input.role} user created successfully`,
      data: { user: newUser },
    };
  }

  /**
   * 4.3. List Users (Paginated with Search & Filters)
   * Endpoint: GET /api/v1/admin/users
   */
  static async getUsers(params?: UserListQueryParams): Promise<UsersListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.role) searchParams.set("role", params.role);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.isActive !== undefined) searchParams.set("isActive", String(params.isActive));

    const qs = searchParams.toString();
    const res = await this.request<AdminManagedUser[]>(`/users${qs ? `?${qs}` : ""}`);

    if (res.success && Array.isArray(res.data)) {
      return {
        success: true,
        statusCode: 200,
        message: res.message || "Users fetched successfully",
        data: res.data,
        pagination: (res as any).pagination || {
          page: params?.page || 1,
          limit: params?.limit || 20,
          total: res.data.length,
          totalPages: Math.max(1, Math.ceil(res.data.length / (params?.limit || 20))),
        },
      };
    }

    // Smart Local Fallback
    const allUsers = this.getLocalUsers();
    const currentUser = useAuthStore.getState().user;
    const currentRole = (currentUser?.role || "SUPER_ADMIN").toUpperCase();

    // 1. Hierarchical visibility:
    // SUPER_ADMIN: Full access
    // STORE_ADMIN: Staff and Customers (and themselves)
    // STAFF: Customers only (and themselves)
    let visible = allUsers.filter((u) => {
      if (currentRole === "SUPER_ADMIN") return true;
      if (currentRole === "STORE_ADMIN") {
        return u.role === "STAFF" || u.role === "CUSTOMER" || u.id === currentUser?.id;
      }
      if (currentRole === "STAFF") {
        return u.role === "CUSTOMER" || u.id === currentUser?.id;
      }
      return false;
    });

    // 2. Filter by role
    if (params?.role) {
      visible = visible.filter((u) => u.role === params.role);
    }

    // 3. Filter by search term
    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      visible = visible.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone && u.phone.toLowerCase().includes(q))
      );
    }

    // 4. Filter by isActive
    if (params?.isActive !== undefined) {
      visible = visible.filter((u) => u.isActive === params.isActive);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const total = visible.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIdx = (page - 1) * limit;
    const paginatedData = visible.slice(startIdx, startIdx + limit);

    return {
      success: true,
      statusCode: 200,
      message: "Users fetched successfully",
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * 4.4. Get Single User Details
   * Endpoint: GET /api/v1/admin/users/:id
   */
  static async getUserById(id: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: { user: AdminManagedUser };
    error?: string;
  }> {
    const res = await this.request<{ user: AdminManagedUser }>(`/users/${id}`);
    if (res.success && res.data?.user) {
      return {
        success: true,
        statusCode: 200,
        message: res.message || "User details fetched successfully",
        data: res.data,
      };
    }

    if (res.statusCode && res.statusCode >= 400) {
      return {
        success: false,
        statusCode: res.statusCode,
        error: res.error || "USER_NOT_FOUND",
        message: res.message || "User not found.",
      };
    }

    // Smart Local Fallback
    const users = this.getLocalUsers();
    const user = users.find((u) => u.id === id);
    if (!user) {
      return {
        success: false,
        statusCode: 404,
        error: "USER_NOT_FOUND",
        message: "User ID does not exist in database.",
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "User details fetched successfully",
      data: { user },
    };
  }

  /**
   * 4.5. Update Subordinate User
   * Endpoint: PUT /api/v1/admin/users/:id
   */
  static async updateUser(
    id: string,
    input: UpdateSubordinateUserInput
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: { user: AdminManagedUser };
    error?: string;
  }> {
    const res = await this.request<{ user: AdminManagedUser }>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });

    if (res.success && res.data?.user) {
      const users = this.getLocalUsers();
      const idx = users.findIndex((u) => u.id === id);
      if (idx !== -1) {
        users[idx] = res.data.user;
        setLocalData(STORAGE_KEYS.USERS, users);
      }
      this.logAudit("USER", id, `Updated subordinate user profile (${res.data.user.name})`);
      return {
        success: true,
        statusCode: 200,
        message: res.message || "User updated successfully",
        data: res.data,
      };
    }

    if (res.statusCode && res.statusCode >= 400) {
      return {
        success: false,
        statusCode: res.statusCode,
        error: res.error || "REQUEST_FAILED",
        message: res.message || "Failed to update user.",
      };
    }

    // Smart Local Fallback
    const users = this.getLocalUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      return {
        success: false,
        statusCode: 404,
        error: "USER_NOT_FOUND",
        message: "User ID does not exist in database.",
      };
    }

    const targetUser = users[idx];
    const currentUser = useAuthStore.getState().user;
    const currentRole = currentUser?.role || "SUPER_ADMIN";

    // Business Guard: Can actor edit target?
    if (targetUser.id !== currentUser?.id && !canManageUser(currentRole, targetUser.role)) {
      return {
        success: false,
        statusCode: 403,
        error: "FORBIDDEN_NOT_ADMIN",
        message: "You cannot edit an account with an equal or higher role than your own.",
      };
    }

    // Business Guard: Permission delegation
    if (input.permissions && input.permissions.length > 0 && currentRole !== "SUPER_ADMIN") {
      const allowed = getDelegatablePermsHelper(currentRole);
      const invalid = input.permissions.filter((p) => !allowed.includes(p));
      if (invalid.length > 0) {
        return {
          success: false,
          statusCode: 403,
          error: "FORBIDDEN_PERMISSION_DELEGATION",
          message: "You cannot grant permissions you do not possess.",
        };
      }
    }

    const updatedUser: AdminManagedUser = {
      ...targetUser,
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.phone !== undefined && { phone: input.phone?.trim() }),
      ...(input.permissions !== undefined && { permissions: input.permissions }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      updatedAt: new Date().toISOString(),
    };

    users[idx] = updatedUser;
    setLocalData(STORAGE_KEYS.USERS, users);
    this.logAudit("USER", id, `Updated subordinate user (${updatedUser.name})`);

    return {
      success: true,
      statusCode: 200,
      message: "User updated successfully",
      data: { user: updatedUser },
    };
  }

  /**
   * 4.6. Activate / Deactivate User Status
   * Endpoint: PATCH /api/v1/admin/users/:id/status
   */
  static async updateUserStatus(
    id: string,
    isActive: boolean
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: { user: AdminManagedUser };
    error?: string;
  }> {
    const currentUser = useAuthStore.getState().user;
    const currentRole = currentUser?.role || "SUPER_ADMIN";

    // Immediate Client-Side Guard: Self-deactivation
    if (currentUser?.id === id && !isActive) {
      return {
        success: false,
        statusCode: 400,
        error: "CANNOT_DEACTIVATE_SELF",
        message: "You cannot deactivate your own account.",
      };
    }

    const res = await this.request<{ user: AdminManagedUser }>(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });

    if (res.success && res.data?.user) {
      const users = this.getLocalUsers();
      const idx = users.findIndex((u) => u.id === id);
      if (idx !== -1) {
        users[idx] = res.data.user;
        setLocalData(STORAGE_KEYS.USERS, users);
      }
      this.logAudit("USER", id, `${isActive ? "Activated" : "Deactivated"} user account`);
      return {
        success: true,
        statusCode: 200,
        message: res.message || (isActive ? "User activated successfully" : "User deactivated successfully"),
        data: res.data,
      };
    }

    if (res.statusCode && res.statusCode >= 400) {
      return {
        success: false,
        statusCode: res.statusCode,
        error: res.error || "REQUEST_FAILED",
        message: res.message || "Failed to update user status.",
      };
    }

    // Smart Local Fallback
    const users = this.getLocalUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      return {
        success: false,
        statusCode: 404,
        error: "USER_NOT_FOUND",
        message: "User ID does not exist in database.",
      };
    }

    const targetUser = users[idx];
    const deactCheck = canDeactivateUser(currentUser?.id, targetUser.id, currentRole, targetUser.role);
    if (!deactCheck.allowed) {
      return {
        success: false,
        statusCode: 403,
        error: "FORBIDDEN_NOT_ADMIN",
        message: deactCheck.reason || "Action not permitted on this account.",
      };
    }

    targetUser.isActive = isActive;
    targetUser.updatedAt = new Date().toISOString();
    users[idx] = targetUser;
    setLocalData(STORAGE_KEYS.USERS, users);

    this.logAudit("USER", id, `${isActive ? "Activated" : "Deactivated"} user (${targetUser.name})`);

    return {
      success: true,
      statusCode: 200,
      message: isActive ? "User activated successfully" : "User deactivated successfully",
      data: { user: targetUser },
    };
  }
}
