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
  | "coupons:manage"
  | "promotions:manage"
  | "settings:view"
  | "settings:edit"
  | "settings:manage"
  | "audit:view"
  | "analytics:read";

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
  variantId?: string;
  productId: string;
  productName: string;
  sku?: string;
  variantName?: string;
  stockQuantity?: number;
  lowStockThreshold: number;
  status?: "OUT_OF_STOCK" | "LOW_STOCK";
  categoryName?: string;
  thumbnail?: string;

  // Backward compatibility aliases
  variantSku?: string;
  size?: string;
  colorName?: string;
  stock?: number;
  urgency?: "CRITICAL" | "LOW";
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
// 3. PRODUCT & MULTI-VARIANT CATALOG TYPES (Module 03)
// ==========================================

export type ProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export interface AdminVariantAttribute {
  attributeName: string;
  value: string;
  slug: string;
}

export interface AdminProductVariant {
  id: string;
  sku: string;
  name?: string;
  size: string;
  colorName: string;
  color?: string; // alias for colorName
  colorHex?: string;
  price: number; // selling/effective price
  regularPrice?: string | number; // compare-at price
  salePrice?: string | number | null; // discounted price
  offerPrice?: string | number | null; // flash promo price
  compareAtPrice?: number | null; // alias for regularPrice
  costPrice?: string | number | null; // COGS
  stock: number;
  stockQuantity?: number; // alias for stock
  lowStockThreshold?: number;
  barcode?: string | null;
  isActive: boolean;
  attributes?: AdminVariantAttribute[];
}

export interface AdminProductImage {
  id?: string;
  productId?: string;
  url: string;
  altText?: string;
  isThumbnail?: boolean;
  isPrimary?: boolean;
  sortOrder?: number;
  displayOrder?: number;
}

export interface AdminProductVariantSummary {
  id: string;
  sku: string;
  name: string;
  stock: number;
  price: string | number;
  isActive: boolean;
}

export interface AdminProductCategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface AdminProductCollectionRef {
  id: string;
  name: string;
  slug: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand: string;
  sku: string;
  regularPrice: string | number;
  salePrice?: string | number | null;
  offerPrice?: string | number | null;
  costPrice?: string | number | null;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  totalSold?: number;
  rating?: number;
  reviewCount?: number;
  category?: AdminProductCategoryRef;
  thumbnail?: string;
  imagesCount?: number;
  variantsCount?: number;
  variantsSummary?: AdminProductVariantSummary[];
  images: AdminProductImage[];
  variants: AdminProductVariant[];
  collections?: AdminProductCollectionRef[];

  // Backward compatibility fields for storefront & existing modules
  status: ProductStatus;
  categorySlug: string;
  categoryName: string;
  tags: string[];
  gender?: "WOMEN" | "MEN" | "UNISEX";
  totalStock: number;
  basePrice: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ProductListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brand?: string;
  isActive?: boolean | "true" | "false" | "ALL";
  isFeatured?: boolean | "true" | "false" | "ALL";
  stockStatus?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "ALL";
  minPrice?: number;
  maxPrice?: number;
  sort?:
    | "newest"
    | "oldest"
    | "price_asc"
    | "price_desc"
    | "stock_asc"
    | "stock_desc"
    | "name_asc"
    | "bestselling";
}

export interface ProductsListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AdminProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminProductDetailResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    product: AdminProduct;
  };
}

