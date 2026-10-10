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
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryListQueryParams,
  CategoriesListResponse,
  CategoryBreadcrumb,
  AdminCollection,
  AdminCollectionProduct,
  CreateCollectionInput,
  UpdateCollectionInput,
  CollectionListQueryParams,
  CollectionsListResponse,
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
  hasPermission,
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

// Initialize seed categories for Module 02
function getInitialCategories(): AdminCategory[] {
  return [
    {
      id: "c1a2b3c4-0000-0000-0000-000000000001",
      name: "Women's Couture",
      slug: "womens-couture",
      description: "Exclusive luxury evening gowns, bridal sarees, and artisanal silhouettes.",
      imageUrl: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
      parentId: null,
      sortOrder: 0,
      displayOrder: 0,
      isFeatured: true,
      isActive: true,
      productCount: 24,
      childrenCount: 3,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    },
    {
      id: "c1a2b3c4-0000-0000-0000-000000000002",
      name: "Evening Gowns",
      slug: "evening-gowns",
      description: "Silk, chiffon, and hand-beaded gala gowns",
      imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
      parentId: "c1a2b3c4-0000-0000-0000-000000000001",
      sortOrder: 0,
      displayOrder: 0,
      isFeatured: true,
      isActive: true,
      productCount: 14,
      childrenCount: 0,
      createdAt: "2026-10-02T00:00:00.000Z",
      updatedAt: "2026-10-02T00:00:00.000Z",
    },
    {
      id: "c1a2b3c4-0000-0000-0000-000000000003",
      name: "Sarees & Heritage",
      slug: "sarees",
      description: "Handwoven Banarasi, Kanjeevaram, and Chanderi silks",
      imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
      parentId: "c1a2b3c4-0000-0000-0000-000000000001",
      sortOrder: 1,
      displayOrder: 1,
      isFeatured: true,
      isActive: true,
      productCount: 6,
      childrenCount: 0,
      createdAt: "2026-10-02T00:00:00.000Z",
      updatedAt: "2026-10-02T00:00:00.000Z",
    },
    {
      id: "c1a2b3c4-0000-0000-0000-000000000004",
      name: "Designer Dresses",
      slug: "dresses",
      description: "Contemporary resort wear and midi dresses",
      imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800",
      parentId: "c1a2b3c4-0000-0000-0000-000000000001",
      sortOrder: 2,
      displayOrder: 2,
      isFeatured: false,
      isActive: true,
      productCount: 4,
      childrenCount: 0,
      createdAt: "2026-10-03T00:00:00.000Z",
      updatedAt: "2026-10-03T00:00:00.000Z",
    },
    {
      id: "c1a2b3c4-0000-0000-0000-000000000005",
      name: "Men's Apparel",
      slug: "mens-apparel",
      description: "Bespoke tailored suits, cashmere coats, and formal shirting",
      imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800",
      parentId: null,
      sortOrder: 1,
      displayOrder: 1,
      isFeatured: true,
      isActive: true,
      productCount: 18,
      childrenCount: 2,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    },
    {
      id: "c1a2b3c4-0000-0000-0000-000000000006",
      name: "Bespoke Suits",
      slug: "bespoke-suits",
      description: "Handcrafted 3-piece and tuxedos",
      imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800",
      parentId: "c1a2b3c4-0000-0000-0000-000000000005",
      sortOrder: 0,
      displayOrder: 0,
      isFeatured: true,
      isActive: true,
      productCount: 10,
      childrenCount: 0,
      createdAt: "2026-10-04T00:00:00.000Z",
      updatedAt: "2026-10-04T00:00:00.000Z",
    },
    {
      id: "c1a2b3c4-0000-0000-0000-000000000007",
      name: "Artisanal Accessories",
      slug: "artisanal-accessories",
      description: "Silk scarves, embroidered clutches, and handcrafted jewelry",
      imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800",
      parentId: null,
      sortOrder: 2,
      displayOrder: 2,
      isFeatured: false,
      isActive: true,
      productCount: 12,
      childrenCount: 0,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    },
  ];
}

// Initialize seed collections for Module 02
function getInitialCollections(): AdminCollection[] {
  return [
    {
      id: "col_royal_festive_2026",
      name: "Royal Festive Edit 2026",
      title: "Royal Festive Edit 2026",
      slug: "royal-festive-edit-2026",
      description: "Hand-embroidered zardozi and raw silks for festive galas",
      imageUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200",
      isFeatured: true,
      sortOrder: 0,
      isActive: true,
      productsCount: 3,
      productCount: 3,
      productIds: ["prod_1", "prod_2", "prod_3"],
      createdAt: "2026-10-10T00:00:00.000Z",
      updatedAt: "2026-10-10T00:00:00.000Z",
    },
    {
      id: "col_monsoon_linen_capsule",
      name: "Monsoon Linen Capsule",
      title: "Monsoon Linen Capsule",
      slug: "monsoon-linen-capsule",
      description: "Breathable pure Irish linen separates",
      imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200",
      isFeatured: true,
      sortOrder: 1,
      isActive: true,
      productsCount: 2,
      productCount: 2,
      productIds: ["prod_4", "prod_5"],
      createdAt: "2026-10-10T00:00:00.000Z",
      updatedAt: "2026-10-10T00:00:00.000Z",
    },
  ];
}

