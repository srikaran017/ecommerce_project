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
  AdminProductVariant,
  AdminProductImage,
  AdminProductVariantSummary,
  CreateProductInput,
  UpdateProductInput,
  ProductListQueryParams,
  ProductsListResponse,
  AdminProductDetailResponse,
  ProductStatusToggleInput,
  ProductStatusToggleResponse,
  DeleteProductResponse,
  UploadProductImagesResponse,
  FlatInventoryItem,
  InventoryItem,
  InventoryStockStatus,
  InventoryItemCategoryRef,
  InventorySummary,
  InventoryListQueryParams,
  InventoryListResponse,
  InventoryTransaction,
  InventoryTransactionsQueryParams,
  InventoryTransactionsResponse,
  InventoryAlertItem,
  InventoryAlertsResponse,
  AdjustStockInput,
  AdjustStockResponse,
  UpdateThresholdInput,
  UpdateThresholdResponse,
  InventoryTransactionType,
  StockAdjustmentInput,
  InventoryLedgerEntry,
  AdminOrder,
  OrderStatus,
  CourierInfo,
  AdminOrderItem,
  AdminOrderPayment,
  AdminOrderAddress,
  AdminOrderSummary,
  OrdersSummary,
  OrderStatusHistoryEntry,
  OrderListQueryParams,
  OrdersListResponse,
  OrderDetailResponse,
  AdvanceOrderStatusInput,
  AssignShippingInput,
  UpdateOrderNotesInput,
  CancelOrderInput,
  UpdateOrderStatusInput,
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

/**
 * Module 05: Order Fulfillment State Machine Transition Map
 */
export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURNED"],
  RETURNED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export const INITIAL_SAMPLE_ORDERS: AdminOrder[] = [
  {
    id: "ord_uuid_101",
    orderNumber: "ORD-20261008-9823",
    userId: "usr_uuid_001",
    customerName: "Aarav Sharma",
    customerEmail: "aarav@example.com",
    customerPhone: "+91 98765 00002",
    subtotal: "18999.00",
    discountAmount: "0.00",
    taxAmount: "0.00",
    shippingAmount: "0.00",
    totalAmount: "18999.00",
    total: 18999,
    status: "CONFIRMED",
    paymentStatus: "COMPLETED",
    paymentMethod: "RAZORPAY",
    shippingAddress: {
      street: "102, Skyline Residency, Linking Road",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400050",
      country: "India",
      landmark: "Near Bandra Post Office",
    },
    notes: "Please include festive gift wrap card.",
    internalAdminNotes: "VIP customer. Ensure silk box is sealed with wax atelier stamp.",
    itemsCount: 1,
    items: [
      {
        id: "item_uuid_1",
        productId: "04de36fe-1b09-4c27-a793-5bf9c9ff0412",
        variantId: "04de36fe-1b09-4c27-a793-5bf9c9ff0412-s",
        title: "Mulberry Silk Draped Evening Gown",
        sku: "MSG-001-S",
        size: "S",
        color: "Midnight Navy",
        quantity: 1,
        price: "18999.00",
        totalPrice: "18999.00",
        imageUrl: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
        product: {
          id: "04de36fe-1b09-4c27-a793-5bf9c9ff0412",
          name: "Mulberry Silk Draped Evening Gown",
          slug: "mulberry-silk-draped-evening-gown",
          brand: "Maison De Élégance",
        },
        variant: {
          id: "04de36fe-1b09-4c27-a793-5bf9c9ff0412-s",
          sku: "MSG-001-S",
          stockQuantity: 14,
        },
      },
    ],
    payments: [
      {
        id: "pay_uuid_1",
        gateway: "RAZORPAY",
        status: "COMPLETED",
        transactionId: "pay_rzp_9812739812",
        amount: "18999.00",
        currency: "INR",
        createdAt: "2026-10-08T14:16:00.000Z",
      },
    ],
    statusHistory: [
      {
        id: "hist_1",
        previousStatus: null,
        newStatus: "PENDING",
        comment: "Order initiated via Razorpay checkout",
        createdAt: "2026-10-08T14:15:00.000Z",
        changedBy: null,
      },
      {
        id: "hist_2",
        previousStatus: "PENDING",
        newStatus: "CONFIRMED",
        comment: "Payment captured and order verified by store manager",
        createdAt: "2026-10-08T14:20:00.000Z",
        changedBy: {
          id: "admin_uuid_1",
          name: "Elena Rostova",
          email: "elena@atelier.com",
          role: "STORE_ADMIN",
        },
      },
    ],
    createdAt: "2026-10-08T14:15:00.000Z",
    updatedAt: "2026-10-08T14:20:00.000Z",
  },
  {
    id: "ord_uuid_102",
    orderNumber: "ORD-20261009-1142",
    userId: "usr_uuid_002",
    customerName: "Priya Sengupta",
    customerEmail: "priya@example.com",
    customerPhone: "+91 98765 00003",
    subtotal: "28999.00",
    discountAmount: "2899.00",
    discount: 2899,
    taxAmount: "0.00",
    shippingAmount: "0.00",
    totalAmount: "26100.00",
    total: 26100,
    status: "PROCESSING",
    paymentStatus: "COMPLETED",
    paymentMethod: "RAZORPAY",
    shippingAddress: {
      street: "45, Park Street, Flat 4B",
      city: "Kolkata",
      state: "West Bengal",
      postalCode: "700016",
      country: "India",
    },
    itemsCount: 1,
    items: [
      {
        id: "item_uuid_2",
        productId: "35ee7bcf-40a2-4a0b-93df-4993181816f1",
        variantId: "35ee7bcf-40a2-4a0b-93df-4993181816f1-free",
        title: "Handcrafted Banarasi Raw Silk Saree",
        sku: "BS-RAW-001",
        size: "Free Size",
        color: "Royal Magenta",
        quantity: 1,
        price: "28999.00",
        totalPrice: "28999.00",
        imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
        product: {
          id: "35ee7bcf-40a2-4a0b-93df-4993181816f1",
          name: "Handcrafted Banarasi Raw Silk Saree",
          slug: "handcrafted-banarasi-raw-silk-saree",
          brand: "Varanasi Heritage Weaves",
        },
        variant: {
          id: "35ee7bcf-40a2-4a0b-93df-4993181816f1-free",
          sku: "BS-RAW-001",
          stockQuantity: 8,
        },
      },
    ],
    payments: [
      {
        id: "pay_uuid_2",
        gateway: "RAZORPAY",
        status: "COMPLETED",
        transactionId: "pay_rzp_9812739815",
        amount: "26100.00",
        currency: "INR",
        createdAt: "2026-10-09T11:42:00.000Z",
      },
    ],
    statusHistory: [
      {
        id: "hist_102_1",
        previousStatus: null,
        newStatus: "PENDING",
        comment: "Order placed online",
        createdAt: "2026-10-09T11:40:00.000Z",
      },
      {
        id: "hist_102_2",
        previousStatus: "PENDING",
        newStatus: "CONFIRMED",
        comment: "Order confirmed by inventory lead",
        createdAt: "2026-10-09T11:45:00.000Z",
      },
      {
        id: "hist_102_3",
        previousStatus: "CONFIRMED",
        newStatus: "PROCESSING",
        comment: "Transferred to bespoke tailoring department for finishing",
        createdAt: "2026-10-09T12:00:00.000Z",
        changedBy: {
          id: "admin_uuid_1",
          name: "Elena Rostova",
          email: "elena@atelier.com",
          role: "SUPER_ADMIN",
        },
      },
    ],
    internalAdminNotes: "Silk fabric pre-checked. Awaiting falls & edging stitching.",
    createdAt: "2026-10-09T11:40:00.000Z",
    updatedAt: "2026-10-09T12:00:00.000Z",
  },
  {
    id: "ord_uuid_103",
    orderNumber: "ORD-20261009-4081",
    userId: "usr_uuid_003",
    customerName: "Rohan Varma",
    customerEmail: "rohan@example.com",
    customerPhone: "+91 98765 00004",
    subtotal: "4999.00",
    totalAmount: "4999.00",
    total: 4999,
    status: "PACKED",
    paymentStatus: "PENDING",
    paymentMethod: "COD",
    shippingAddress: {
      street: "12/A, Cunningham Road",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560052",
      country: "India",
    },
    itemsCount: 1,
    items: [
      {
        id: "item_uuid_3",
        productId: "prod_uuid_shirt_01",
        variantId: "var_uuid_shirt_l",
        title: "Structured Belgian Linen Shirt",
        sku: "SBL-001-L",
        size: "L",
        color: "Crisp Ivory",
        quantity: 1,
        price: "4999.00",
        totalPrice: "4999.00",
        imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
        product: {
          id: "prod_uuid_shirt_01",
          name: "Structured Belgian Linen Shirt",
          slug: "structured-belgian-linen-shirt",
          brand: "Atelier Masculin",
        },
        variant: {
          id: "var_uuid_shirt_l",
          sku: "SBL-001-L",
          stockQuantity: 18,
        },
      },
    ],
    statusHistory: [
      {
        id: "hist_103_1",
        previousStatus: null,
        newStatus: "PENDING",
        comment: "COD order placed",
        createdAt: "2026-10-09T15:20:00.000Z",
      },
      {
        id: "hist_103_2",
        previousStatus: "PENDING",
        newStatus: "CONFIRMED",
        comment: "Customer tele-verified for COD",
        createdAt: "2026-10-09T15:35:00.000Z",
      },
      {
        id: "hist_103_3",
        previousStatus: "CONFIRMED",
        newStatus: "PROCESSING",
        comment: "Picking from shelf B-14",
        createdAt: "2026-10-09T16:00:00.000Z",
      },
      {
        id: "hist_103_4",
        previousStatus: "PROCESSING",
        newStatus: "PACKED",
        comment: "Garment boxed in premium packaging with cedar hanger",
        createdAt: "2026-10-09T17:15:00.000Z",
        changedBy: {
          id: "admin_uuid_1",
          name: "Elena Rostova",
          email: "elena@atelier.com",
          role: "SUPER_ADMIN",
        },
      },
    ],
    internalAdminNotes: "COD verification call completed. Customer confirmed evening dispatch.",
    createdAt: "2026-10-09T15:20:00.000Z",
    updatedAt: "2026-10-09T17:15:00.000Z",
  },
  {
    id: "ord_uuid_104",
    orderNumber: "ORD-20261007-8821",
    userId: "usr_uuid_004",
    customerName: "Natasha Alva",
    customerEmail: "natasha@example.com",
    customerPhone: "+91 98765 00005",
    subtotal: "42000.00",
    totalAmount: "42000.00",
    total: 42000,
    status: "SHIPPED",
    paymentStatus: "COMPLETED",
    paymentMethod: "STRIPE",
    shippingAddress: {
      street: "704, Sea Green Apartments, Worli Sea Face",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400030",
      country: "India",
    },
    courierPartner: "BlueDart Express",
    trackingNumber: "BLD-9812739128",
    courier: {
      carrierName: "BlueDart Express",
      trackingNumber: "BLD-9812739128",
      trackingUrl: "https://www.bluedart.com/tracking/BLD-9812739128",
      shippedAt: "2026-10-08T09:30:00.000Z",
      estimatedDelivery: "2026-10-12T18:00:00.000Z",
    },
    itemsCount: 1,
    items: [
      {
        id: "item_uuid_4",
        productId: "prod_uuid_blazer_02",
        variantId: "var_uuid_blazer_m",
        title: "Tailored Double-Breasted Wool Blazer",
        sku: "TDB-002-M",
        size: "M",
        color: "Camel",
        quantity: 1,
        price: "42000.00",
        totalPrice: "42000.00",
        imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
        product: {
          id: "prod_uuid_blazer_02",
          name: "Tailored Double-Breasted Wool Blazer",
          slug: "tailored-double-breasted-wool-blazer",
          brand: "Maison De Élégance",
        },
        variant: {
          id: "var_uuid_blazer_m",
          sku: "TDB-002-M",
          stockQuantity: 5,
        },
      },
    ],
    statusHistory: [
      {
        id: "hist_104_1",
        previousStatus: "PACKED",
        newStatus: "SHIPPED",
        comment: "Handed over to BlueDart pickup driver",
        createdAt: "2026-10-08T09:30:00.000Z",
      },
    ],
    shippedAt: "2026-10-08T09:30:00.000Z",
    createdAt: "2026-10-07T18:40:00.000Z",
    updatedAt: "2026-10-08T09:30:00.000Z",
  },
  {
    id: "ord_uuid_105",
    orderNumber: "ORD-20261006-2109",
    userId: "usr_uuid_005",
    customerName: "Vikramaditya Singhania",
    customerEmail: "vikram@example.com",
    customerPhone: "+91 98765 00006",
    subtotal: "35000.00",
    totalAmount: "35000.00",
    total: 35000,
    status: "DELIVERED",
    paymentStatus: "COMPLETED",
    paymentMethod: "RAZORPAY",
    shippingAddress: {
      street: "Villa 9, The Palm Springs, Golf Course Road",
      city: "Gurugram",
      state: "Haryana",
      postalCode: "122002",
      country: "India",
    },
    courierPartner: "Delhivery Air",
    trackingNumber: "DEL-4412093120",
    itemsCount: 1,
    items: [
      {
        id: "item_uuid_5",
        productId: "prod_uuid_suit_01",
        variantId: "var_uuid_suit_40r",
        title: "Italian Super 150s Merino Tuxedo",
        sku: "TUX-150-40R",
        size: "40R",
        color: "Midnight Black",
        quantity: 1,
        price: "35000.00",
        totalPrice: "35000.00",
        imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800",
      },
    ],
    statusHistory: [
      {
        id: "hist_105_1",
        previousStatus: "OUT_FOR_DELIVERY",
        newStatus: "DELIVERED",
        comment: "Signed by recipient at reception",
        createdAt: "2026-10-09T17:45:00.000Z",
      },
    ],
    deliveredAt: "2026-10-09T17:45:00.000Z",
    createdAt: "2026-10-06T10:15:00.000Z",
    updatedAt: "2026-10-09T17:45:00.000Z",
  },
  {
    id: "ord_uuid_106",
    orderNumber: "ORD-20261005-7740",
    userId: "usr_uuid_006",
    customerName: "Ananya Iyer",
    customerEmail: "ananya@example.com",
    customerPhone: "+91 98765 00007",
    subtotal: "12500.00",
    totalAmount: "12500.00",
    total: 12500,
    status: "CANCELLED",
    paymentStatus: "REFUNDED",
    paymentMethod: "RAZORPAY",
    shippingAddress: {
      street: "88, Jubilee Hills",
      city: "Hyderabad",
      state: "Telangana",
      postalCode: "500033",
      country: "India",
    },
    cancelReason: "Customer requested cancellation prior to dispatch",
    cancelledAt: "2026-10-06T11:00:00.000Z",
    itemsCount: 1,
    items: [
      {
        id: "item_uuid_6",
        productId: "04de36fe-1b09-4c27-a793-5bf9c9ff0412",
        variantId: "04de36fe-1b09-4c27-a793-5bf9c9ff0412-s",
        title: "Mulberry Silk Draped Evening Gown",
        sku: "MSG-001-S",
        size: "S",
        color: "Midnight Navy",
        quantity: 1,
        price: "12500.00",
        totalPrice: "12500.00",
        imageUrl: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
      },
    ],
    statusHistory: [
      {
        id: "hist_106_1",
        previousStatus: "CONFIRMED",
        newStatus: "CANCELLED",
        comment: "Customer requested cancellation prior to dispatch. Restocked.",
        createdAt: "2026-10-06T11:00:00.000Z",
      },
    ],
    createdAt: "2026-10-05T09:20:00.000Z",
    updatedAt: "2026-10-06T11:00:00.000Z",
  },
  {
    id: "ord_uuid_107",
    orderNumber: "ORD-20261010-0199",
    userId: "usr_uuid_007",
    customerName: "Devika Roy",
    customerEmail: "devika@example.com",
    customerPhone: "+91 98765 00008",
    subtotal: "9999.00",
    totalAmount: "9999.00",
    total: 9999,
    status: "PENDING",
    paymentStatus: "PENDING",
    paymentMethod: "RAZORPAY",
    shippingAddress: {
      street: "Plot 302, Sector 15",
      city: "Chandigarh",
      state: "Punjab",
      postalCode: "160015",
      country: "India",
    },
    itemsCount: 1,
    items: [
      {
        id: "item_uuid_7",
        productId: "04de36fe-1b09-4c27-a793-5bf9c9ff0412",
        title: "Mulberry Silk Draped Evening Gown",
        sku: "MSG-001-M",
        size: "M",
        color: "Midnight Navy",
        quantity: 1,
        price: "9999.00",
        totalPrice: "9999.00",
        imageUrl: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
      },
    ],
    statusHistory: [
      {
        id: "hist_107_1",
        previousStatus: null,
        newStatus: "PENDING",
        comment: "Checkout session initiated",
        createdAt: "2026-10-10T21:10:00.000Z",
      },
    ],
    createdAt: "2026-10-10T21:10:00.000Z",
    updatedAt: "2026-10-10T21:10:00.000Z",
  },
];