export interface CreateProductVariantInput {
  id?: string;
  sku?: string;
  name?: string;
  size: string;
  color?: string;
  colorName?: string;
  colorHex?: string;
  regularPrice?: number;
  salePrice?: number | null;
  offerPrice?: number | null;
  costPrice?: number | null;
  stockQuantity?: number;
  price?: number;
  compareAtPrice?: number | null;
  stock?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
  attributes?: AdminVariantAttribute[];
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  brand?: string;
  sku?: string;
  categoryId?: string;
  categorySlug?: string;
  categoryName?: string;
  regularPrice?: number;
  salePrice?: number | null;
  offerPrice?: number | null;
  costPrice?: number | null;
  basePrice?: number;
  stockQuantity?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  gender?: "WOMEN" | "MEN" | "UNISEX";
  images?: Array<{
    url: string;
    altText?: string;
    isThumbnail?: boolean;
    isPrimary?: boolean;
    sortOrder?: number;
  }>;
  variants?: CreateProductVariantInput[];
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  brand?: string;
  sku?: string;
  categoryId?: string;
  categorySlug?: string;
  categoryName?: string;
  regularPrice?: number;
  salePrice?: number | null;
  offerPrice?: number | null;
  costPrice?: number | null;
  basePrice?: number;
  stockQuantity?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  status?: ProductStatus;
  tags?: string[];
  gender?: "WOMEN" | "MEN" | "UNISEX";
  images?: Array<{
    id?: string;
    url: string;
    altText?: string;
    isThumbnail?: boolean;
    isPrimary?: boolean;
    sortOrder?: number;
  }>;
  variants?: Array<Partial<CreateProductVariantInput> & { id?: string }>;
}

export interface ProductStatusToggleInput {
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface ProductStatusToggleResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    id: string;
    name: string;
    isActive: boolean;
    isFeatured: boolean;
    updatedAt: string;
  };
}

export interface DeleteProductResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    id: string;
    name: string;
    action: "ARCHIVED" | "DELETED";
  };
}

export interface UploadProductImagesResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    images: AdminProductImage[];
  };
}


// ==========================================
// 4. INVENTORY & AUDITABLE LEDGER TYPES (Module 04)
// ==========================================

export type InventoryStockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type InventoryTransactionType =
  | "RESTOCK"
  | "SALE"
  | "ADJUSTMENT"
  | "RETURN"
  | "DAMAGE";

// Backward compatibility alias
export type InventoryTransactionReason =
  | InventoryTransactionType
  | "MANUAL_ADJUSTMENT"
  | "DAMAGED"
  | "INVENTORY_AUDIT";

export interface InventoryItemCategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface InventoryItem {
  itemType: "VARIANT" | "PRODUCT";
  id: string; // variantId or productId
  variantId?: string;
  productId: string;
  productName: string;
  brand: string;
  sku: string;
  variantName: string;
  size: string;
  color: string;
  colorHex?: string;
  stockQuantity: number;
  lowStockThreshold: number;
  status: InventoryStockStatus;
  regularPrice: string | number;
  salePrice?: string | number | null;
  costPrice?: string | number | null;
  isActive: boolean;
  category?: InventoryItemCategoryRef;
  thumbnail?: string;
  updatedAt: string;

  // Backward compatibility aliases
  price?: number;
  stock?: number;
  colorName?: string;
  productImage?: string;
}

// Backward compatibility alias
export type FlatInventoryItem = InventoryItem;

export interface InventorySummary {
  totalVariants: number;
  totalStockUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface InventoryListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ALL" | InventoryStockStatus;
  categoryId?: string;
  sort?: "stock_asc" | "stock_desc" | "name_asc" | "sku_asc" | "newest";
}

export interface InventoryListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: InventoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta: {
    summary: InventorySummary;
  };
}

export interface InventoryTransactionCreatedBy {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface InventoryTransaction {
  id: string;
  variantId?: string;
  productId: string;
  productName?: string;
  variantSku?: string;
  type: InventoryTransactionType;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string;
  referenceId?: string;
  createdAt: string;
  variant?: {
    id: string;
    sku: string;
    name: string;
  };
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  createdBy?: InventoryTransactionCreatedBy;

  // Backward compatibility fields
  deltaQuantity?: number;
  notes?: string;
  performedBy?: string;
}

// Backward compatibility alias
export type InventoryLedgerEntry = InventoryTransaction;

export interface AdjustStockInput {
  variantId?: string;
  productId?: string;
  delta?: number;
  newStock?: number;
  type?: InventoryTransactionType;
  reason: string;
  referenceId?: string;
  notes?: string;
}

// Backward compatibility alias
export type StockAdjustmentInput = AdjustStockInput;

export interface AdjustStockResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: {
    itemType: "VARIANT" | "PRODUCT";
    variantId?: string;
    productId: string;
    productName: string;
    sku: string;
    previousStock: number;
    newStock: number;
    quantityChange: number;
    transaction: InventoryTransaction;
  };
  error?: {
    code: string;
    message?: string;
  };
  newStock?: number;
}