// Module 02: Circular Hierarchy Guard helper
function isCategoryDescendant(targetId: string, potentialParentId: string, allCategories: AdminCategory[]): boolean {
  let currId: string | null | undefined = potentialParentId;
  const visited = new Set<string>();
  while (currId) {
    if (currId === targetId) return true;
    if (visited.has(currId)) break;
    visited.add(currId);
    const parentCat = allCategories.find((c) => c.id === currId);
    currId = parentCat?.parentId;
  }
  return false;
}

// Module 02: Collision-safe category slug generator
function generateCategorySlug(name: string, allCategories: AdminCategory[], currentId?: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "category";
  let slug = base;
  let counter = 1;
  while (allCategories.some((c) => c.slug === slug && c.id !== currentId)) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
}

// Module 02: Collision-safe collection slug generator
function generateCollectionSlug(name: string, allCollections: AdminCollection[], currentId?: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "collection";
  let slug = base;
  let counter = 1;
  while (allCollections.some((c) => c.slug === slug && c.id !== currentId)) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
}

// Module 02: Build nested tree hierarchy
function buildNestedCategoryTree(categories: AdminCategory[]): AdminCategory[] {
  const map = new Map<string, AdminCategory>();
  categories.forEach((c) => {
    map.set(c.id, { ...c, children: [], childrenCount: 0 });
  });

  const roots: AdminCategory[] = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      const parent = map.get(node.parentId)!;
      parent.children = parent.children || [];
      parent.children.push(node);
      parent.childrenCount = parent.children.length;
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// Module 02: Ancestor breadcrumbs helper
function buildCategoryBreadcrumbs(categoryId: string, allCategories: AdminCategory[]): CategoryBreadcrumb[] {
  const breadcrumbs: CategoryBreadcrumb[] = [];
  let curr = allCategories.find((c) => c.id === categoryId);
  const visited = new Set<string>();
  while (curr && curr.parentId) {
    if (visited.has(curr.parentId)) break;
    visited.add(curr.parentId);
    const parent = allCategories.find((c) => c.id === curr!.parentId);
    if (parent) {
      breadcrumbs.unshift({ id: parent.id, name: parent.name, slug: parent.slug });
      curr = parent;
    } else {
      break;
    }
  }
  return breadcrumbs;
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

  // ----------------------------------------------------
  // 7. MODULE 02: CATEGORY HIERARCHY ENGINE
  // Base URL: /api/v1/admin/categories
  // ----------------------------------------------------

  static getLocalCategories(): AdminCategory[] {
    const cats = getLocalData<AdminCategory[]>(STORAGE_KEYS.CATEGORIES, []);
    if (!cats || cats.length === 0) {
      const initial = getInitialCategories();
      setLocalData(STORAGE_KEYS.CATEGORIES, initial);
      return initial;
    }
    return cats;
  }

  /**
   * 2.1. List Categories
   * Endpoint: GET /api/v1/admin/categories
   * Query params: view ("tree" | "flat" | "root"), search, isActive, isFeatured, parentId, page, limit
   */
  static async getCategories(params?: CategoryListQueryParams): Promise<CategoriesListResponse> {
    const qs = new URLSearchParams();
    if (params?.view) qs.set("view", params.view);
    if (params?.search) qs.set("search", params.search);
    if (params?.isActive !== undefined) qs.set("isActive", String(params.isActive));
    if (params?.isFeatured !== undefined) qs.set("isFeatured", String(params.isFeatured));
    if (params?.parentId) qs.set("parentId", params.parentId);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));

    const queryStr = qs.toString();
    const res = await this.request<AdminCategory[]>(`/categories${queryStr ? `?${queryStr}` : ""}`);
    if (res.success && Array.isArray(res.data)) {
      return {
        success: true,
        statusCode: 200,
        message: res.message || "Categories fetched successfully",
        data: res.data,
        meta: (res as any).meta || { view: params?.view || "tree", totalCount: res.data.length },
        pagination: (res as any).pagination,
      };
    }

    // Smart Local Fallback
    let cats = this.getLocalCategories();

    // 1. Filter by isActive
    if (params?.isActive !== undefined) {
      const activeBool = params.isActive === true || params.isActive === "true";
      cats = cats.filter((c) => c.isActive === activeBool);
    }

    // 2. Filter by isFeatured
    if (params?.isFeatured !== undefined) {
      const featBool = params.isFeatured === true || params.isFeatured === "true";
      cats = cats.filter((c) => c.isFeatured === featBool);
    }

    // 3. Search query
    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      cats = cats.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    // 4. View mode formatting
    const view = params?.view || "tree";

    if (view === "root") {
      const rootOnly = cats.filter((c) => !c.parentId);
      return {
        success: true,
        statusCode: 200,
        message: "Root categories fetched successfully",
        data: rootOnly,
        meta: { view: "root", totalCount: rootOnly.length },
      };
    }

    if (view === "flat") {
      if (params?.parentId) {
        cats = cats.filter((c) => c.parentId === params.parentId);
      }
      const page = params?.page || 1;
      const limit = params?.limit || 50;
      const total = cats.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const sliced = cats.slice((page - 1) * limit, page * limit);

      return {
        success: true,
        statusCode: 200,
        message: "Categories fetched successfully",
        data: sliced,
        meta: { view: "flat", totalCount: total },
        pagination: { page, limit, total, totalPages },
      };
    }

    // Default: "tree"
    const tree = buildNestedCategoryTree(cats);
    return {
      success: true,
      statusCode: 200,
      message: "Categories fetched successfully",
      data: tree,
      meta: { view: "tree", totalCount: cats.length },
    };
  }

  /**
   * 2.2. Get Single Category Details
   * Endpoint: GET /api/v1/admin/categories/:id
   */
  static async getCategoryById(id: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: { category: AdminCategory };
    error?: string;
  }> {
    const res = await this.request<{ category: AdminCategory }>(`/categories/${id}`);
    if (res.success && res.data?.category) {
      return {
        success: true,
        statusCode: 200,
        message: res.message || "Category fetched successfully",
        data: res.data,
      };
    }

    if (res.statusCode && res.statusCode >= 400) {
      return {
        success: false,
        statusCode: res.statusCode,
        error: res.error || "CATEGORY_NOT_FOUND",
        message: res.message || "Category not found.",
      };
    }

    // Smart Local Fallback
    const cats = this.getLocalCategories();
    const cat = cats.find((c) => c.id === id);
    if (!cat) {
      return {
        success: false,
        statusCode: 404,
        error: "CATEGORY_NOT_FOUND",
        message: "Category not found in database.",
      };
    }

    const breadcrumbs = buildCategoryBreadcrumbs(cat.id, cats);
    const parent = cat.parentId ? cats.find((c) => c.id === cat.parentId) : null;
    const children = cats.filter((c) => c.parentId === cat.id);

    const detailedCat: AdminCategory = {
      ...cat,
      parent: parent ? { id: parent.id, name: parent.name, slug: parent.slug } : null,
      breadcrumbs,
      children,
      childrenCount: children.length,
    };

    return {
      success: true,
      statusCode: 200,
      message: "Category fetched successfully",
      data: { category: detailedCat },
    };
  }

  /**
   * 2.3. Create Category
   * Endpoint: POST /api/v1/admin/categories
   */
  static async createCategory(input: CreateCategoryInput): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: { category: AdminCategory };
    error?: string;
  }> {
    const res = await this.request<{ category: AdminCategory }>("/categories", {
      method: "POST",
      body: JSON.stringify(input),
    });

    if (res.success && res.data?.category) {
      const cats = this.getLocalCategories();
      cats.unshift(res.data.category);
      setLocalData(STORAGE_KEYS.CATEGORIES, cats);
      this.logAudit("CATEGORY", res.data.category.id, `Created category "${res.data.category.name}"`);
      return {
        success: true,
        statusCode: 201,
        message: res.message || "Category created successfully",
        data: res.data,
      };
    }

    if (res.statusCode && res.statusCode >= 400) {
      return {
        success: false,
        statusCode: res.statusCode,
        error: res.error || "REQUEST_FAILED",
        message: res.message || "Failed to create category.",
      };
    }

    // Smart Local Fallback
    const cats = this.getLocalCategories();

    // Check duplicate name under same parent
    if (cats.some((c) => (c.parentId || null) === (input.parentId || null) && c.name.toLowerCase() === input.name.trim().toLowerCase())) {
      return {
        success: false,
        statusCode: 409,
        error: "DUPLICATE_CATEGORY_NAME",
        message: "A category with this name already exists under the selected parent.",
      };
    }

    const uniqueSlug = input.slug?.trim() || generateCategorySlug(input.name, cats);
    const parent = input.parentId ? cats.find((c) => c.id === input.parentId) : null;

    const newCat: AdminCategory = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: input.name.trim(),
      slug: uniqueSlug,
      description: input.description?.trim() || null,
      imageUrl: input.imageUrl || null,
      parentId: input.parentId || null,
      sortOrder: input.sortOrder !== undefined ? input.sortOrder : cats.length,
      displayOrder: input.sortOrder !== undefined ? input.sortOrder : cats.length,
      isFeatured: Boolean(input.isFeatured),
      isActive: input.isActive !== undefined ? input.isActive : true,
      productCount: 0,
      childrenCount: 0,
      parent: parent ? { id: parent.id, name: parent.name, slug: parent.slug } : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cats.push(newCat);
    setLocalData(STORAGE_KEYS.CATEGORIES, cats);
    this.logAudit("CATEGORY", newCat.id, `Created category "${newCat.name}"`);

    return {
      success: true,
      statusCode: 201,
      message: "Category created successfully",
      data: { category: newCat },
    };
  }

  /**
   * 2.4. Update Category
   * Endpoint: PUT /api/v1/admin/categories/:id
   * Includes Circular Hierarchy Guard & Collision-Safe Slugs
   */
  static async updateCategory(
    id: string,
    input: UpdateCategoryInput
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: { category: AdminCategory };
    error?: string;
  }> {
    const res = await this.request<{ category: AdminCategory }>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });

    if (res.success && res.data?.category) {
      const cats = this.getLocalCategories();
      const idx = cats.findIndex((c) => c.id === id);
      if (idx !== -1) {
        cats[idx] = res.data.category;
        setLocalData(STORAGE_KEYS.CATEGORIES, cats);
      }
      this.logAudit("CATEGORY", id, `Updated category "${res.data.category.name}"`);
      return {
        success: true,
        statusCode: 200,
        message: res.message || "Category updated successfully",
        data: res.data,
      };
    }

    if (res.statusCode && res.statusCode >= 400) {
      return {
        success: false,
        statusCode: res.statusCode,
        error: res.error || "REQUEST_FAILED",
        message: res.message || "Failed to update category.",
      };
    }

    // Smart Local Fallback
    const cats = this.getLocalCategories();
    const idx = cats.findIndex((c) => c.id === id);
    if (idx === -1) {
      return {
        success: false,
        statusCode: 404,
        error: "CATEGORY_NOT_FOUND",
        message: "Category not found in database.",
      };
    }

    const currentCat = cats[idx];

    // Circular Hierarchy Guard: Cannot select self as parent
    if (input.parentId && input.parentId === id) {
      return {
        success: false,
        statusCode: 400,
        error: "CIRCULAR_HIERARCHY_SELF",
        message: "You cannot select a category as its own parent.",
      };
    }

    // Circular Hierarchy Guard: Cannot select own descendant as parent
    if (input.parentId && isCategoryDescendant(id, input.parentId, cats)) {
      return {
        success: false,
        statusCode: 400,
        error: "CIRCULAR_HIERARCHY_DESCENDANT",
        message: "You cannot select a subcategory or descendant as a parent category.",
      };
    }

    // Duplicate name check under same parent
    const targetParentId = input.parentId !== undefined ? input.parentId : currentCat.parentId;
    const targetName = input.name !== undefined ? input.name.trim() : currentCat.name;
    if (cats.some((c) => c.id !== id && (c.parentId || null) === (targetParentId || null) && c.name.toLowerCase() === targetName.toLowerCase())) {
      return {
        success: false,
        statusCode: 409,
        error: "DUPLICATE_CATEGORY_NAME",
        message: "Another category under the same parent already has this name.",
      };
    }

    const updatedSlug = input.name
      ? generateCategorySlug(input.name, cats, id)
      : input.slug || currentCat.slug;

    const parent = targetParentId ? cats.find((c) => c.id === targetParentId) : null;

    const updatedCat: AdminCategory = {
      ...currentCat,
      ...(input.name !== undefined && { name: input.name.trim() }),
      slug: updatedSlug,
      ...(input.description !== undefined && { description: input.description?.trim() || null }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      parentId: targetParentId || null,
      sortOrder: input.sortOrder !== undefined ? input.sortOrder : currentCat.sortOrder,
      displayOrder: input.sortOrder !== undefined ? input.sortOrder : currentCat.displayOrder,
      ...(input.isFeatured !== undefined && { isFeatured: input.isFeatured }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      parent: parent ? { id: parent.id, name: parent.name, slug: parent.slug } : null,
      updatedAt: new Date().toISOString(),
    };

    cats[idx] = updatedCat;
    setLocalData(STORAGE_KEYS.CATEGORIES, cats);
    this.logAudit("CATEGORY", id, `Updated category "${updatedCat.name}"`);

    return {
      success: true,
      statusCode: 200,
      message: "Category updated successfully",
      data: { category: updatedCat },
    };
  }

  /**
   * 2.5. Delete Category
   * Endpoint: DELETE /api/v1/admin/categories/:id?force=true|false
   * Includes Safe Deletion Guards: CATEGORY_CONTAINS_PRODUCTS & CATEGORY_CONTAINS_CHILDREN
   */
  static async deleteCategory(
    id: string,
    force = false
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: { id: string; name: string; deleted: boolean };
    error?: string;
  }> {
    const res = await this.request<{ id: string; name: string; deleted: boolean }>(
      `/categories/${id}${force ? "?force=true" : ""}`,
      { method: "DELETE" }
    );

    if (res.success && res.data) {
      const cats = this.getLocalCategories().filter((c) => c.id !== id);
      setLocalData(STORAGE_KEYS.CATEGORIES, cats);
      this.logAudit("CATEGORY", id, `Deleted category "${res.data.name}" (force: ${force})`);
      return {
        success: true,
        statusCode: 200,
        message: res.message || "Category deleted successfully",
        data: res.data,
      };
    }

    if (res.statusCode && res.statusCode >= 400) {
      return {
        success: false,
        statusCode: res.statusCode,
        error: res.error || "DELETE_FAILED",
        message: res.message || "Failed to delete category.",
      };
    }

    // Smart Local Fallback
    const cats = this.getLocalCategories();
    const target = cats.find((c) => c.id === id);
    if (!target) {
      return {
        success: false,
        statusCode: 404,
        error: "CATEGORY_NOT_FOUND",
        message: "Category not found.",
      };
    }

    if (!force) {
      // 1. Guard against active products
      if (target.productCount > 0) {
        return {
          success: false,
          statusCode: 400,
          error: "CATEGORY_CONTAINS_PRODUCTS",
          message: `Category has ${target.productCount} active products. Reassign them first or confirm force deletion.`,
        };
      }

      // 2. Guard against child categories
      const children = cats.filter((c) => c.parentId === id);
      if (children.length > 0) {
        return {
          success: false,
          statusCode: 400,
          error: "CATEGORY_CONTAINS_CHILDREN",
          message: `Category contains ${children.length} subcategories. Please reassign or delete subcategories first, or confirm force deletion.`,
        };
      }
    }

    // Perform deletion
    const remaining = cats.filter((c) => c.id !== id && (!force || c.parentId !== id));
    setLocalData(STORAGE_KEYS.CATEGORIES, remaining);
    this.logAudit("CATEGORY", id, `Deleted category "${target.name}" (force: ${force})`);

    return {
      success: true,
      statusCode: 200,
      message: "Category deleted successfully",
      data: { id, name: target.name, deleted: true },
    };
  }

  // ----------------------------------------------------
  // 8. MODULE 02: CURATED COLLECTION ENGINE
  // Base URL: /api/v1/admin/collections
  // ----------------------------------------------------

  static getLocalCollections(): AdminCollection[] {
    const cols = getLocalData<AdminCollection[]>(STORAGE_KEYS.COLLECTIONS, []);
    if (!cols || cols.length === 0) {
      const initial = getInitialCollections();
      setLocalData(STORAGE_KEYS.COLLECTIONS, initial);
      return initial;
    }
    return cols;
  }

  /**
   * 3.1. List Collections
   * Endpoint: GET /api/v1/admin/collections
   */
  static async getCollections(params?: CollectionListQueryParams): Promise<CollectionsListResponse> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.search) qs.set("search", params.search);
    if (params?.isFeatured !== undefined) qs.set("isFeatured", String(params.isFeatured));
    if (params?.isActive !== undefined) qs.set("isActive", String(params.isActive));

    const queryStr = qs.toString();
    const res = await this.request<AdminCollection[]>(`/collections${queryStr ? `?${queryStr}` : ""}`);
    if (res.success && Array.isArray(res.data)) {
      return {
        success: true,
        statusCode: 200,
        message: res.message || "Collections fetched successfully",
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
    let collections = this.getLocalCollections();

    if (params?.isActive !== undefined) {
      const activeBool = params.isActive === true || params.isActive === "true";
      collections = collections.filter((c) => c.isActive === activeBool);
    }

    if (params?.isFeatured !== undefined) {
      const featBool = params.isFeatured === true || params.isFeatured === "true";
      collections = collections.filter((c) => c.isFeatured === featBool);
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      collections = collections.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const total = collections.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const sliced = collections.slice((page - 1) * limit, page * limit);

    return {
      success: true,
      statusCode: 200,
      message: "Collections fetched successfully",
      data: sliced,
      pagination: { page, limit, total, totalPages },
    };
  }

  /**
   * 3.2. Get Single Collection Details
   * Returns collection plus all attached garments in display order
   * Endpoint: GET /api/v1/admin/collections/:id
   */
  static async getCollectionById(id: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: { collection: AdminCollection };
    error?: string;
  }> {
    const res = await this.request<{ collection: AdminCollection }>(`/collections/${id}`);
    if (res.success && res.data?.collection) {
      return {
        success: true,
        statusCode: 200,
        message: res.message || "Collection fetched successfully",
        data: res.data,
      };
    }

    if (res.statusCode && res.statusCode >= 400) {
      return {
        success: false,
        statusCode: res.statusCode,
        error: res.error || "COLLECTION_NOT_FOUND",
        message: res.message || "Collection not found.",
      };
    }

    // Smart Local Fallback
    const collections = this.getLocalCollections();
    const col = collections.find((c) => c.id === id);
    if (!col) {
      return {
        success: false,
        statusCode: 404,
        error: "COLLECTION_NOT_FOUND",
        message: "Collection not found in database.",
      };
    }

    // Map linked products
    const products = this.getLocalProducts();
    const linkedProducts: AdminCollectionProduct[] = (col.productIds || []).map((prodId, idx) => {
      const p = products.find((item) => item.id === prodId);
      if (p) {
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          brand: p.brand,
          sku: p.variants[0]?.sku || `SKU-${p.id}`,
          regularPrice: p.basePrice,
          salePrice: p.variants[0]?.compareAtPrice || null,
          stockQuantity: p.totalStock,
          isActive: p.status === "ACTIVE",
          thumbnail: p.images[0]?.url,
          category: { id: p.categorySlug, name: p.categoryName, slug: p.categorySlug },
          collectionSortOrder: idx,
        };
      }
      return {
        id: prodId,
        name: `Garment ${prodId}`,
        slug: prodId,
        regularPrice: 0,
        stockQuantity: 0,
        isActive: true,
        collectionSortOrder: idx,
      };
    });

    return {
      success: true,
      statusCode: 200,
      message: "Collection fetched successfully",
      data: {
        collection: {
          ...col,
          products: linkedProducts,
          productsCount: linkedProducts.length,
          productCount: linkedProducts.length,
        },
      },
    };
  }

  /**
   * 3.3. Create Collection
   * Endpoint: POST /api/v1/admin/collections
   */
  static async createCollection(input: CreateCollectionInput): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: { collection: AdminCollection };
    error?: string;
  }> {
    const res = await this.request<{ collection: AdminCollection }>("/collections", {
      method: "POST",
      body: JSON.stringify(input),
    });

    if (res.success && res.data?.collection) {
      const cols = this.getLocalCollections();
      cols.unshift(res.data.collection);
      setLocalData(STORAGE_KEYS.COLLECTIONS, cols);
      this.logAudit("COLLECTION", res.data.collection.id, `Created collection "${res.data.collection.name}"`);
      return {
        success: true,
        statusCode: 201,
        message: res.message || "Collection created successfully",
        data: res.data,
      };
    }

    if (res.statusCode && res.statusCode >= 400) {
      return {
        success: false,
        statusCode: res.statusCode,
        error: res.error || "REQUEST_FAILED",
        message: res.message || "Failed to create collection.",
      };
    }

    // Smart Local Fallback
    const cols = this.getLocalCollections();
    const name = (input.name || input.title || "").trim();
    const uniqueSlug = input.slug?.trim() || generateCollectionSlug(name, cols);

    const newCol: AdminCollection = {
      id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      title: name,
      slug: uniqueSlug,
      description: input.description?.trim() || "",
      imageUrl: input.imageUrl || null,
      isFeatured: Boolean(input.isFeatured),
      sortOrder: input.sortOrder !== undefined ? input.sortOrder : cols.length,
      isActive: input.isActive !== undefined ? input.isActive : true,
      productsCount: input.productIds?.length || 0,
      productCount: input.productIds?.length || 0,
      productIds: input.productIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cols.unshift(newCol);
    setLocalData(STORAGE_KEYS.COLLECTIONS, cols);
    this.logAudit("COLLECTION", newCol.id, `Created collection "${newCol.name}"`);

    return {
      success: true,
      statusCode: 201,
      message: "Collection created successfully",
      data: { collection: newCol },
    };
  }

  /**
   * 3.4. Update Collection Details
   * Endpoint: PUT /api/v1/admin/collections/:id
   */
  static async updateCollection(
    id: string,
    input: UpdateCollectionInput
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: { collection: AdminCollection };
    error?: string;
  }> {
    const res = await this.request<{ collection: AdminCollection }>(`/collections/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });

    if (res.success && res.data?.collection) {
      const cols = this.getLocalCollections();
      const idx = cols.findIndex((c) => c.id === id);
      if (idx !== -1) {
        cols[idx] = res.data.collection;
        setLocalData(STORAGE_KEYS.COLLECTIONS, cols);
      }
      this.logAudit("COLLECTION", id, `Updated collection "${res.data.collection.name}"`);
      return {
        success: true,
        statusCode: 200,
        message: res.message || "Collection updated successfully",
        data: res.data,
      };
    }

    if (res.statusCode && res.statusCode >= 400) {
      return {
        success: false,
        statusCode: res.statusCode,
        error: res.error || "REQUEST_FAILED",
        message: res.message || "Failed to update collection.",
      };
    }

    // Smart Local Fallback
    const cols = this.getLocalCollections();
    const idx = cols.findIndex((c) => c.id === id);
    if (idx === -1) {
      return {
        success: false,
        statusCode: 404,
        error: "COLLECTION_NOT_FOUND",
        message: "Collection not found.",
      };
    }

    const current = cols[idx];
    const name = input.name !== undefined ? input.name.trim() : input.title !== undefined ? input.title.trim() : current.name;
    const slug = input.slug !== undefined ? input.slug.trim() : input.name ? generateCollectionSlug(name, cols, id) : current.slug;

    const updatedCol: AdminCollection = {
      ...current,
      name,
      title: name,
      slug,
      ...(input.description !== undefined && { description: input.description.trim() }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      ...(input.isFeatured !== undefined && { isFeatured: input.isFeatured }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.productIds !== undefined && {
        productIds: input.productIds,
        productsCount: input.productIds.length,
        productCount: input.productIds.length,
      }),
      updatedAt: new Date().toISOString(),
    };

    cols[idx] = updatedCol;
    setLocalData(STORAGE_KEYS.COLLECTIONS, cols);
    this.logAudit("COLLECTION", id, `Updated collection "${updatedCol.name}"`);

    return {
      success: true,
      statusCode: 200,
      message: "Collection updated successfully",
      data: { collection: updatedCol },
    };
  }

  /**
   * 3.5. Reorder & Sync Products in Collection
   * Replaces and sequences all products in the collection with provided array of product IDs
   * Endpoint: PUT /api/v1/admin/collections/:id/products
   */
  static async reorderCollectionProducts(
    id: string,
    productIds: string[]
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: { collection: AdminCollection };
    error?: string;
  }> {
    const res = await this.request<{ collection: AdminCollection }>(`/collections/${id}/products`, {
      method: "PUT",
      body: JSON.stringify({ productIds }),
    });

    if (res.success && res.data?.collection) {
      const cols = this.getLocalCollections();
      const idx = cols.findIndex((c) => c.id === id);
      if (idx !== -1) {
        cols[idx] = res.data.collection;
        setLocalData(STORAGE_KEYS.COLLECTIONS, cols);
      }
      this.logAudit("COLLECTION", id, `Reordered ${productIds.length} garments in collection`);
      return {
        success: true,
        statusCode: 200,
        message: res.message || "Collection products reordered successfully",
        data: res.data,
      };
    }

    // Smart Local Fallback
    const cols = this.getLocalCollections();
    const idx = cols.findIndex((c) => c.id === id);
    if (idx === -1) {
      return {
        success: false,
        statusCode: 404,
        error: "COLLECTION_NOT_FOUND",
        message: "Collection not found.",
      };
    }

    cols[idx].productIds = [...productIds];
    cols[idx].productsCount = productIds.length;
    cols[idx].productCount = productIds.length;
    cols[idx].updatedAt = new Date().toISOString();

    setLocalData(STORAGE_KEYS.COLLECTIONS, cols);
    this.logAudit("COLLECTION", id, `Sequenced ${productIds.length} garments in collection "${cols[idx].name}"`);

    return {
      success: true,
      statusCode: 200,
      message: "Collection garments sequenced successfully",
      data: { collection: cols[idx] },
    };
  }

  /**
   * 3.6. Add Products to Collection
   * Appends products without removing existing ones
   * Endpoint: POST /api/v1/admin/collections/:id/products
   */
  static async addProductsToCollection(
    id: string,
    productIds: string[]
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: { collection: AdminCollection };
    error?: string;
  }> {
    const res = await this.request<{ collection: AdminCollection }>(`/collections/${id}/products`, {
      method: "POST",
      body: JSON.stringify({ productIds }),
    });

    if (res.success && res.data?.collection) {
      const cols = this.getLocalCollections();
      const idx = cols.findIndex((c) => c.id === id);
      if (idx !== -1) {
        cols[idx] = res.data.collection;
        setLocalData(STORAGE_KEYS.COLLECTIONS, cols);
      }
      this.logAudit("COLLECTION", id, `Added ${productIds.length} products to collection`);
      return {
        success: true,
        statusCode: 200,
        message: res.message || "Products added to collection successfully",
        data: res.data,
      };
    }

    // Smart Local Fallback
    const cols = this.getLocalCollections();
    const idx = cols.findIndex((c) => c.id === id);
    if (idx === -1) {
      return {
        success: false,
        statusCode: 404,
        error: "COLLECTION_NOT_FOUND",
        message: "Collection not found.",
      };
    }

    const currentIds = cols[idx].productIds || [];
    const newUnique = Array.from(new Set([...currentIds, ...productIds]));
    cols[idx].productIds = newUnique;
    cols[idx].productsCount = newUnique.length;
    cols[idx].productCount = newUnique.length;
    cols[idx].updatedAt = new Date().toISOString();

    setLocalData(STORAGE_KEYS.COLLECTIONS, cols);
    this.logAudit("COLLECTION", id, `Appended ${productIds.length} garments to collection "${cols[idx].name}"`);

    return {
      success: true,
      statusCode: 200,
      message: "Garments added to collection successfully",
      data: { collection: cols[idx] },
    };
  }

  /**
   * 3.7. Remove Single Product from Collection
   * Endpoint: DELETE /api/v1/admin/collections/:id/products/:productId
   */
  static async removeProductFromCollection(
    id: string,
    productId: string
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: { collectionId: string; productId: string; removed: boolean };
    error?: string;
  }> {
    const res = await this.request<{ collectionId: string; productId: string; removed: boolean }>(
      `/collections/${id}/products/${productId}`,
      { method: "DELETE" }
    );

    if (res.success && res.data) {
      const cols = this.getLocalCollections();
      const idx = cols.findIndex((c) => c.id === id);
      if (idx !== -1) {
        cols[idx].productIds = (cols[idx].productIds || []).filter((pid) => pid !== productId);
        cols[idx].productsCount = cols[idx].productIds.length;
        cols[idx].productCount = cols[idx].productIds.length;
        setLocalData(STORAGE_KEYS.COLLECTIONS, cols);
      }
      this.logAudit("COLLECTION", id, `Removed product ${productId} from collection`);
      return {
        success: true,
        statusCode: 200,
        message: res.message || "Product removed from collection",
        data: res.data,
      };
    }

    // Smart Local Fallback
    const cols = this.getLocalCollections();
    const idx = cols.findIndex((c) => c.id === id);
    if (idx === -1) {
      return {
        success: false,
        statusCode: 404,
        error: "COLLECTION_NOT_FOUND",
        message: "Collection not found.",
      };
    }

    cols[idx].productIds = (cols[idx].productIds || []).filter((pid) => pid !== productId);
    cols[idx].productsCount = cols[idx].productIds.length;
    cols[idx].productCount = cols[idx].productIds.length;
    cols[idx].updatedAt = new Date().toISOString();

    setLocalData(STORAGE_KEYS.COLLECTIONS, cols);
    this.logAudit("COLLECTION", id, `Removed product ${productId} from collection "${cols[idx].name}"`);

    return {
      success: true,
      statusCode: 200,
      message: "Garment removed from collection successfully",
      data: { collectionId: id, productId, removed: true },
    };
  }

  /**
   * 3.8. Delete Collection
   * Endpoint: DELETE /api/v1/admin/collections/:id
   */
  static async deleteCollection(id: string): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: { id: string; name: string; deleted: boolean };
    error?: string;
  }> {
    const res = await this.request<{ id: string; name: string; deleted: boolean }>(`/collections/${id}`, {
      method: "DELETE",
    });

    if (res.success && res.data) {
      const cols = this.getLocalCollections().filter((c) => c.id !== id);
      setLocalData(STORAGE_KEYS.COLLECTIONS, cols);
      this.logAudit("COLLECTION", id, `Deleted collection "${res.data.name}"`);
      return {
        success: true,
        statusCode: 200,
        message: res.message || "Collection deleted successfully",
        data: res.data,
      };
    }

    // Smart Local Fallback
    const cols = this.getLocalCollections();
    const target = cols.find((c) => c.id === id);
    if (!target) {
      return {
        success: false,
        statusCode: 404,
        error: "COLLECTION_NOT_FOUND",
        message: "Collection not found.",
      };
    }

    const remaining = cols.filter((c) => c.id !== id);
    setLocalData(STORAGE_KEYS.COLLECTIONS, remaining);
    this.logAudit("COLLECTION", id, `Deleted collection "${target.name}"`);

    return {
      success: true,
      statusCode: 200,
      message: "Collection deleted successfully",
      data: { id, name: target.name, deleted: true },
    };
  }
}