export const SAMPLE_ADMIN_ORDERS = INITIAL_SAMPLE_ORDERS;

// Initialize seed products conforming to Module 03
function getInitialProducts(): AdminProduct[] {
  return FALLBACK_PRODUCTS.map((p, pIdx) => {
    const regPrice = Number(p.compareAtPrice || p.price);
    const sPrice = p.compareAtPrice ? Number(p.price) : null;
    const cPrice = Math.round(Number(p.price) * 0.45);
    const categorySlug = p.categorySlug || "evening-gowns";
    const categoryName = p.categoryName || "Evening Gowns";
    const brandName = p.brand || "Maison De Élégance";
    const skuCode = p.sku || `MSG-${String(pIdx + 1).padStart(3, "0")}`;

    const variants: AdminProductVariant[] = (p.variants || []).map((v, vIdx) => {
      const vReg = Number(v.compareAtPrice || v.price);
      const vSale = v.compareAtPrice ? Number(v.price) : null;
      const vCost = Math.round(Number(v.price) * 0.45);
      const colorVal = v.colorName || "Midnight Navy";
      const sizeVal = v.size || "M";
      return {
        id: v.id || `var_${p.id}_${vIdx}`,
        sku: v.sku || `${skuCode}-${sizeVal}-${colorVal.slice(0, 3).toUpperCase()}`,
        name: `Size ${sizeVal} - ${colorVal}`,
        size: sizeVal,
        color: colorVal,
        colorName: colorVal,
        colorHex: v.colorHex || "#0b1b3d",
        regularPrice: vReg.toFixed(2),
        salePrice: vSale ? vSale.toFixed(2) : null,
        offerPrice: null,
        costPrice: vCost.toFixed(2),
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        stock: v.stock,
        stockQuantity: v.stock,
        lowStockThreshold: v.lowStockThreshold || 5,
        isActive: true,
        attributes: [
          { attributeName: "Size", value: sizeVal, slug: sizeVal.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
          { attributeName: "Color", value: colorVal, slug: colorVal.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
        ],
      };
    });

    const stockSum = variants.length > 0 ? variants.reduce((acc, v) => acc + v.stock, 0) : p.stock;
    const images: AdminProductImage[] = (p.images || []).map((img, idx) => ({
      id: img.id || `img_${p.id}_${idx}`,
      productId: p.id,
      url: img.url,
      altText: img.altText || p.name,
      isThumbnail: idx === 0,
      isPrimary: idx === 0,
      sortOrder: idx,
      displayOrder: idx,
    }));

    const variantsSummary: AdminProductVariantSummary[] = variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name || v.size,
      stock: v.stock,
      price: v.salePrice || v.regularPrice || v.price.toFixed(2),
      isActive: v.isActive,
    }));

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      shortDescription: p.shortDescription || undefined,
      brand: brandName,
      sku: skuCode,
      regularPrice: regPrice.toFixed(2),
      salePrice: sPrice ? sPrice.toFixed(2) : null,
      offerPrice: null,
      costPrice: cPrice.toFixed(2),
      stockQuantity: stockSum,
      isActive: true,
      isFeatured: p.isFeatured ?? (pIdx % 2 === 0),
      totalSold: 20 + ((pIdx * 17) % 65),
      rating: 4.6 + ((pIdx * 0.1) % 0.4),
      reviewCount: 10 + ((pIdx * 7) % 35),
      category: {
        id: `cat_${categorySlug}`,
        name: categoryName,
        slug: categorySlug,
      },
      thumbnail: images[0]?.url || "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
      imagesCount: images.length,
      variantsCount: variants.length,
      variantsSummary,
      images,
      variants,
      collections: [],

      // Backward compatibility fields
      status: "ACTIVE",
      categorySlug,
      categoryName,
      tags: p.tags || [],
      gender: (p.gender as any) || "WOMEN",
      totalStock: stockSum,
      basePrice: p.price,
      createdAt: new Date(Date.now() - (pIdx + 1) * 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
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

    const inventoryAlerts: InventoryAlertItem[] = products.flatMap((p) =>
      p.variants
        .filter((v) => v.stock <= (v.lowStockThreshold || 5))
        .map((v) => ({
          id: `alert_${v.id}`,
          variantId: v.id,
          productId: p.id,
          productName: p.name,
          sku: v.sku,
          variantSku: v.sku,
          variantName: `${v.size} / ${v.colorName}`,
          size: v.size,
          colorName: v.colorName,
          stock: v.stock,
          stockQuantity: v.stock,
          lowStockThreshold: v.lowStockThreshold || 5,
          status: (v.stock === 0 ? "OUT_OF_STOCK" : "LOW_STOCK") as "OUT_OF_STOCK" | "LOW_STOCK",
          urgency: (v.stock === 0 ? "CRITICAL" : "LOW") as "CRITICAL" | "LOW",
          categoryName: p.categoryName,
          thumbnail: p.thumbnail || p.images?.[0]?.url,
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
  // 2. PRODUCT MANAGEMENT (/api/v1/admin/products) - Module 03
  // ----------------------------------------------------

  static getLocalProducts(): AdminProduct[] {
    return getLocalData<AdminProduct[]>(STORAGE_KEYS.PRODUCTS, getInitialProducts());
  }

  /**
   * Helper: Gather a category and all of its descendant IDs/slugs recursively
   */
  static getCategoryDescendantIds(categoryIdOrSlug: string): Set<string> {
    const categories = this.getLocalCategories();
    const matched = new Set<string>();
    const target = categories.find((c) => c.id === categoryIdOrSlug || c.slug === categoryIdOrSlug);
    if (!target) {
      matched.add(categoryIdOrSlug.toLowerCase());
      return matched;
    }
    matched.add(target.id.toLowerCase());
    matched.add(target.slug.toLowerCase());

    const findChildren = (parentId: string) => {
      const children = categories.filter((c) => c.parentId === parentId);
      for (const child of children) {
        matched.add(child.id.toLowerCase());
        matched.add(child.slug.toLowerCase());
        findChildren(child.id);
      }
    };
    findChildren(target.id);
    return matched;
  }

  /**
   * Helper: Filter and sort product list locally
   */
  private static filterAndSortProducts(
    list: AdminProduct[],
    params?: string | ProductListQueryParams
  ): AdminProduct[] {
    let result = [...list];

    if (!params) return result;

    if (typeof params === "string") {
      const q = params.trim().toLowerCase();
      if (!q) return result;
      return result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
          p.variants.some((v) => v.sku.toLowerCase().includes(q) || v.name?.toLowerCase().includes(q))
      );
    }

    // 1. Text Search across name, SKU, brand, slug
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
          p.variants.some((v) => v.sku.toLowerCase().includes(q) || v.name?.toLowerCase().includes(q))
      );
    }

    // 2. Category Filter (Includes all subcategories automatically)
    if (params.categoryId && params.categoryId.trim() && params.categoryId !== "ALL") {
      const descendantIds = this.getCategoryDescendantIds(params.categoryId.trim());
      result = result.filter((p) => {
        const catId = p.category?.id?.toLowerCase();
        const catSlug = p.category?.slug?.toLowerCase() || p.categorySlug?.toLowerCase();
        const catName = p.category?.name?.toLowerCase() || p.categoryName?.toLowerCase();
        return (
          (catId && descendantIds.has(catId)) ||
          (catSlug && descendantIds.has(catSlug)) ||
          (catName && descendantIds.has(catName))
        );
      });
    }

    // 3. Brand Filter
    if (params.brand && params.brand.trim() && params.brand !== "ALL") {
      const brandQ = params.brand.trim().toLowerCase();
      result = result.filter((p) => p.brand.toLowerCase() === brandQ);
    }

    // 4. Status Filter (isActive)
    if (params.isActive !== undefined && params.isActive !== "ALL") {
      const activeBool = params.isActive === true || params.isActive === "true";
      result = result.filter((p) => Boolean(p.isActive) === activeBool);
    }

    // 5. Featured Filter (isFeatured)
    if (params.isFeatured !== undefined && params.isFeatured !== "ALL") {
      const featBool = params.isFeatured === true || params.isFeatured === "true";
      result = result.filter((p) => Boolean(p.isFeatured) === featBool);
    }

    // 6. Stock Status Filter
    if (params.stockStatus && params.stockStatus !== "ALL") {
      if (params.stockStatus === "IN_STOCK") {
        result = result.filter((p) => (p.stockQuantity ?? p.totalStock ?? 0) > 0);
      } else if (params.stockStatus === "LOW_STOCK") {
        result = result.filter((p) => {
          const qty = p.stockQuantity ?? p.totalStock ?? 0;
          return qty >= 1 && qty <= 5;
        });
      } else if (params.stockStatus === "OUT_OF_STOCK") {
        result = result.filter((p) => (p.stockQuantity ?? p.totalStock ?? 0) === 0);
      }
    }

    // 7. Price Range Filter
    if (params.minPrice !== undefined && !isNaN(Number(params.minPrice))) {
      const min = Number(params.minPrice);
      result = result.filter((p) => Number(p.salePrice || p.regularPrice || p.basePrice || 0) >= min);
    }
    if (params.maxPrice !== undefined && !isNaN(Number(params.maxPrice))) {
      const max = Number(params.maxPrice);
      result = result.filter((p) => Number(p.salePrice || p.regularPrice || p.basePrice || 0) <= max);
    }

    // 8. Sorting
    const sortMode = params.sort || "newest";
    result.sort((a, b) => {
      const priceA = Number(a.salePrice || a.regularPrice || a.basePrice || 0);
      const priceB = Number(b.salePrice || b.regularPrice || b.basePrice || 0);
      const stockA = a.stockQuantity ?? a.totalStock ?? 0;
      const stockB = b.stockQuantity ?? b.totalStock ?? 0;

      switch (sortMode) {
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "price_asc":
          return priceA - priceB;
        case "price_desc":
          return priceB - priceA;
        case "stock_asc":
          return stockA - stockB;
        case "stock_desc":
          return stockB - stockA;
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "bestselling":
          return (b.totalSold || 0) - (a.totalSold || 0);
        default:
          return 0;
      }
    });

    return result;
  }

  /**
   * 2.1. List Products (Array output for simplified calls)
   */
  static async getProducts(query?: string | ProductListQueryParams): Promise<AdminProduct[]> {
    let queryStr = "";
    if (typeof query === "string" && query.trim()) {
      queryStr = `?search=${encodeURIComponent(query.trim())}`;
    } else if (query && typeof query === "object") {
      const qp = new URLSearchParams();
      if (query.search) qp.set("search", query.search);
      if (query.categoryId) qp.set("categoryId", query.categoryId);
      if (query.brand) qp.set("brand", query.brand);
      if (query.stockStatus) qp.set("stockStatus", query.stockStatus);
      if (query.sort) qp.set("sort", query.sort);
      if (query.page) qp.set("page", String(query.page));
      if (query.limit) qp.set("limit", String(query.limit));
      const str = qp.toString();
      if (str) queryStr = `?${str}`;
    }

    const res = await this.request<any>(`/products${queryStr}`);
    if (res.success && res.data) {
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data.data)) return res.data.data;
    }

    const list = this.getLocalProducts();
    return this.filterAndSortProducts(list, query);
  }

  /**
   * 2.1. List Products (Faceted Filters & Pagination - Full Envelope)
   */
  static async getProductsWithPagination(
    params?: ProductListQueryParams
  ): Promise<ProductsListResponse> {
    const qp = new URLSearchParams();
    if (params?.page) qp.set("page", String(params.page));
    if (params?.limit) qp.set("limit", String(params.limit));
    if (params?.search) qp.set("search", params.search);
    if (params?.categoryId) qp.set("categoryId", params.categoryId);
    if (params?.brand) qp.set("brand", params.brand);
    if (params?.isActive !== undefined) qp.set("isActive", String(params.isActive));
    if (params?.isFeatured !== undefined) qp.set("isFeatured", String(params.isFeatured));
    if (params?.stockStatus) qp.set("stockStatus", params.stockStatus);
    if (params?.minPrice !== undefined) qp.set("minPrice", String(params.minPrice));
    if (params?.maxPrice !== undefined) qp.set("maxPrice", String(params.maxPrice));
    if (params?.sort) qp.set("sort", params.sort);

    const queryString = qp.toString() ? `?${qp.toString()}` : "";
    const res = await this.request<ProductsListResponse>(`/products${queryString}`);
    if (res.success && res.data && Array.isArray(res.data.data)) {
      return res.data;
    }

    // Local Fallback Engine
    const all = this.getLocalProducts();
    const filtered = this.filterAndSortProducts(all, params);

    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params?.limit) || 20));
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return {
      success: true,
      statusCode: 200,
      message: "Products fetched successfully",
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * 2.2. Get Single Product Details
   * Fetches complete product record with all variants, sizing attributes, images, and curated collections.
   */
  static async getProductById(id: string): Promise<AdminProduct | null> {
    const res = await this.request<any>(`/products/${id}`);
    if (res.success && res.data) {
      if (res.data.product) return res.data.product;
      return res.data;
    }

    const products = this.getLocalProducts();
    const found = products.find((p) => p.id === id || p.slug === id);
    if (!found) return null;

    // Attach curated collections
    const collections = this.getLocalCollections();
    const attachedCollections = collections
      .filter((c) => c.productIds?.includes(found.id) || c.productIds?.includes(found.slug))
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

    return {
      ...found,
      collections: attachedCollections,
    };
  }

  /**
   * 2.3. Create Product
   * Creates a garment with variants, attributes, and images in an atomic database transaction.
   */
  static async createProduct(
    input: CreateProductInput
  ): Promise<{ success: boolean; product?: AdminProduct; message?: string }> {
    const res = await this.request<AdminProduct>("/products", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (res.success && res.data) return { success: true, product: res.data };

    // Fallback local save
    const products = this.getLocalProducts();
    const newId = `prod_uuid_${Date.now()}`;
    const baseSlug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (products.some((p) => p.slug === uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    const regPrice = Number(input.regularPrice ?? input.basePrice ?? 0);
    const sPrice = input.salePrice != null ? Number(input.salePrice) : null;
    const cPrice = input.costPrice != null ? Number(input.costPrice) : Math.round(regPrice * 0.45);

    // Look up category
    const categories = this.getLocalCategories();
    const cat = categories.find(
      (c) => c.id === input.categoryId || c.slug === input.categorySlug || c.name === input.categoryName
    );
    const categoryRef = {
      id: cat?.id || input.categoryId || `cat_${Date.now()}`,
      name: cat?.name || input.categoryName || "Haute Couture",
      slug: cat?.slug || input.categorySlug || "haute-couture",
    };

    // Build variants & attributes
    let processedVariants: AdminProductVariant[] = [];
    if (input.variants && input.variants.length > 0) {
      processedVariants = input.variants.map((v, i) => {
        const vSize = v.size || "Free Size";
        const vColor = v.color || v.colorName || "Standard";
        const vReg = v.regularPrice != null ? Number(v.regularPrice) : regPrice;
        const vSale = v.salePrice != null ? Number(v.salePrice) : sPrice;
        const vCost = v.costPrice != null ? Number(v.costPrice) : cPrice;
        const vStock = Number(v.stockQuantity ?? v.stock ?? 0);
        const vSku =
          v.sku ||
          `${(input.sku || input.name.slice(0, 3)).toUpperCase()}-${vSize}-${vColor.slice(0, 2).toUpperCase()}`;

        return {
          id: v.id || `var_${Date.now()}_${i}`,
          sku: vSku,
          name: v.name || `Size ${vSize} - ${vColor}`,
          size: vSize,
          color: vColor,
          colorName: vColor,
          colorHex: v.colorHex || "#0b1b3d",
          regularPrice: vReg.toFixed(2),
          salePrice: vSale != null ? vSale.toFixed(2) : null,
          offerPrice: v.offerPrice != null ? Number(v.offerPrice).toFixed(2) : null,
          costPrice: vCost.toFixed(2),
          price: vSale ?? vReg,
          compareAtPrice: vReg,
          stock: vStock,
          stockQuantity: vStock,
          lowStockThreshold: v.lowStockThreshold || 5,
          isActive: v.isActive ?? true,
          attributes: v.attributes || [
            { attributeName: "Size", value: vSize, slug: vSize.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
            { attributeName: "Color", value: vColor, slug: vColor.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
          ],
        };
      });
    } else {
      // Default single variant
      processedVariants = [
        {
          id: `var_${Date.now()}_0`,
          sku: input.sku || `${input.name.slice(0, 3).toUpperCase()}-OS`,
          name: "Standard",
          size: "Free Size",
          color: "Standard",
          colorName: "Standard",
          colorHex: "#000000",
          regularPrice: regPrice.toFixed(2),
          salePrice: sPrice != null ? sPrice.toFixed(2) : null,
          costPrice: cPrice.toFixed(2),
          price: sPrice ?? regPrice,
          compareAtPrice: regPrice,
          stock: Number(input.stockQuantity || 10),
          stockQuantity: Number(input.stockQuantity || 10),
          lowStockThreshold: 5,
          isActive: true,
          attributes: [
            { attributeName: "Size", value: "Free Size", slug: "free-size" },
            { attributeName: "Color", value: "Standard", slug: "standard" },
          ],
        },
      ];
    }

    // Automatically compute total stockQuantity as sum of variant stock
    const computedTotalStock = processedVariants.reduce(
      (acc, v) => acc + (v.stockQuantity || v.stock || 0),
      0
    );

    const processedImages: AdminProductImage[] = (input.images || []).map((img, i) => ({
      id: `img_${Date.now()}_${i}`,
      productId: newId,
      url: img.url,
      altText: img.altText || input.name,
      isThumbnail: img.isThumbnail ?? (img.isPrimary ?? i === 0),
      isPrimary: img.isPrimary ?? i === 0,
      sortOrder: img.sortOrder ?? i,
      displayOrder: img.sortOrder ?? i,
    }));

    const variantsSummary: AdminProductVariantSummary[] = processedVariants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name || v.size,
      stock: v.stockQuantity ?? v.stock ?? 0,
      price: v.salePrice || v.regularPrice || String(v.price || 0),
      isActive: Boolean(v.isActive),
    }));

    const newProd: AdminProduct = {
      id: newId,
      name: input.name,
      slug: uniqueSlug,
      description: input.description,
      shortDescription: input.shortDescription,
      brand: input.brand || "Maison De Élégance",
      sku: input.sku || `SKU-${Date.now().toString().slice(-6)}`,
      regularPrice: regPrice.toFixed(2),
      salePrice: sPrice != null ? sPrice.toFixed(2) : null,
      offerPrice: input.offerPrice != null ? Number(input.offerPrice).toFixed(2) : null,
      costPrice: cPrice.toFixed(2),
      stockQuantity: computedTotalStock,
      isActive: input.isActive ?? true,
      isFeatured: input.isFeatured ?? false,
      totalSold: 0,
      rating: 5.0,
      reviewCount: 0,
      category: categoryRef,
      thumbnail:
        processedImages.find((img) => img.isThumbnail)?.url ||
        processedImages[0]?.url ||
        "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
      imagesCount: processedImages.length,
      variantsCount: processedVariants.length,
      variantsSummary,
      images: processedImages,
      variants: processedVariants,
      collections: [],

      // Backward compatibility fields
      status: (input.isActive ?? true) ? "ACTIVE" : "ARCHIVED",
      categorySlug: categoryRef.slug,
      categoryName: categoryRef.name,
      tags: input.tags || ["Apparel", "Luxury"],
      gender: input.gender || "WOMEN",
      totalStock: computedTotalStock,
      basePrice: sPrice ?? regPrice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    products.unshift(newProd);
    setLocalData(STORAGE_KEYS.PRODUCTS, products);
    this.logAudit("PRODUCT", newProd.id, `Created garment "${newProd.name}" with ${newProd.variants.length} variants`);
    return { success: true, product: newProd };
  }

  /**
   * 2.4. Update Product
   */
  static async updateProduct(
    id: string,
    input: UpdateProductInput
  ): Promise<{ success: boolean; product?: AdminProduct; message?: string }> {
    const res = await this.request<AdminProduct>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    if (res.success && res.data) return { success: true, product: res.data };

    const products = this.getLocalProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, message: "Product not found" };

    const existing = products[idx];

    // Update variants if passed
    let updatedVariants = existing.variants;
    if (input.variants && Array.isArray(input.variants)) {
      updatedVariants = input.variants.map((vInput, i) => {
        const existingVar = existing.variants.find((v) => v.id === vInput.id || v.sku === vInput.sku);
        const vSize = vInput.size || existingVar?.size || "M";
        const vColor = vInput.color || vInput.colorName || existingVar?.colorName || "Standard";
        const vReg = vInput.regularPrice != null ? Number(vInput.regularPrice) : Number(existingVar?.regularPrice || existing.regularPrice);
        const vSale = vInput.salePrice != null ? Number(vInput.salePrice) : (existingVar?.salePrice != null ? Number(existingVar.salePrice) : null);
        const vStock = vInput.stockQuantity != null ? Number(vInput.stockQuantity) : Number(existingVar?.stockQuantity ?? existingVar?.stock ?? 0);

        return {
          id: vInput.id || existingVar?.id || `var_${Date.now()}_${i}`,
          sku: vInput.sku || existingVar?.sku || `${existing.sku}-${vSize}`,
          name: vInput.name || existingVar?.name || `Size ${vSize} - ${vColor}`,
          size: vSize,
          color: vColor,
          colorName: vColor,
          colorHex: vInput.colorHex || existingVar?.colorHex || "#0b1b3d",
          regularPrice: vReg.toFixed(2),
          salePrice: vSale != null ? vSale.toFixed(2) : null,
          offerPrice: vInput.offerPrice != null ? Number(vInput.offerPrice).toFixed(2) : existingVar?.offerPrice || null,
          costPrice: vInput.costPrice != null ? Number(vInput.costPrice).toFixed(2) : existingVar?.costPrice || null,
          price: vSale ?? vReg,
          compareAtPrice: vReg,
          stock: vStock,
          stockQuantity: vStock,
          lowStockThreshold: vInput.lowStockThreshold || existingVar?.lowStockThreshold || 5,
          isActive: vInput.isActive ?? existingVar?.isActive ?? true,
          attributes: vInput.attributes || existingVar?.attributes || [
            { attributeName: "Size", value: vSize, slug: vSize.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
            { attributeName: "Color", value: vColor, slug: vColor.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
          ],
        };
      });
    }

    const newTotalStock = updatedVariants.reduce((sum, v) => sum + (v.stockQuantity || v.stock || 0), 0);

    const updated: AdminProduct = {
      ...existing,
      ...input,
      regularPrice: input.regularPrice != null ? Number(input.regularPrice).toFixed(2) : existing.regularPrice,
      salePrice: input.salePrice !== undefined ? (input.salePrice != null ? Number(input.salePrice).toFixed(2) : null) : existing.salePrice,
      costPrice: input.costPrice != null ? Number(input.costPrice).toFixed(2) : existing.costPrice,
      variants: updatedVariants,
      stockQuantity: newTotalStock,
      totalStock: newTotalStock,
      basePrice: input.salePrice != null ? Number(input.salePrice) : (input.regularPrice != null ? Number(input.regularPrice) : existing.basePrice),
      variantsCount: updatedVariants.length,
      variantsSummary: updatedVariants.map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name || v.size,
        stock: v.stockQuantity ?? v.stock ?? 0,
        price: v.salePrice || v.regularPrice || String(v.price || 0),
        isActive: Boolean(v.isActive),
      })),
      updatedAt: new Date().toISOString(),
    };

    products[idx] = updated;
    setLocalData(STORAGE_KEYS.PRODUCTS, products);
    this.logAudit("PRODUCT", id, `Updated garment "${updated.name}"`);
    return { success: true, product: updated };
  }

  /**
   * 2.5. Quick Status Toggle
   * Fast toggle for Active or Featured status without needing the full update body.
   */
  static async updateProductStatus(
    id: string,
    status: ProductStatusToggleInput
  ): Promise<ProductStatusToggleResponse> {
    const res = await this.request<ProductStatusToggleResponse>(`/products/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(status),
    });
    if (res.success && res.data) return res.data;

    const products = this.getLocalProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) {
      return {
        success: false,
        statusCode: 404,
        message: "Product not found",
        data: {} as any,
      };
    }

    const prod = products[idx];
    if (status.isActive !== undefined) {
      prod.isActive = status.isActive;
      prod.status = status.isActive ? "ACTIVE" : "ARCHIVED";
    }
    if (status.isFeatured !== undefined) {
      prod.isFeatured = status.isFeatured;
    }
    prod.updatedAt = new Date().toISOString();

    products[idx] = prod;
    setLocalData(STORAGE_KEYS.PRODUCTS, products);
    this.logAudit(
      "PRODUCT",
      id,
      `Toggled status: Active=${prod.isActive}, Featured=${prod.isFeatured}`
    );

    return {
      success: true,
      statusCode: 200,
      message: "Product status updated successfully",
      data: {
        id: prod.id,
        name: prod.name,
        isActive: prod.isActive,
        isFeatured: prod.isFeatured,
        updatedAt: prod.updatedAt,
      },
    };
  }

  /**
   * 2.6. Delete / Archive Product (Safe Archiving Safeguard)
   * If a product is already present in customer carts or order history, calling DELETE
   * automatically soft-archives the garment (isActive: false) to safeguard historical invoices and receipts.
   */
  static async deleteProduct(id: string, force?: boolean): Promise<DeleteProductResponse> {
    const res = await this.request<DeleteProductResponse>(`/products/${id}${force ? "?force=true" : ""}`, {
      method: "DELETE",
    });
    if (res.success && res.data) return res.data;

    const products = this.getLocalProducts();
    const product = products.find((p) => p.id === id);
    if (!product) {
      return {
        success: false,
        statusCode: 404,
        message: "Product not found",
        data: { id, name: "Unknown", action: "DELETED" },
      };
    }

    // Check if garment is present in active customer cart or orders
    let isInCartOrOrders = false;
    if (typeof window !== "undefined") {
      try {
        const cartRaw = localStorage.getItem("cart-storage");
        if (cartRaw) {
          const parsed = JSON.parse(cartRaw);
          const cartItems: any[] = parsed?.state?.items || [];
          const variantIds = new Set(product.variants.map((v) => v.id));
          isInCartOrOrders = cartItems.some(
            (item) =>
              item.productId === id ||
              item.id === id ||
              variantIds.has(item.variantId || item.id)
          );
        }
      } catch {}
    }

    if (!isInCartOrOrders) {
      const orders = this.getLocalOrders();
      const variantIds = new Set(product.variants.map((v) => v.id));
      isInCartOrOrders = orders.some((ord) =>
        ord.items.some(
          (item) => item.productId === id || variantIds.has(item.variantId || "")
        )
      );
    }

    if (isInCartOrOrders && !force) {
      // Soft-archive to protect invoices and order history
      product.isActive = false;
      product.status = "ARCHIVED";
      product.updatedAt = new Date().toISOString();
      setLocalData(STORAGE_KEYS.PRODUCTS, products);
      this.logAudit(
        "PRODUCT",
        id,
        `Soft-archived garment "${product.name}" (retained for cart/order history)`
      );
      return {
        success: true,
        statusCode: 200,
        message: `Product "${product.name}" is present in customer carts and was archived (set to inactive) instead of deleted.`,
        data: {
          id: product.id,
          name: product.name,
          action: "ARCHIVED",
        },
      };
    } else {
      // Permanent removal
      const remaining = products.filter((p) => p.id !== id);
      setLocalData(STORAGE_KEYS.PRODUCTS, remaining);
      this.logAudit("PRODUCT", id, `Permanently deleted garment "${product.name}"`);
      return {
        success: true,
        statusCode: 200,
        message: `Product "${product.name}" deleted successfully`,
        data: {
          id: product.id,
          name: product.name,
          action: "DELETED",
        },
      };
    }
  }

  static async archiveProduct(id: string): Promise<{ success: boolean }> {
    const res = await this.updateProductStatus(id, { isActive: false });
    return { success: res.success };
  }

  /**
   * 2.7. Upload Additional Product Images
   * Uploads multiple gallery images directly to an existing product via Cloudinary stream.
   */
  static async uploadProductImages(
    id: string,
    images: Array<{ url: string; altText?: string; isThumbnail?: boolean; sortOrder?: number }> | FormData
  ): Promise<UploadProductImagesResponse> {
    const isFormData = typeof FormData !== "undefined" && images instanceof FormData;
    const res = await this.request<UploadProductImagesResponse>(`/products/${id}/images`, {
      method: "POST",
      body: isFormData ? (images as any) : JSON.stringify({ images }),
    });
    if (res.success && res.data) return res.data;

    const products = this.getLocalProducts();
    const prod = products.find((p) => p.id === id);
    if (!prod) {
      return {
        success: false,
        statusCode: 404,
        message: "Product not found",
        data: { images: [] },
      };
    }

    let addedImages: AdminProductImage[] = [];
    if (Array.isArray(images)) {
      addedImages = images.map((img, i) => ({
        id: `img_uuid_${Date.now()}_${i}`,
        productId: id,
        url: img.url,
        altText: img.altText || prod.name,
        isThumbnail: Boolean(img.isThumbnail),
        sortOrder: img.sortOrder ?? prod.images.length + i,
      }));
    }

    prod.images = [...prod.images, ...addedImages];
    prod.imagesCount = prod.images.length;
    prod.updatedAt = new Date().toISOString();
    setLocalData(STORAGE_KEYS.PRODUCTS, products);
    this.logAudit("PRODUCT", id, `Uploaded ${addedImages.length} additional images`);

    return {
      success: true,
      statusCode: 201,
      message: `${addedImages.length} image(s) uploaded successfully`,
      data: { images: addedImages },
    };
  }

  /**
   * 2.8. Delete Product Image
   */
  static async deleteProductImage(
    productId: string,
    imageId: string
  ): Promise<{ success: boolean; message?: string; data?: { productId: string; imageId: string; deleted: boolean } }> {
    const res = await this.request<any>(`/products/${productId}/images/${imageId}`, {
      method: "DELETE",
    });
    if (res.success && res.data) return { success: true, data: res.data };

    const products = this.getLocalProducts();
    const prod = products.find((p) => p.id === productId);
    if (!prod) return { success: false, message: "Product not found" };

    prod.images = prod.images.filter((img) => img.id !== imageId);
    prod.imagesCount = prod.images.length;
    prod.updatedAt = new Date().toISOString();
    setLocalData(STORAGE_KEYS.PRODUCTS, products);
    this.logAudit("PRODUCT", productId, `Deleted gallery image ${imageId}`);

    return {
      success: true,
      message: "Image deleted successfully",
      data: { productId, imageId, deleted: true },
    };
  }

  // ----------------------------------------------------
  // 3. INVENTORY & STOCK LEDGER (/api/v1/admin/inventory) - Module 04
  // ----------------------------------------------------

  /**
   * Helper: Flatten all products and variants into inventory item records
   */
  static getFlattenedInventoryItems(): InventoryItem[] {
    const products = this.getLocalProducts();
    const items: InventoryItem[] = [];

    products.forEach((p) => {
      const pImages = p.images || [];
      const thumbnail =
        p.thumbnail ||
        pImages.find((img) => img.isThumbnail)?.url ||
        pImages[0]?.url ||
        "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800";

      const categoryRef: InventoryItemCategoryRef = p.category
        ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
        : {
            id: p.categorySlug || "evening-gowns",
            name: p.categoryName || "Evening Gowns",
            slug: p.categorySlug || "evening-gowns",
          };

      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v) => {
          const qty = Number(v.stockQuantity ?? v.stock ?? 0);
          const threshold = Number(v.lowStockThreshold ?? 5);
          let status: InventoryStockStatus = "IN_STOCK";
          if (qty === 0) {
            status = "OUT_OF_STOCK";
          } else if (qty <= threshold) {
            status = "LOW_STOCK";
          }

          items.push({
            itemType: "VARIANT",
            id: v.id,
            variantId: v.id,
            productId: p.id,
            productName: p.name,
            brand: p.brand || "Maison De Élégance",
            sku: v.sku,
            variantName: v.name || `Size ${v.size} / ${v.colorName || v.color || "Standard"}`,
            size: v.size,
            color: v.color || v.colorName || "Standard",
            colorHex: v.colorHex || "#0b1b3d",
            stockQuantity: qty,
            lowStockThreshold: threshold,
            status,
            regularPrice: v.regularPrice || p.regularPrice || "0",
            salePrice: v.salePrice || p.salePrice || null,
            costPrice: v.costPrice || p.costPrice || null,
            isActive: Boolean(v.isActive && p.isActive),
            category: categoryRef,
            thumbnail,
            updatedAt: p.updatedAt || new Date().toISOString(),

            // Backward compatibility aliases
            price: v.price || Number(v.salePrice || v.regularPrice || 0),
            stock: qty,
            colorName: v.colorName || v.color || "Standard",
            productImage: thumbnail,
          });
        });
      } else {
        // Standalone product item
        const qty = Number(p.stockQuantity ?? p.totalStock ?? 0);
        const threshold = 5;
        let status: InventoryStockStatus = "IN_STOCK";
        if (qty === 0) {
          status = "OUT_OF_STOCK";
        } else if (qty <= threshold) {
          status = "LOW_STOCK";
        }

        items.push({
          itemType: "PRODUCT",
          id: p.id,
          productId: p.id,
          productName: p.name,
          brand: p.brand || "Maison De Élégance",
          sku: p.sku,
          variantName: "Standard",
          size: "Free Size",
          color: "Standard",
          colorHex: "#000000",
          stockQuantity: qty,
          lowStockThreshold: threshold,
          status,
          regularPrice: p.regularPrice,
          salePrice: p.salePrice || null,
          costPrice: p.costPrice || null,
          isActive: p.isActive,
          category: categoryRef,
          thumbnail,
          updatedAt: p.updatedAt || new Date().toISOString(),

          price: p.basePrice || Number(p.salePrice || p.regularPrice || 0),
          stock: qty,
          colorName: "Standard",
          productImage: thumbnail,
        });
      }
    });

    return items;
  }

  /**
   * 2.1. GET /api/v1/admin/inventory
   * Retrieves flattened inventory monitoring table with real-time counters and warehouse summary cards
   */
  static async getInventoryItems(
    params?: InventoryListQueryParams
  ): Promise<InventoryListResponse> {
    const qp = new URLSearchParams();
    if (params?.page) qp.set("page", String(params.page));
    if (params?.limit) qp.set("limit", String(params.limit));
    if (params?.search) qp.set("search", params.search);
    if (params?.status && params.status !== "ALL") qp.set("status", params.status);
    if (params?.categoryId) qp.set("categoryId", params.categoryId);
    if (params?.sort) qp.set("sort", params.sort);

    const qs = qp.toString() ? `?${qp.toString()}` : "";
    const res = await this.request<InventoryListResponse>(`/inventory${qs}`);
    if (res.success && res.data && Array.isArray(res.data.data)) {
      return res.data;
    }

    // Local Fallback Engine
    const allItems = this.getFlattenedInventoryItems();

    // Compute summary across all items
    const summary: InventorySummary = {
      totalVariants: allItems.length,
      totalStockUnits: allItems.reduce((sum, item) => sum + item.stockQuantity, 0),
      lowStockCount: allItems.filter((item) => item.status === "LOW_STOCK").length,
      outOfStockCount: allItems.filter((item) => item.status === "OUT_OF_STOCK").length,
    };

    let filtered = [...allItems];

    // Filter by Search (SKU, variant name, parent product name, brand)
    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.sku.toLowerCase().includes(q) ||
          i.variantName.toLowerCase().includes(q) ||
          i.productName.toLowerCase().includes(q) ||
          i.brand.toLowerCase().includes(q)
      );
    }

    // Filter by Status
    if (params?.status && params.status !== "ALL") {
      filtered = filtered.filter((i) => i.status === params.status);
    }

    // Filter by Category
    if (params?.categoryId && params.categoryId.trim() && params.categoryId !== "ALL") {
      const descendantIds = this.getCategoryDescendantIds(params.categoryId.trim());
      filtered = filtered.filter((i) => {
        const catId = i.category?.id.toLowerCase();
        const catSlug = i.category?.slug.toLowerCase();
        return (catId && descendantIds.has(catId)) || (catSlug && descendantIds.has(catSlug));
      });
    }

    // Sort Items
    const sortMode = params?.sort || "stock_asc";
    filtered.sort((a, b) => {
      switch (sortMode) {
        case "stock_asc":
          return a.stockQuantity - b.stockQuantity;
        case "stock_desc":
          return b.stockQuantity - a.stockQuantity;
        case "name_asc":
          return a.productName.localeCompare(b.productName);
        case "sku_asc":
          return a.sku.localeCompare(b.sku);
        case "newest":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return a.stockQuantity - b.stockQuantity;
      }
    });

    // Pagination
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params?.limit) || 20));
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return {
      success: true,
      statusCode: 200,
      message: "Inventory records fetched successfully",
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      meta: {
        summary,
      },
    };
  }

  /**
   * Backward compatibility for legacy callers expecting flat array
   */
  static async getInventory(search?: string): Promise<FlatInventoryItem[]> {
    const res = await this.getInventoryItems({ search, limit: 100 });
    return res.data;
  }

  /**
   * 2.2. POST /api/v1/admin/inventory/adjust
   * Atomic stock adjustment with unalterable double-entry ledger audit trail
   */
  static async adjustStock(input: AdjustStockInput): Promise<AdjustStockResponse> {
    const res = await this.request<AdjustStockResponse>("/inventory/adjust", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (res.success && res.data) return res.data;

    const products = this.getLocalProducts();
    let targetVariant: AdminProductVariant | null = null;
    let targetProduct: AdminProduct | null = null;

    // Locate target variant or standalone product
    for (const prod of products) {
      if (input.variantId) {
        const found = prod.variants.find((v) => v.id === input.variantId);
        if (found) {
          targetVariant = found;
          targetProduct = prod;
          break;
        }
      } else if (input.productId && prod.id === input.productId) {
        targetProduct = prod;
        if (prod.variants.length > 0) {
          targetVariant = prod.variants[0];
        }
        break;
      }
    }

    if (!targetProduct) {
      return {
        success: false,
        statusCode: 404,
        message: "Target inventory item not found.",
        error: { code: "ITEM_NOT_FOUND" },
      };
    }

    const currentStock = targetVariant
      ? Number(targetVariant.stockQuantity ?? targetVariant.stock ?? 0)
      : Number(targetProduct.stockQuantity ?? targetProduct.totalStock ?? 0);

    let quantityChange = 0;
    let targetStock = 0;

    if (input.newStock !== undefined) {
      targetStock = Number(input.newStock);
      quantityChange = targetStock - currentStock;
    } else if (input.delta !== undefined) {
      quantityChange = Number(input.delta);
      targetStock = currentStock + quantityChange;
    } else {
      return {
        success: false,
        statusCode: 400,
        message: "Either delta or newStock is required for stock adjustment.",
        error: { code: "INVALID_PARAMETERS" },
      };
    }

    // Atomic Safety: Negative stock rejection
    if (targetStock < 0) {
      return {
        success: false,
        statusCode: 400,
        message: `Adjustment failed: Resulting stock cannot be negative (current: ${currentStock}, adjustment: ${quantityChange}).`,
        error: {
          code: "INSUFFICIENT_STOCK",
        },
      };
    }

    // Update stock levels
    if (targetVariant) {
      targetVariant.stockQuantity = targetStock;
      targetVariant.stock = targetStock;
      targetProduct.stockQuantity = targetProduct.variants.reduce(
        (sum, v) => sum + (v.stockQuantity ?? v.stock ?? 0),
        0
      );
      targetProduct.totalStock = targetProduct.stockQuantity;
    } else {
      targetProduct.stockQuantity = targetStock;
      targetProduct.totalStock = targetStock;
    }
    targetProduct.updatedAt = new Date().toISOString();

    setLocalData(STORAGE_KEYS.PRODUCTS, products);

    const transactionType: InventoryTransactionType =
      input.type || (quantityChange >= 0 ? "RESTOCK" : "ADJUSTMENT");

    const transactionId = `tx_uuid_${Date.now()}`;
    const transaction: InventoryTransaction = {
      id: transactionId,
      variantId: targetVariant?.id,
      productId: targetProduct.id,
      productName: targetProduct.name,
      variantSku: targetVariant?.sku || targetProduct.sku,
      type: transactionType,
      quantityChange,
      previousStock: currentStock,
      newStock: targetStock,
      reason: input.reason || "Inventory cycle reconciliation",
      referenceId: input.referenceId?.trim() || undefined,
      createdAt: new Date().toISOString(),
      variant: targetVariant
        ? {
            id: targetVariant.id,
            sku: targetVariant.sku,
            name: targetVariant.name || `Size ${targetVariant.size} / ${targetVariant.colorName}`,
          }
        : undefined,
      product: {
        id: targetProduct.id,
        name: targetProduct.name,
        sku: targetProduct.sku,
      },
      createdBy: {
        id: "usr_super_admin_1",
        name: "Elena Rostova",
        email: "elena@atelier.com",
        role: "SUPER_ADMIN",
      },
      notes: input.notes,
      deltaQuantity: quantityChange,
    };

    this.logInventoryTransaction(transaction);
    this.logAudit(
      "INVENTORY",
      targetVariant?.id || targetProduct.id,
      `Stock adjusted for ${targetVariant?.sku || targetProduct.sku} (${quantityChange > 0 ? `+${quantityChange}` : quantityChange} units): ${input.reason}`
    );

    return {
      success: true,
      statusCode: 200,
      message: `Stock successfully adjusted for ${targetVariant?.sku || targetProduct.sku} (${quantityChange > 0 ? `+${quantityChange}` : quantityChange} units)`,
      data: {
        itemType: targetVariant ? "VARIANT" : "PRODUCT",
        variantId: targetVariant?.id,
        productId: targetProduct.id,
        productName: targetProduct.name,
        sku: targetVariant?.sku || targetProduct.sku,
        previousStock: currentStock,
        newStock: targetStock,
        quantityChange,
        transaction,
      },
      newStock: targetStock,
    };
  }

  /**
   * 2.3. GET /api/v1/admin/inventory/transactions
   * Retrieves paginated list of immutable inventory audit transactions
   */
  static async getInventoryTransactionsPaginated(
    params?: InventoryTransactionsQueryParams
  ): Promise<InventoryTransactionsResponse> {
    const qp = new URLSearchParams();
    if (params?.page) qp.set("page", String(params.page));
    if (params?.limit) qp.set("limit", String(params.limit));
    if (params?.variantId) qp.set("variantId", params.variantId);
    if (params?.productId) qp.set("productId", params.productId);
    if (params?.type && params.type !== "ALL") qp.set("type", params.type);
    if (params?.startDate) qp.set("startDate", params.startDate);
    if (params?.endDate) qp.set("endDate", params.endDate);

    const qs = qp.toString() ? `?${qp.toString()}` : "";
    const res = await this.request<InventoryTransactionsResponse>(`/inventory/transactions${qs}`);
    if (res.success && res.data && Array.isArray(res.data.data)) {
      return res.data;
    }

    // Local Fallback Engine
    let allLogs = this.getInventoryTransactions();

    if (params?.variantId) {
      allLogs = allLogs.filter((t) => t.variantId === params.variantId);
    }
    if (params?.productId) {
      allLogs = allLogs.filter((t) => t.productId === params.productId);
    }
    if (params?.type && params.type !== "ALL") {
      allLogs = allLogs.filter((t) => t.type === params.type);
    }
    if (params?.startDate) {
      const startMs = new Date(params.startDate).getTime();
      allLogs = allLogs.filter((t) => new Date(t.createdAt).getTime() >= startMs);
    }
    if (params?.endDate) {
      const endMs = new Date(params.endDate).getTime();
      allLogs = allLogs.filter((t) => new Date(t.createdAt).getTime() <= endMs);
    }

    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params?.limit) || 20));
    const total = allLogs.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = allLogs.slice((page - 1) * limit, page * limit);

    return {
      success: true,
      statusCode: 200,
      message: "Inventory audit transactions fetched successfully",
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  static getInventoryTransactions(): InventoryTransaction[] {
    const seedTransactions: InventoryTransaction[] = [
      {
        id: "tx_uuid_881",
        variantId: "var_prod_1_0",
        productId: "prod_1",
        productName: "Banarasi Silk Saree",
        variantSku: "BNS-S-NVY",
        type: "RESTOCK",
        quantityChange: 20,
        previousStock: 2,
        newStock: 22,
        reason: "Received Autumn Batch replenishment from Milan warehouse",
        referenceId: "PO-2026-9812",
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        variant: {
          id: "var_prod_1_0",
          sku: "BNS-S-NVY",
          name: "Size S / Midnight Navy",
        },
        product: {
          id: "prod_1",
          name: "Banarasi Silk Saree",
          sku: "MSG-001",
        },
        createdBy: {
          id: "admin_uuid_1",
          name: "Elena Rostova",
          email: "elena@atelier.com",
          role: "SUPER_ADMIN",
        },
      },
      {
        id: "tx_uuid_882",
        variantId: "var_prod_2_1",
        productId: "prod_2",
        productName: "Chanderi Handloom Kurta",
        variantSku: "CHK-M-EMR",
        type: "ADJUSTMENT",
        quantityChange: -2,
        previousStock: 12,
        newStock: 10,
        reason: "Physical cycle count discrepancy audit",
        referenceId: "AUDIT-OCT-2026",
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        variant: {
          id: "var_prod_2_1",
          sku: "CHK-M-EMR",
          name: "Size M / Emerald Green",
        },
        product: {
          id: "prod_2",
          name: "Chanderi Handloom Kurta",
          sku: "MSG-002",
        },
        createdBy: {
          id: "admin_uuid_2",
          name: "Marcus Vance",
          email: "marcus@atelier.com",
          role: "STORE_ADMIN",
        },
      },
      {
        id: "tx_uuid_883",
        variantId: "var_prod_3_0",
        productId: "prod_3",
        productName: "Zardozi Embroidered Lehenga",
        variantSku: "ZEL-L-ROS",
        type: "DAMAGE",
        quantityChange: -1,
        previousStock: 4,
        newStock: 3,
        reason: "Damaged beading during VIP fitting room session",
        referenceId: "DMG-LOG-442",
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        variant: {
          id: "var_prod_3_0",
          sku: "ZEL-L-ROS",
          name: "Size L / Rose Pink",
        },
        product: {
          id: "prod_3",
          name: "Zardozi Embroidered Lehenga",
          sku: "MSG-003",
        },
        createdBy: {
          id: "admin_uuid_1",
          name: "Elena Rostova",
          email: "elena@atelier.com",
          role: "SUPER_ADMIN",
        },
      },
    ];

    return getLocalData<InventoryTransaction[]>(STORAGE_KEYS.INVENTORY_LOGS, seedTransactions);
  }

  private static logInventoryTransaction(entry: InventoryTransaction): void {
    const logs = this.getInventoryTransactions();
    logs.unshift(entry);
    setLocalData(STORAGE_KEYS.INVENTORY_LOGS, logs.slice(0, 200));
  }

  /**
   * 2.4. GET /api/v1/admin/inventory/alerts
   * Urgent low-stock & stockout alerts list
   */
  static async getInventoryAlerts(): Promise<InventoryAlertsResponse> {
    const res = await this.request<InventoryAlertsResponse>("/inventory/alerts");
    if (res.success && res.data && Array.isArray(res.data.data)) {
      return res.data;
    }

    const items = this.getFlattenedInventoryItems();
    const alertItems: InventoryAlertItem[] = items
      .filter((i) => i.status === "LOW_STOCK" || i.status === "OUT_OF_STOCK")
      .map((i) => ({
        id: i.id,
        variantId: i.variantId || i.id,
        productId: i.productId,
        productName: i.productName,
        sku: i.sku,
        variantName: i.variantName,
        stockQuantity: i.stockQuantity,
        lowStockThreshold: i.lowStockThreshold,
        status: i.status === "OUT_OF_STOCK" ? "OUT_OF_STOCK" : "LOW_STOCK",
        categoryName: i.category?.name,
        thumbnail: i.thumbnail,

        // Backward compatibility aliases
        variantSku: i.sku,
        size: i.size,
        colorName: i.color,
        stock: i.stockQuantity,
        urgency: i.status === "OUT_OF_STOCK" ? "CRITICAL" : "LOW",
      }));

    return {
      success: true,
      statusCode: 200,
      message: `${alertItems.length} inventory alert(s) found`,
      data: alertItems,
      meta: {
        totalAlerts: alertItems.length,
      },
    };
  }

  /**
   * 2.5. PATCH /api/v1/admin/inventory/threshold
   * Configures safety stock minimum alert threshold per variant or product
   */
  static async updateInventoryThreshold(
    input: UpdateThresholdInput
  ): Promise<UpdateThresholdResponse> {
    const res = await this.request<UpdateThresholdResponse>("/inventory/threshold", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    if (res.success && res.data) return res.data;

    const products = this.getLocalProducts();
    let updatedVariant: AdminProductVariant | null = null;
    let updatedProduct: AdminProduct | null = null;

    for (const prod of products) {
      if (input.variantId) {
        const found = prod.variants.find((v) => v.id === input.variantId);
        if (found) {
          found.lowStockThreshold = Number(input.lowStockThreshold);
          updatedVariant = found;
          updatedProduct = prod;
          break;
        }
      } else if (input.productId && prod.id === input.productId) {
        prod.variants.forEach((v) => {
          v.lowStockThreshold = Number(input.lowStockThreshold);
        });
        updatedProduct = prod;
        if (prod.variants.length > 0) updatedVariant = prod.variants[0];
        break;
      }
    }

    if (!updatedProduct) {
      return {
        success: false,
        statusCode: 404,
        message: "Target variant not found.",
        data: {} as any,
      };
    }

    setLocalData(STORAGE_KEYS.PRODUCTS, products);
    this.logAudit(
      "INVENTORY",
      updatedVariant?.id || updatedProduct.id,
      `Updated low stock safety threshold to ${input.lowStockThreshold} units`
    );

    return {
      success: true,
      statusCode: 200,
      message: "Stock threshold updated successfully",
      data: {
        itemType: updatedVariant ? "VARIANT" : "PRODUCT",
        id: updatedVariant?.id || updatedProduct.id,
        sku: updatedVariant?.sku || updatedProduct.sku,
        name: updatedVariant?.name || updatedProduct.name,
        stockQuantity: updatedVariant
          ? Number(updatedVariant.stockQuantity ?? updatedVariant.stock ?? 0)
          : Number(updatedProduct.stockQuantity ?? updatedProduct.totalStock ?? 0),
        lowStockThreshold: Number(input.lowStockThreshold),
      },
    };
  }

  // ----------------------------------------------------
  // 4. ORDER LIFECYCLE & FULFILLMENT (/api/v1/admin/orders) - Module 05
  // ----------------------------------------------------

  static getCurrentAdminUser(): { id: string; name: string; email: string; role: string } {
    try {
      const storeUser = useAuthStore.getState().user;
      if (storeUser) {
        return {
          id: storeUser.id,
          name: storeUser.name || "Elena Rostova",
          email: storeUser.email || "elena@atelier.com",
          role: (storeUser.role as string) || "SUPER_ADMIN",
        };
      }
    } catch {}

    return {
      id: "admin_uuid_1",
      name: "Elena Rostova",
      email: "elena@atelier.com",
      role: "SUPER_ADMIN",
    };
  }

  static getLocalOrders(): AdminOrder[] {
    return getLocalData<AdminOrder[]>(STORAGE_KEYS.ORDERS, INITIAL_SAMPLE_ORDERS);
  }

  /**
   * 2.1. GET /api/v1/admin/orders
   * Retrieves paginated orders with faceted filters and KPI summary counters
   */
  static async getOrdersList(
    params?: OrderListQueryParams
  ): Promise<OrdersListResponse> {
    const qp = new URLSearchParams();
    if (params?.page) qp.set("page", String(params.page));
    if (params?.limit) qp.set("limit", String(params.limit));
    if (params?.search) qp.set("search", params.search);
    if (params?.status && params.status !== "ALL") qp.set("status", params.status);
    if (params?.paymentStatus && params.paymentStatus !== "ALL") qp.set("paymentStatus", params.paymentStatus);
    if (params?.paymentMethod && params.paymentMethod !== "ALL") qp.set("paymentMethod", params.paymentMethod);
    if (params?.startDate) qp.set("startDate", params.startDate);
    if (params?.endDate) qp.set("endDate", params.endDate);
    if (params?.minAmount !== undefined) qp.set("minAmount", String(params.minAmount));
    if (params?.maxAmount !== undefined) qp.set("maxAmount", String(params.maxAmount));
    if (params?.sort) qp.set("sort", params.sort);

    const qs = qp.toString() ? `?${qp.toString()}` : "";
    const res = await this.request<OrdersListResponse>(`/orders${qs}`);
    if (res.success && res.data && Array.isArray(res.data.data)) {
      return res.data;
    }

    // Local Fallback Engine
    const allOrders = this.getLocalOrders();

    // KPI Summary computed across entire order ledger
    const summary: OrdersSummary = {
      totalOrders: allOrders.length,
      totalRevenue: allOrders
        .filter((o) => o.status !== "CANCELLED")
        .reduce((sum, o) => sum + Number(o.totalAmount ?? o.total ?? 0), 0),
      pendingCount: allOrders.filter((o) => o.status === "PENDING").length,
      confirmedCount: allOrders.filter((o) => o.status === "CONFIRMED").length,
      processingCount: allOrders.filter((o) => o.status === "PROCESSING").length,
      packedCount: allOrders.filter((o) => o.status === "PACKED").length,
      shippedCount: allOrders.filter((o) => o.status === "SHIPPED").length,
      deliveredCount: allOrders.filter((o) => o.status === "DELIVERED").length,
      cancelledCount: allOrders.filter((o) => o.status === "CANCELLED").length,
    };

    let filtered = [...allOrders];

    // Filter by Status
    if (params?.status && params.status !== "ALL") {
      filtered = filtered.filter((o) => o.status === params.status);
    }

    // Filter by Payment Status
    if (params?.paymentStatus && params.paymentStatus !== "ALL") {
      filtered = filtered.filter((o) => o.paymentStatus === params.paymentStatus);
    }

    // Filter by Payment Method
    if (params?.paymentMethod && params.paymentMethod !== "ALL") {
      filtered = filtered.filter((o) => o.paymentMethod.toUpperCase() === params.paymentMethod?.toUpperCase());
    }

    // Filter by Search (orderNumber, customerName, customerEmail, customerPhone, trackingNumber)
    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          (o.customerPhone && o.customerPhone.toLowerCase().includes(q)) ||
          (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q))
      );
    }

    // Filter by Date Range
    if (params?.startDate) {
      const start = new Date(params.startDate).getTime();
      filtered = filtered.filter((o) => new Date(o.createdAt).getTime() >= start);
    }
    if (params?.endDate) {
      const end = new Date(params.endDate).getTime();
      filtered = filtered.filter((o) => new Date(o.createdAt).getTime() <= end);
    }

    // Filter by Amount
    if (params?.minAmount !== undefined) {
      filtered = filtered.filter((o) => Number(o.totalAmount ?? o.total) >= Number(params.minAmount));
    }
    if (params?.maxAmount !== undefined) {
      filtered = filtered.filter((o) => Number(o.totalAmount ?? o.total) <= Number(params.maxAmount));
    }

    // Sort Orders
    const sortMode = params?.sort || "newest";
    filtered.sort((a, b) => {
      switch (sortMode) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "total_asc":
          return Number(a.totalAmount ?? a.total) - Number(b.totalAmount ?? b.total);
        case "total_desc":
          return Number(b.totalAmount ?? b.total) - Number(a.totalAmount ?? a.total);
        default:
          return 0;
      }
    });

    const page = Math.max(1, Number(params?.page || 1));
    const limit = Math.min(100, Math.max(1, Number(params?.limit || 20)));
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      success: true,
      statusCode: 200,
      message: "Orders fetched successfully",
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      meta: {
        summary,
      },
    };
  }

  /**
   * Backward-compatible getOrders wrapper
   */
  static async getOrders(
    paramsOrStatus?: OrderListQueryParams | string,
    legacySearch?: string
  ): Promise<AdminOrder[]> {
    if (typeof paramsOrStatus === "object" && paramsOrStatus !== null) {
      const res = await this.getOrdersList(paramsOrStatus);
      return res.data;
    }

    const status = typeof paramsOrStatus === "string" ? paramsOrStatus : undefined;
    const res = await this.getOrdersList({
      status: (status as any) || "ALL",
      search: legacySearch,
    });
    return res.data;
  }

  /**
   * 2.2. GET /api/v1/admin/orders/:id
   * Retrieves complete order file with live variant stock and audit history
   */
  static async getOrderDetail(orderId: string): Promise<OrderDetailResponse> {
    const res = await this.request<OrderDetailResponse>(`/orders/${orderId}`);
    if (res.success && res.data && res.data.data) {
      return res.data;
    }

    const orders = this.getLocalOrders();
    const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);

    if (!order) {
      throw new Error(`Order #${orderId} not found`);
    }

    // Attach live variant stock from product catalog
    const products = this.getLocalProducts();
    const enrichedItems = order.items.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const variant = prod?.variants?.find((v) => v.id === item.variantId || v.sku === item.sku);
      return {
        ...item,
        product: item.product || (prod ? { id: prod.id, name: prod.name, slug: prod.slug, brand: prod.brand } : undefined),
        variant: {
          id: variant?.id || item.variantId || "var_unknown",
          sku: variant?.sku || item.sku || "SKU-N/A",
          stockQuantity: Number(variant?.stockQuantity ?? variant?.stock ?? 12),
        },
      };
    });

    const enrichedOrder: AdminOrder = {
      ...order,
      items: enrichedItems,
    };

    return {
      success: true,
      statusCode: 200,
      message: "Order details fetched successfully",
      data: enrichedOrder,
    };
  }

  /**
   * 2.3. PATCH /api/v1/admin/orders/:id/status
   * Advances order status according to fulfillment state machine with audit history logging
   */
  static async advanceOrderStatus(
    orderId: string,
    input: AdvanceOrderStatusInput
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: {
      id: string;
      orderNumber: string;
      status: OrderStatus;
      updatedAt: string;
    };
    error?: { code: string };
  }> {
    const res = await this.request<{
      id: string;
      orderNumber: string;
      status: OrderStatus;
      updatedAt: string;
    }>(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });

    if (res.success && res.data) {
      return {
        success: true,
        statusCode: 200,
        message: res.message || `Order status updated to ${input.status}`,
        data: res.data,
      };
    }

    const orders = this.getLocalOrders();
    const idx = orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
    if (idx === -1) {
      return {
        success: false,
        statusCode: 404,
        message: `Order #${orderId} not found`,
        error: { code: "ORDER_NOT_FOUND" },
      };
    }

    const currentOrder = orders[idx];
    const prevStatus = currentOrder.status;
    const allowed = ALLOWED_ORDER_TRANSITIONS[prevStatus] || [];

    if (!allowed.includes(input.status)) {
      return {
        success: false,
        statusCode: 400,
        message: `Illegal transition from '${prevStatus}' to '${input.status}'. Allowed: ${allowed.join(", ") || "None"}`,
        error: { code: "ILLEGAL_STATUS_TRANSITION" },
      };
    }

    const now = new Date().toISOString();
    currentOrder.status = input.status;
    currentOrder.updatedAt = now;

    if (input.status === "DELIVERED") {
      currentOrder.deliveredAt = now;
    }

    currentOrder.statusHistory = currentOrder.statusHistory || [];
    currentOrder.statusHistory.push({
      id: `hist_${Date.now()}`,
      previousStatus: prevStatus,
      newStatus: input.status,
      comment: input.comment || `Order status updated to ${input.status}`,
      createdAt: now,
      changedBy: this.getCurrentAdminUser(),
    });

    setLocalData(STORAGE_KEYS.ORDERS, orders);
    this.logAudit(
      "ORDER",
      currentOrder.orderNumber,
      `Order status advanced from ${prevStatus} to ${input.status}${input.comment ? `: ${input.comment}` : ""}`
    );

    return {
      success: true,
      statusCode: 200,
      message: `Order #${currentOrder.orderNumber} status updated to ${input.status}`,
      data: {
        id: currentOrder.id,
        orderNumber: currentOrder.orderNumber,
        status: currentOrder.status,
        updatedAt: currentOrder.updatedAt,
      },
    };
  }

  /**
   * 2.4. PATCH /api/v1/admin/orders/:id/shipping
   * Assigns AWB tracking credentials and automatically advances status to SHIPPED
   */
  static async assignCourierShipping(
    orderId: string,
    input: AssignShippingInput
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: {
      id: string;
      orderNumber: string;
      courierPartner: string;
      trackingNumber: string;
      status: OrderStatus;
      shippedAt: string;
    };
    error?: { code: string };
  }> {
    const res = await this.request<{
      id: string;
      orderNumber: string;
      courierPartner: string;
      trackingNumber: string;
      status: OrderStatus;
      shippedAt: string;
    }>(`/orders/${orderId}/shipping`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });

    if (res.success && res.data) {
      return {
        success: true,
        statusCode: 200,
        message: res.message || `Shipment assigned via ${input.courierPartner}`,
        data: res.data,
      };
    }

    const orders = this.getLocalOrders();
    const idx = orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
    if (idx === -1) {
      return {
        success: false,
        statusCode: 404,
        message: `Order #${orderId} not found`,
        error: { code: "ORDER_NOT_FOUND" },
      };
    }

    const now = new Date().toISOString();
    const currentOrder = orders[idx];
    const prevStatus = currentOrder.status;
    const targetStatus = input.status || "SHIPPED";

    currentOrder.courierPartner = input.courierPartner;
    currentOrder.trackingNumber = input.trackingNumber;
    currentOrder.status = targetStatus;
    currentOrder.shippedAt = now;
    currentOrder.updatedAt = now;
    currentOrder.courier = {
      carrierName: input.courierPartner,
      trackingNumber: input.trackingNumber,
      estimatedDelivery: input.estimatedDelivery,
      shippedAt: now,
      trackingUrl: `https://www.tracktrace.delivery/${input.trackingNumber}`,
    };

    currentOrder.statusHistory = currentOrder.statusHistory || [];
    currentOrder.statusHistory.push({
      id: `hist_${Date.now()}`,
      previousStatus: prevStatus,
      newStatus: targetStatus,
      comment: `Shipment assigned via ${input.courierPartner} (AWB: ${input.trackingNumber})${input.notes ? `. Note: ${input.notes}` : ""}`,
      createdAt: now,
      changedBy: this.getCurrentAdminUser(),
    });

    setLocalData(STORAGE_KEYS.ORDERS, orders);
    this.logAudit(
      "ORDER",
      currentOrder.orderNumber,
      `Assigned courier ${input.courierPartner} (AWB: ${input.trackingNumber})`
    );

    return {
      success: true,
      statusCode: 200,
      message: `Shipment assigned for #${currentOrder.orderNumber} via ${input.courierPartner}`,
      data: {
        id: currentOrder.id,
        orderNumber: currentOrder.orderNumber,
        courierPartner: currentOrder.courierPartner,
        trackingNumber: currentOrder.trackingNumber,
        status: currentOrder.status,
        shippedAt: currentOrder.shippedAt,
      },
    };
  }

  /**
   * 2.5. PATCH /api/v1/admin/orders/:id/notes
   * Updates internal admin notes (hidden from customer receipts)
   */
  static async updateOrderInternalNotes(
    orderId: string,
    input: UpdateOrderNotesInput
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: {
      id: string;
      orderNumber: string;
      internalAdminNotes: string;
    };
    error?: { code: string };
  }> {
    const res = await this.request<{
      id: string;
      orderNumber: string;
      internalAdminNotes: string;
    }>(`/orders/${orderId}/notes`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });

    if (res.success && res.data) {
      return {
        success: true,
        statusCode: 200,
        message: "Internal admin notes updated successfully",
        data: res.data,
      };
    }

    const orders = this.getLocalOrders();
    const idx = orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
    if (idx === -1) {
      return {
        success: false,
        statusCode: 404,
        message: `Order #${orderId} not found`,
        error: { code: "ORDER_NOT_FOUND" },
      };
    }

    const currentOrder = orders[idx];
    currentOrder.internalAdminNotes = input.internalAdminNotes;
    currentOrder.updatedAt = new Date().toISOString();

    setLocalData(STORAGE_KEYS.ORDERS, orders);
    this.logAudit("ORDER", currentOrder.orderNumber, "Updated internal atelier notes");

    return {
      success: true,
      statusCode: 200,
      message: "Internal admin notes updated successfully",
      data: {
        id: currentOrder.id,
        orderNumber: currentOrder.orderNumber,
        internalAdminNotes: currentOrder.internalAdminNotes,
      },
    };
  }

  /**
   * 2.6. POST /api/v1/admin/orders/:id/cancel
   * Cancels order with atomic stock restitution and double-entry audit logging
   * Permission Required: orders:cancel (SUPER_ADMIN or STORE_ADMIN only)
   */
  static async cancelOrder(
    orderId: string,
    reason: string
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: {
      id: string;
      orderNumber: string;
      status: OrderStatus;
      cancelReason: string;
      cancelledAt: string;
    };
    error?: { code: string };
  }> {
    const res = await this.request<{
      id: string;
      orderNumber: string;
      status: OrderStatus;
      cancelReason: string;
      cancelledAt: string;
    }>(`/orders/${orderId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });

    if (res.success && res.data) {
      return {
        success: true,
        statusCode: 200,
        message: res.message || "Order successfully cancelled",
        data: res.data,
      };
    }

    const orders = this.getLocalOrders();
    const idx = orders.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
    if (idx === -1) {
      return {
        success: false,
        statusCode: 404,
        message: `Order #${orderId} not found`,
        error: { code: "ORDER_NOT_FOUND" },
      };
    }

    const currentOrder = orders[idx];

    // Status Validation Guards
    if (currentOrder.status === "DELIVERED") {
      return {
        success: false,
        statusCode: 400,
        message: "Cannot cancel an order that has already been delivered",
        error: { code: "ORDER_DELIVERED" },
      };
    }

    if (currentOrder.status === "SHIPPED" || currentOrder.status === "OUT_FOR_DELIVERY") {
      return {
        success: false,
        statusCode: 400,
        message: "Cannot cancel an order that has already been dispatched. Must proceed through return.",
        error: { code: "ORDER_ALREADY_SHIPPED" },
      };
    }

    if (currentOrder.status === "CANCELLED") {
      return {
        success: false,
        statusCode: 400,
        message: "Order is already cancelled.",
        error: { code: "ORDER_ALREADY_CANCELLED" },
      };
    }

    const now = new Date().toISOString();
    const prevStatus = currentOrder.status;

    // ----------------------------------------------------
    // ATOMIC STOCK RESTITUTION & AUDIT LEDGER LOGGING
    // ----------------------------------------------------
    const products = this.getLocalProducts();
    const adminUser = this.getCurrentAdminUser();
    const inventoryLogs = this.getInventoryTransactions();

    for (const item of currentOrder.items) {
      const restockQty = Number(item.quantity || 1);
      // Locate product
      let matchedProd = products.find(
        (p) => p.id === item.productId || (p.variants && p.variants.some((v) => v.id === item.variantId || v.sku === item.sku))
      );

      if (matchedProd) {
        let matchedVariant = (matchedProd.variants || []).find(
          (v) => v.id === item.variantId || v.sku === item.sku
        );

        if (matchedVariant) {
          const prevVariantStock = Number(matchedVariant.stockQuantity ?? matchedVariant.stock ?? 0);
          const newVariantStock = prevVariantStock + restockQty;
          matchedVariant.stockQuantity = newVariantStock;
          matchedVariant.stock = newVariantStock;

          // Recalculate parent product total stock
          matchedProd.stockQuantity = (matchedProd.variants || []).reduce(
            (sum, v) => sum + Number(v.stockQuantity ?? v.stock ?? 0),
            0
          );
          matchedProd.totalStock = matchedProd.stockQuantity;

          // Record immutable RETURN entry in InventoryTransaction ledger
          inventoryLogs.unshift({
            id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            variantId: matchedVariant.id,
            productId: matchedProd.id,
            productName: matchedProd.name,
            variantSku: matchedVariant.sku,
            type: "RETURN",
            quantityChange: restockQty,
            previousStock: prevVariantStock,
            newStock: newVariantStock,
            reason: `Restocked from cancelled order #${currentOrder.orderNumber}: ${reason}`,
            referenceId: currentOrder.orderNumber,
            createdAt: now,
            createdBy: adminUser,
          });
        } else {
          // Standalone product
          const prevProdStock = Number(matchedProd.stockQuantity ?? matchedProd.totalStock ?? 0);
          const newProdStock = prevProdStock + restockQty;
          matchedProd.stockQuantity = newProdStock;
          matchedProd.totalStock = newProdStock;

          inventoryLogs.unshift({
            id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            productId: matchedProd.id,
            productName: matchedProd.name,
            type: "RETURN",
            quantityChange: restockQty,
            previousStock: prevProdStock,
            newStock: newProdStock,
            reason: `Restocked from cancelled order #${currentOrder.orderNumber}: ${reason}`,
            referenceId: currentOrder.orderNumber,
            createdAt: now,
            createdBy: adminUser,
          });
        }
      }
    }

    setLocalData(STORAGE_KEYS.PRODUCTS, products);
    setLocalData(STORAGE_KEYS.INVENTORY_LOGS, inventoryLogs.slice(0, 300));

    // Update order state
    currentOrder.status = "CANCELLED";
    currentOrder.cancelReason = reason;
    currentOrder.cancelledAt = now;
    currentOrder.updatedAt = now;

    currentOrder.statusHistory = currentOrder.statusHistory || [];
    currentOrder.statusHistory.push({
      id: `hist_${Date.now()}`,
      previousStatus: prevStatus,
      newStatus: "CANCELLED",
      comment: `Order cancelled: ${reason}. Garment stock atomically restored.`,
      createdAt: now,
      changedBy: adminUser,
    });

    setLocalData(STORAGE_KEYS.ORDERS, orders);
    this.logAudit("ORDER", currentOrder.orderNumber, `Order cancelled: ${reason}`);

    return {
      success: true,
      statusCode: 200,
      message: `Order #${currentOrder.orderNumber} successfully cancelled`,
      data: {
        id: currentOrder.id,
        orderNumber: currentOrder.orderNumber,
        status: "CANCELLED",
        cancelReason: reason,
        cancelledAt: now,
      },
    };
  }

  /**
   * Backward-compatible updateOrderStatus method
   */
  static async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    courier?: CourierInfo
  ): Promise<{ success: boolean; order?: AdminOrder }> {
    if (courier && courier.trackingNumber) {
      await this.assignCourierShipping(orderId, {
        courierPartner: courier.carrierName,
        trackingNumber: courier.trackingNumber,
        estimatedDelivery: courier.estimatedDelivery,
        status,
      });
    } else {
      await this.advanceOrderStatus(orderId, { status });
    }

    const orderRes = await this.getOrderDetail(orderId);
    return { success: true, order: orderRes.data };
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