export interface InventoryTransactionsQueryParams {
  page?: number;
  limit?: number;
  variantId?: string;
  productId?: string;
  type?: InventoryTransactionType | "ALL";
  startDate?: string;
  endDate?: string;
}

export interface InventoryTransactionsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: InventoryTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InventoryAlertsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: InventoryAlertItem[];
  meta: {
    totalAlerts: number;
  };
}

export interface UpdateThresholdInput {
  variantId?: string;
  productId?: string;
  lowStockThreshold: number;
}

export interface UpdateThresholdResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    itemType: "VARIANT" | "PRODUCT";
    id: string;
    sku: string;
    name: string;
    stockQuantity: number;
    lowStockThreshold: number;
  };
}

// ==========================================
// 5. ORDER LIFECYCLE, FULFILLMENT & COURIER TRACKING (Module 05)
// ==========================================

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "REFUNDED";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface AdminOrderItem {
  id: string;
  productId: string;
  variantId?: string;
  title: string;
  sku?: string;
  size: string;
  color: string;
  quantity: number;
  price: string | number;
  totalPrice?: string | number;
  imageUrl?: string;
  product?: {
    id: string;
    name: string;
    slug?: string;
    brand?: string;
  };
  variant?: {
    id: string;
    sku?: string;
    stockQuantity?: number;
  };
}

export interface CourierInfo {
  carrierName: string;
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
}

export interface OrderStatusHistoryEntry {
  id: string;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  comment?: string;
  createdAt: string;
  changedBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export interface AdminOrderPayment {
  id: string;
  gateway: "RAZORPAY" | "STRIPE" | "COD" | string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  transactionId?: string;
  amount: string | number;
  currency?: string;
  createdAt?: string;
}

export interface AdminOrderAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark?: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  subtotal: string | number;
  discountAmount?: string | number;
  discount?: number;
  taxAmount?: string | number;
  tax?: number;
  shippingAmount?: string | number;
  shipping?: number;
  totalAmount?: string | number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: "RAZORPAY" | "COD" | "STRIPE" | string;
  shippingAddress: AdminOrderAddress;
  billingAddress?: AdminOrderAddress | null;
  trackingNumber?: string | null;
  courierPartner?: string | null;
  courier?: CourierInfo;
  itemsCount?: number;
  items: AdminOrderItem[];
  payments?: AdminOrderPayment[];
  statusHistory?: OrderStatusHistoryEntry[];
  notes?: string | null;
  internalAdminNotes?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface OrdersSummary {
  totalOrders: number;
  totalRevenue: number;
  pendingCount: number;
  confirmedCount: number;
  processingCount: number;
  packedCount: number;
  shippedCount: number;
  deliveredCount: number;
  cancelledCount: number;
}

export interface OrderListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus | "ALL";
  paymentStatus?: PaymentStatus | "ALL";
  paymentMethod?: "ALL" | "RAZORPAY" | "STRIPE" | "COD" | string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sort?: "newest" | "oldest" | "total_asc" | "total_desc";
}

export interface OrdersListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AdminOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta: {
    summary: OrdersSummary;
  };
}

export interface OrderDetailResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AdminOrder;
}

export interface AdvanceOrderStatusInput {
  status: OrderStatus;
  comment?: string;
}

export interface AssignShippingInput {
  courierPartner: string;
  trackingNumber: string;
  estimatedDelivery?: string;
  status?: OrderStatus;
  notes?: string;
}

export interface UpdateOrderNotesInput {
  internalAdminNotes: string;
}

export interface CancelOrderInput {
  reason: string;
}

export interface UpdateOrderStatusInput {
  orderId: string;
  status: OrderStatus;
  courier?: CourierInfo;
  notes?: string;
  comment?: string;
}

// ==========================================
// 6. CATEGORIES & CURATED COLLECTIONS (Module 02)
// ==========================================

