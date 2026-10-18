import { getApiBaseUrl } from "@/services/apiConfig";
import { AuthService } from "@/services/auth.service";
import { AdminService } from "@/services/admin.service";
import { useCartStore } from "@/stores/cart.store";
import { storeConfig } from "@/config/store.config";
import {
  CustomerOrder,
  CustomerOrderListQueryParams,
  CustomerOrderListResponse,
  CustomerOrderDetailResponse,
  CancelOrderInput,
  CancelOrderResponse,
  ReorderResponse,
} from "@/types/order.types";

export class OrderService {
  /**
   * 1. GET /api/v1/orders
   * Customer order history list (Screen 2)
   */
  static async getCustomerOrders(
    params?: CustomerOrderListQueryParams
  ): Promise<CustomerOrderListResponse> {
    const baseUrl = getApiBaseUrl();
    const page = Math.max(1, params?.page || 1);
    const limit = Math.min(50, Math.max(1, params?.limit || 10));
    const status = params?.status || "ALL";

    const qp = new URLSearchParams();
    qp.set("page", String(page));
    qp.set("limit", String(limit));
    if (status !== "ALL") qp.set("status", status);

    try {
      const res = await AuthService.fetchWithAuth(`${baseUrl}/orders?${qp.toString()}`, {
        method: "GET",
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.success && Array.isArray(json.data)) {
          const normalized = json.data.map((raw: any) => ({
            ...raw,
            totalAmount: Number(raw.totalAmount ?? raw.total ?? raw.pricing?.totalAmount ?? 0),
            itemsCount: Number(raw.itemsCount ?? (Array.isArray(raw.items) ? raw.items.length : 0)),
            items: Array.isArray(raw.items)
              ? raw.items.map((it: any) => ({
                  ...it,
                  price: Number(it.price || 0),
                  totalPrice: Number(it.totalPrice ?? Number(it.price || 0) * (it.quantity || 1)),
                  quantity: Number(it.quantity || 1),
                }))
              : [],
          }));
          return {
            success: true,
            statusCode: res.status,
            message: json.message || "Customer order history retrieved successfully",
            data: normalized,
            pagination: json.pagination || {
              page,
              limit,
              total: json.data.length,
              totalPages: Math.max(1, Math.ceil(json.data.length / limit)),
            },
          };
        }
      }
    } catch (err) {
      console.warn("[OrderService] Failed to fetch live customer orders, falling back to local registry:", err);
    }

    // Local Registry Fallback
    try {
      const local = AdminService.getLocalOrders();
      let filtered = [...local];

      if (status !== "ALL") {
        filtered = filtered.filter((o) => (o.status || "").toUpperCase() === status.toUpperCase());
      }

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const startIndex = (page - 1) * limit;
      const paginated = filtered.slice(startIndex, startIndex + limit);

      const transformed: CustomerOrder[] = paginated.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        totalAmount: Number(o.totalAmount ?? o.total ?? 0),
        itemsCount: (o.items || []).length,
        items: (o.items || []).map((it) => ({
          id: it.id,
          productId: it.productId,
          variantId: it.variantId || null,
          title: it.title || "Luxury Garment",
          sku: it.sku,
          size: it.size,
          color: it.color,
          quantity: it.quantity,
          price: Number(it.price || 0),
          totalPrice: Number(it.totalPrice || Number(it.price || 0) * it.quantity),
          imageUrl: it.imageUrl,
        })),
        courierPartner: o.courierPartner || null,
        trackingNumber: o.trackingNumber || null,
        estimatedDelivery: o.courier?.estimatedDelivery || null,
      }));

      return {
        success: true,
        statusCode: 200,
        message: "Customer order history retrieved successfully (local)",
        data: transformed,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 500,
        message: err.message || "Failed to load customer orders",
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      };
    }
  }

  /**
   * 2. GET /api/v1/orders/:orderNumber
   * Detailed order breakdown & live courier tracking (Screen 3)
   */
  static async getOrderDetail(orderNumber: string): Promise<CustomerOrderDetailResponse> {
    const baseUrl = getApiBaseUrl();

    try {
      const res = await AuthService.fetchWithAuth(`${baseUrl}/orders/${orderNumber}`, {
        method: "GET",
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.success && json.data) {
          const raw = json.data;
          const totalAmount = Number(
            raw.totalAmount ?? raw.total ?? raw.pricing?.totalAmount ?? 0
          );
          const shippingAmount = Number(
            raw.pricing?.shippingAmount ?? raw.shippingAmount ?? raw.shipping ?? storeConfig.shipping.flatRate
          );
          const discountAmount = Number(
            raw.pricing?.discountAmount ?? raw.discountAmount ?? raw.discount ?? 0
          );
          const subtotal = Number(
            raw.pricing?.subtotal ?? raw.subtotal ?? Math.max(0, totalAmount - shippingAmount + discountAmount)
          );
          const taxAmount = Number(
            raw.pricing?.taxAmount ?? raw.taxAmount ?? raw.tax ?? 0
          );

          const customerOrder: CustomerOrder = {
            ...raw,
            totalAmount,
            pricing: {
              subtotal,
              discountAmount,
              shippingAmount,
              taxAmount,
              totalAmount,
              currency: raw.pricing?.currency || raw.currency || "INR",
              ...(raw.pricing || {}),
            },
            items: Array.isArray(raw.items)
              ? raw.items.map((it: any) => ({
                  ...it,
                  price: Number(it.price || 0),
                  totalPrice: Number(it.totalPrice ?? Number(it.price || 0) * (it.quantity || 1)),
                  quantity: Number(it.quantity || 1),
                }))
              : [],
          };

          return {
            success: true,
            statusCode: res.status,
            message: json.message || "Order details retrieved successfully",
            data: customerOrder,
          };
        }
      }
    } catch (err) {
      console.warn(`[OrderService] Live getOrderDetail(${orderNumber}) failed, falling back:`, err);
    }

    // Local Fallback
    try {
      const local = AdminService.getLocalOrders();
      const found = local.find(
        (o) => o.orderNumber === orderNumber || o.id === orderNumber
      );

      if (!found) {
        return {
          success: false,
          statusCode: 404,
          message: `Order #${orderNumber} not found`,
          error: { code: "ORDER_NOT_FOUND" },
        };
      }

      const subtotal = Number(found.subtotal || 0);
      const discountAmount = Number(found.discountAmount || found.discount || 0);
      const shippingAmount = Number(found.shippingAmount || found.shipping || 0);
      const totalAmount = Number(found.totalAmount ?? found.total ?? 0);
      const taxAmount = Math.max(0, Math.round((totalAmount - subtotal + discountAmount - shippingAmount) * 100) / 100);

      const customerOrder: CustomerOrder = {
        id: found.id,
        orderNumber: found.orderNumber,
        createdAt: found.createdAt,
        status: found.status,
        paymentStatus: found.paymentStatus,
        paymentMethod: found.paymentMethod,
        totalAmount,
        customerName: found.customerName,
        customerEmail: found.customerEmail,
        customerPhone: found.customerPhone,
        shippingAddress: {
          firstName: found.customerName?.split(" ")[0] || "Valued",
          lastName: found.customerName?.split(" ").slice(1).join(" ") || "Client",
          company: undefined,
          address1: found.shippingAddress?.street || "ByteVenue Delivery Address",
          address2: undefined,
          city: found.shippingAddress?.city || "Chennai",
          state: found.shippingAddress?.state || "TamilNadu",
          postalCode: found.shippingAddress?.postalCode || "600095",
          country: found.shippingAddress?.country || "India",
          phoneNumber: found.customerPhone,
        },
        billingAddress: {
          firstName: found.customerName?.split(" ")[0] || "Valued",
          lastName: found.customerName?.split(" ").slice(1).join(" ") || "Client",
          address1: found.shippingAddress?.street || "ByteVenue Delivery Address",
          city: found.shippingAddress?.city || "Chennai",
          state: found.shippingAddress?.state || "TamilNadu",
          postalCode: found.shippingAddress?.postalCode || "600095",
          country: found.shippingAddress?.country || "India",
        },
        courierPartner: found.courierPartner || found.courier?.carrierName || null,
        trackingNumber: found.trackingNumber || found.courier?.trackingNumber || null,
        estimatedDelivery: found.courier?.estimatedDelivery || null,
        shippedAt: (found as any).shippedAt || found.courier?.shippedAt || null,
        deliveredAt: (found as any).deliveredAt || null,
        cancelledAt: (found as any).cancelledAt || null,
        cancelReason: (found as any).cancelReason || null,
        notes: found.internalAdminNotes || null,
        pricing: {
          subtotal,
          discountAmount,
          shippingAmount,
          taxAmount,
          totalAmount,
          currency: "INR",
        },
        items: (found.items || []).map((it) => ({
          id: it.id,
          productId: it.productId,
          variantId: it.variantId || null,
          title: it.title || "Luxury Garment",
          sku: it.sku,
          size: it.size,
          color: it.color,
          imageUrl: it.imageUrl,
          price: Number(it.price || 0),
          quantity: it.quantity,
          totalPrice: Number(it.totalPrice || Number(it.price || 0) * it.quantity),
          productSlug: it.product?.slug,
        })),
        payments: [
          {
            gateway: found.paymentMethod,
            status: found.paymentStatus,
            transactionId: found.payments?.[0]?.transactionId || null,
            amount: totalAmount,
            createdAt: found.createdAt,
          },
        ],
        statusHistory: (found.statusHistory || []).map((sh) => ({
          id: sh.id,
          previousStatus: sh.previousStatus,
          newStatus: sh.newStatus,
          comment: sh.comment,
          createdAt: sh.createdAt,
        })),
        metafields: (found as any).metafields || [],
      };

      return {
        success: true,
        statusCode: 200,
        message: "Order details retrieved successfully",
        data: customerOrder,
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 500,
        message: err.message || "Failed to load order details",
        error: { code: "ORDER_DETAIL_ERROR" },
      };
    }
  }

  /**
   * 3. POST /api/v1/orders/:orderNumber/cancel
   * Customer Self-Cancellation (Strictly permitted while status === 'PENDING')
   */
  static async cancelOrder(
    orderNumber: string,
    reason?: string
  ): Promise<CancelOrderResponse> {
    const baseUrl = getApiBaseUrl();

    try {
      const res = await AuthService.fetchWithAuth(`${baseUrl}/orders/${orderNumber}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason?.trim() || undefined }),
      });

      const json = await res.json().catch(() => ({}));
      return {
        success: res.ok && json.success !== false,
        statusCode: res.status,
        message: json.message || (res.ok ? `Order #${orderNumber} successfully cancelled` : "Failed to cancel order"),
        data: json.data,
        error: json.error,
      };
    } catch (err) {
      console.warn(`[OrderService] Live cancelOrder(${orderNumber}) failed, running local fallback:`, err);
    }

    // Local Fallback
    try {
      const local = AdminService.getLocalOrders();
      const idx = local.findIndex((o) => o.orderNumber === orderNumber || o.id === orderNumber);

      if (idx === -1) {
        return {
          success: false,
          statusCode: 404,
          message: "Order not found",
          error: { code: "ORDER_NOT_FOUND" },
        };
      }

      const ord = local[idx];
      if (ord.status !== "PENDING") {
        return {
          success: false,
          statusCode: 400,
          message: "Your order has already been processed and cannot be cancelled directly. Please contact our concierge support.",
          error: { code: "CANCELLATION_NOT_ALLOWED" },
        };
      }

      const now = new Date().toISOString();
      ord.status = "CANCELLED";
      (ord as any).cancelledAt = now;
      (ord as any).cancelReason = reason || "Customer requested cancellation";
      ord.updatedAt = now;

      // Add to status history
      ord.statusHistory = ord.statusHistory || [];
      ord.statusHistory.push({
        id: `hist_${Date.now()}`,
        previousStatus: "PENDING",
        newStatus: "CANCELLED",
        comment: reason ? `Customer cancelled: ${reason}` : "Customer cancelled order",
        createdAt: now,
      });

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("admin_orders", JSON.stringify(local));
        } catch { }
      }

      return {
        success: true,
        statusCode: 200,
        message: `Order #${ord.orderNumber} successfully cancelled`,
        data: {
          id: ord.id,
          orderNumber: ord.orderNumber,
          status: "CANCELLED",
          cancelledAt: now,
          cancelReason: reason || "Customer requested cancellation",
        },
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 500,
        message: err.message || "Failed to cancel order",
        error: { code: "CANCELLATION_FAILED" },
      };
    }
  }

  /**
   * 4. POST /api/v1/orders/:orderNumber/reorder
   * Merges garments into customer's active cart
   */
  static async reorder(orderNumber: string): Promise<ReorderResponse> {
    const baseUrl = getApiBaseUrl();

    try {
      const res = await AuthService.fetchWithAuth(`${baseUrl}/orders/${orderNumber}/reorder`, {
        method: "POST",
      });

      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.success && json.data) {
          // Sync client-side zustand cart store
          await useCartStore.getState().fetchCart().catch(() => { });
          return {
            success: true,
            statusCode: res.status,
            message: json.message || "Items added to your cart",
            data: json.data,
          };
        }
      }
    } catch (err) {
      console.warn(`[OrderService] Live reorder(${orderNumber}) failed, running local fallback:`, err);
    }

    // Local Fallback: Merge garments into active cart store
    try {
      const detailRes = await this.getOrderDetail(orderNumber);
      if (!detailRes.success || !detailRes.data) {
        return {
          success: false,
          statusCode: 404,
          message: "Original order could not be located for reorder",
          error: { code: "ORDER_NOT_FOUND" },
        };
      }

      const cartStore = useCartStore.getState();
      const addedItems: any[] = [];
      const skippedItems: any[] = [];

      for (const item of detailRes.data.items) {
        try {
          await cartStore.addItem({
            productId: item.productId,
            variantId: item.variantId || undefined,
            name: item.title,
            price: Number(item.price),
            size: item.size || "M",
            colorName: item.color || "Standard",
            quantity: item.quantity,
            imageUrl: item.imageUrl,
            sku: item.sku,
          });

          addedItems.push({
            productId: item.productId,
            variantId: item.variantId,
            title: item.title,
            sku: item.sku,
            quantityAdded: item.quantity,
            originalQuantity: item.quantity,
          });
        } catch (itemErr: any) {
          skippedItems.push({
            title: item.title,
            sku: item.sku,
            reason: itemErr.message || "Item is currently unavailable",
          });
        }
      }

      const message =
        skippedItems.length > 0
          ? `${addedItems.length} item(s) added to your cart (${skippedItems.length} unavailable item(s) skipped)`
          : `${addedItems.length} item(s) added to your cart`;

      return {
        success: true,
        statusCode: 200,
        message,
        data: {
          addedItems,
          skippedItems,
          cart: cartStore.apiCart,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 500,
        message: err.message || "Failed to process reorder",
        error: { code: "REORDER_FAILED" },
      };
    }
  }
}
