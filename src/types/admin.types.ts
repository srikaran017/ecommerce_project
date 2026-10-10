/**
 * Admin Panel Architecture - Core Type Definitions & API Contracts
 * Fully aligned with production Prisma schema & REST API specification (/api/v1/admin/*)
 */

// ==========================================
// 1. RBAC & PERMISSION TYPES
// ==========================================

export type AdminRole = "SUPER_ADMIN" | "STORE_ADMIN" | "STAFF" | "CUSTOMER";

export type AdminPermission =
  | "analytics:view"
  | "products:view"
  | "products:create"
  | "products:edit"
  | "products:delete"
  | "products:archive"
  | "inventory:view"
  | "inventory:adjust"
  | "orders:view"
  | "orders:update_status"
  | "orders:cancel"
  | "orders:export"
  | "categories:manage"
  | "collections:manage"
  | "discounts:manage"
  | "settings:view"
  | "settings:edit"
  | "audit:view";

export type ModulePermissionCode =
  | "products:read"
  | "products:write"
  | "products:delete"
  | "categories:manage"
  | "collections:manage"
  | "inventory:read"
  | "inventory:write"
  | "orders:read"
  | "orders:write"
  | "orders:cancel"
  | "coupons:manage"
  | "promotions:manage"
  | "settings:manage"
  | "users:read"
  | "users:write"
  | "staff:manage"
  | "analytics:read";

export interface PermissionDefinition {
  code: ModulePermissionCode;
  name: string;
  category: "Catalog" | "Inventory" | "Orders" | "Marketing" | "Settings" | "Users" | "Analytics";
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminManagedUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: ModulePermissionCode[];
  phone?: string | null;
  isActive: boolean;
  createdById?: string | null;
  creator?: {
    id: string;
    name: string;
    role: AdminRole;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubordinateUserInput {
  name: string;
  email: string;
  password: string;
  role: "STORE_ADMIN" | "STAFF" | "CUSTOMER";
  phone?: string;
  permissions?: ModulePermissionCode[];
}

export interface UpdateSubordinateUserInput {
  name?: string;
  phone?: string;
  permissions?: ModulePermissionCode[];
  isActive?: boolean;
}

export interface UserListQueryParams {
  page?: number;
  limit?: number;
  role?: AdminRole | "ALL";
  search?: string;
  isActive?: boolean | "true" | "false";
}

export interface UsersListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AdminManagedUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==========================================
// 2. DASHBOARD & ANALYTICS TYPES
// ==========================================

export interface DashboardMetric {
  title: string;
  value: string;
  numericValue: number;
  change: string;
  isPositive: boolean;
}

export interface InventoryAlertItem {
  id: string;
  productId: string;
  productName: string;
  variantSku: string;
  size: string;
  colorName: string;
  stock: number;
  lowStockThreshold: number;
  urgency: "CRITICAL" | "LOW";
}

export interface SalesChartPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface AdminDashboardOverview {
  metrics: {
    totalRevenue: DashboardMetric;
    activeOrders: DashboardMetric;
    totalCustomers: DashboardMetric;
    averageOrderValue: DashboardMetric;
  };
  recentOrders: AdminOrderSummary[];
  inventoryAlerts: InventoryAlertItem[];
  salesChart: SalesChartPoint[];
}

// ==========================================
// 3. PRODUCT & MULTI-VARIANT CATALOG TYPES
// ==========================================

export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export interface AdminProductVariant {
  id: string;
  sku: string;
  size: string;
  colorName: string;
  colorHex?: string;
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  stock: number;
  lowStockThreshold?: number;
  barcode?: string | null;
  isActive: boolean;
}

export interface AdminProductImage {
  id?: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  displayOrder?: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  status: ProductStatus;
  categorySlug: string;
  categoryName: string;
  tags: string[];
  gender?: "WOMEN" | "MEN" | "UNISEX";
  brand: string;
  images: AdminProductImage[];
  variants: AdminProductVariant[];
  totalStock: number;
  basePrice: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  categorySlug: string;
  categoryName: string;
  tags: string[];
  gender?: "WOMEN" | "MEN" | "UNISEX";
  images: Array<{ url: string; isPrimary: boolean; altText?: string }>;
  variants: Array<{
    size: string;
    colorName: string;
    colorHex?: string;
    price: number;
    compareAtPrice?: number | null;
    costPrice?: number | null;
    stock: number;
    sku?: string;
    lowStockThreshold?: number;
  }>;
}

export type UpdateProductInput = Partial<CreateProductInput> & {
  status?: ProductStatus;
};

// ==========================================
// 4. INVENTORY & AUDITABLE LEDGER TYPES
// ==========================================

export type InventoryTransactionReason =
  | "RESTOCK"
  | "SALE"
  | "MANUAL_ADJUSTMENT"
  | "RETURN"
  | "DAMAGED"
  | "INVENTORY_AUDIT";

export interface InventoryLedgerEntry {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  variantSku: string;
  deltaQuantity: number;
  previousStock: number;
  newStock: number;
  reason: InventoryTransactionReason;
  notes?: string;
  performedBy: string; // admin user name/email
  createdAt: string;
}

export interface FlatInventoryItem {
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
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

export interface StockAdjustmentInput {
  variantId: string;
  delta: number;
  reason: InventoryTransactionReason;
  notes?: string;
}

// ==========================================
// 5. ORDER LIFECYCLE & COURIER FULFILLMENT
// ==========================================

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface AdminOrderItem {
  id: string;
  productId: string;
  variantId?: string;
  title: string;
  size: string;
  color: string;
  sku?: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface CourierInfo {
  carrierName: string;
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
}

export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  itemsCount: number;
  createdAt: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: AdminOrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentMethod: "RAZORPAY" | "COD" | "STRIPE" | string;
  paymentStatus: PaymentStatus;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  courier?: CourierInfo;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrderStatusInput {
  orderId: string;
  status: OrderStatus;
  courier?: CourierInfo;
  notes?: string;
}

// ==========================================
// 6. CATEGORIES & CURATED COLLECTIONS
// ==========================================

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  displayOrder: number;
  productCount: number;
  isActive: boolean;
}

export interface AdminCollection {
  id: string;
  title: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  productIds: string[];
  productCount: number;
  isFeatured: boolean;
  isActive: boolean;
}

// ==========================================
// 7. COUPONS & DISCOUNTS
// ==========================================

export type CouponType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface AdminCoupon {
  id: string;
  code: string;
  discountType: CouponType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  isActive: boolean;
}

// ==========================================
// 8. AUDIT LOGGING
// ==========================================

export interface AuditLogEntry {
  id: string;
  adminName: string;
  adminEmail: string;
  action: string;
  targetType: "PRODUCT" | "ORDER" | "INVENTORY" | "SETTINGS" | "COUPON" | "USER";
  targetId: string;
  details: string;
  timestamp: string;
}