export interface CategoryBreadcrumb {
  id: string;
  name: string;
  slug: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  displayOrder?: number;
  isFeatured: boolean;
  isActive: boolean;
  productCount: number;
  childrenCount: number;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  breadcrumbs?: CategoryBreadcrumb[];
  children?: AdminCategory[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface CategoryListQueryParams {
  view?: "tree" | "flat" | "root";
  search?: string;
  isActive?: boolean | "true" | "false";
  isFeatured?: boolean | "true" | "false";
  parentId?: string;
  page?: number;
  limit?: number;
}

export interface CategoriesListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AdminCategory[];
  meta?: {
    view: "tree" | "flat" | "root";
    totalCount: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminCollectionProduct {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  sku?: string;
  regularPrice: string | number;
  salePrice?: string | number | null;
  stockQuantity: number;
  isActive: boolean;
  thumbnail?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  collectionSortOrder?: number;
}

export interface AdminCollection {
  id: string;
  name: string;
  title?: string;
  slug: string;
  description?: string;
  imageUrl?: string | null;
  isFeatured: boolean;
  sortOrder?: number;
  isActive: boolean;
  productsCount: number;
  productCount?: number;
  products?: AdminCollectionProduct[];
  productIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCollectionInput {
  name: string;
  title?: string;
  slug?: string;
  description?: string;
  imageUrl?: string | null;
  isFeatured?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  productIds?: string[];
}

export interface UpdateCollectionInput {
  name?: string;
  title?: string;
  slug?: string;
  description?: string;
  imageUrl?: string | null;
  isFeatured?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  productIds?: string[];
}

export interface CollectionListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isFeatured?: boolean | "true" | "false";
  isActive?: boolean | "true" | "false";
}

export interface CollectionsListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AdminCollection[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==========================================
// 7. COUPONS, DISCOUNTS & FLASH CAMPAIGNS (Module 06)
// ==========================================

export type DiscountType = "PERCENTAGE" | "FIXED" | "FIXED_AMOUNT";
export type CouponType = DiscountType;

export interface CouponUsageLog {
  id: string;
  usedAt: string;
  discountApplied: string | number;
  user: {
    id: string;
    name: string;
    email: string;
  };
  order: {
    id: string;
    orderNumber: string;
    totalAmount: string | number;
  };
}

export interface AdminCoupon {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: string | number;
  minOrderAmount?: string | number | null;
  maxDiscountAmount?: string | number | null;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  isActive: boolean;
  computedStatus?: "ACTIVE" | "EXPIRED" | "INACTIVE";
  remainingUses?: number;
  usages?: CouponUsageLog[];
  createdAt?: string;
  updatedAt?: string;

  // Backward compatibility aliases
  usageCount?: number;
}

export interface CreateCouponInput {
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate?: string;
  endDate: string;
  usageLimit?: number;
  perUserLimit?: number;
  isActive?: boolean;
}

export interface UpdateCouponInput {
  code?: string;
  description?: string;
  discountType?: "PERCENTAGE" | "FIXED";
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  perUserLimit?: number;
  isActive?: boolean;
}

export interface CouponListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ALL" | "ACTIVE" | "EXPIRED" | "INACTIVE";
  discountType?: "ALL" | "PERCENTAGE" | "FIXED";
  sort?: "newest" | "oldest" | "code_asc" | "used_desc";
}

export interface CouponsListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AdminCoupon[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CouponDetailResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AdminCoupon;
}

export interface AdminPromotion {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  discountPercentage?: number;
  couponCode?: string;
  startDate: string;
  endDate: string;
  backgroundImage: string;
  ctaText?: string;
  ctaLink?: string;
  sortOrder?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePromotionInput {
  title: string;
  subtitle?: string;
  badge?: string;
  discountPercentage?: number;
  couponCode?: string;
  startDate?: string;
  endDate?: string;
  backgroundImage?: string;
  ctaText?: string;
  ctaLink?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdatePromotionInput {
  title?: string;
  subtitle?: string;
  badge?: string;
  discountPercentage?: number;
  couponCode?: string;
  startDate?: string;
  endDate?: string;
  backgroundImage?: string;
  ctaText?: string;
  ctaLink?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface PromotionListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ALL" | "ACTIVE" | "INACTIVE" | "EXPIRED";
}

export interface PromotionsListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AdminPromotion[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==========================================
// 8. STORE SETTINGS & FEATURE FLAGS (Module 07)
// ==========================================

export interface StoreFeatureFlags {
  wishlist: boolean;
  reviews: boolean;
  coupons: boolean;
  guestCheckout: boolean;
  onlinePayment: boolean;
  cashOnDelivery: boolean;
  productVariants: boolean;
  whatsapp: boolean;
  newsletter: boolean;
  recommendations: boolean;
  sizeChart: boolean;
  orderTracking: boolean;
  [key: string]: boolean | undefined;
}

export interface StorePolicies {
  shippingPolicy: string;
  returnPolicy: string;
  [key: string]: string | undefined;
}

export type StoreThemePresetId =
  | "luxury-fashion"
  | "monochrome-minimal"
  | "royal-festive"
  | string;

export interface StoreSettings {
  id: string;
  storeName: string;
  tagline: string;
  currency: string;
  currencySymbol: string;
  supportEmail: string;
  supportPhone: string;
  activeTheme: StoreThemePresetId;
  freeShippingThreshold: string | number;
  flatShippingRate: string | number;
  featuresJson: StoreFeatureFlags;
  policiesJson: StorePolicies;
  updatedAt: string;
}

export interface UpdateStoreSettingsInput {
  storeName?: string;
  tagline?: string;
  supportEmail?: string;
  supportPhone?: string;
  currency?: string;
  currencySymbol?: string;
  freeShippingThreshold?: number | string;
  flatShippingRate?: number | string;
  policiesJson?: Partial<StorePolicies>;
}

export interface SwitchThemeInput {
  themeId: string;
}

export interface UpdateFeatureFlagsInput {
  features: Partial<StoreFeatureFlags>;
}

export interface StoreSettingsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: StoreSettings;
}

// ==========================================
// 9. IMMUTABLE SECURITY AUDIT LOGGING (Module 07)
// ==========================================

export interface AuditLogUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole | string;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  detailsJson: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: AuditLogUser;

  // Backwards compatibility aliases
  adminName?: string;
  adminEmail?: string;
  targetType?: string;
  targetId?: string;
  details?: string;
  timestamp?: string;
}

export type AuditLogEntry = AdminAuditLog;

export interface AuditLogListQueryParams {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface AuditLogsListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AdminAuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditLogDetailResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AdminAuditLog;
}

// ==========================================
// 10. PERFORMANCE ANALYTICS & IN-MEMORY TELEMETRY (Module 08)
// ==========================================

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "year" | "all";

export interface AnalyticsOverviewData {
  period: AnalyticsPeriod;
  totalRevenue: number;
  revenueChangePct: number;
  ordersCount: number;
  ordersChangePct: number;
  averageOrderValue: number;
  aovChangePct: number;
  activeOrdersCount: number;
  pendingDispatchCount: number;
  registeredCustomersCount: number;
  newCustomersCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  currency: string;
  currencySymbol: string;
}

export interface AnalyticsMeta {
  period?: AnalyticsPeriod;
  fromCache: boolean;
  ttl?: number;
  totalOrders?: number;
}

export interface AnalyticsOverviewResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AnalyticsOverviewData;
  meta: AnalyticsMeta;
}

export interface RevenueChartPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface RevenueChartResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: RevenueChartPoint[];
  meta: AnalyticsMeta;
}

export interface TopProductItem {
  productId: string;
  name: string;
  brand: string;
  slug: string;
  thumbnail: string;
  unitsSold: number;
  revenue: number;
}

export interface TopProductsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: TopProductItem[];
  meta: AnalyticsMeta;
}

export interface OrderStatusDistributionItem {
  status: string;
  count: number;
  percentage: number;
}

export interface OrderDistributionResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: OrderStatusDistributionItem[];
  meta: AnalyticsMeta;
}

export interface PurgeCacheResponse {
  success: boolean;
  statusCode: number;
  message: string;
}


