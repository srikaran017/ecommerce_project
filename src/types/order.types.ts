export interface OrderMetafield {
  id?: string;
  namespace: string;
  key: string;
  value: string;
  valueType?: "STRING" | "BOOLEAN" | "NUMBER" | "JSON";
  description?: string;
  isPublic?: boolean;
}

export interface CustomerOrderAddress {
  firstName: string;
  lastName: string;
  company?: string | null;
  address1: string;
  address2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string | null;
}

export interface CustomerOrderItem {
  id: string;
  productId: string;
  variantId?: string | null;
  title: string;
  sku?: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number | string;
  totalPrice: number | string;
  imageUrl?: string;
  productSlug?: string;
}

export interface CustomerOrderPayment {
  id?: string;
  gateway: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  transactionId?: string | null;
  amount: number | string;
  createdAt?: string;
}

export interface CustomerOrderStatusHistory {
  id: string;
  previousStatus: string | null;
  newStatus: string;
  comment?: string;
  createdAt: string;
}

export interface CustomerOrderPricing {
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  itemsCount?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: CustomerOrderAddress;
  billingAddress?: CustomerOrderAddress;
  courierPartner?: string | null;
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  notes?: string | null;
  pricing?: CustomerOrderPricing;
  items: CustomerOrderItem[];
  payments?: CustomerOrderPayment[];
  statusHistory?: CustomerOrderStatusHistory[];
  metafields?: OrderMetafield[];
}

export interface CustomerOrderListQueryParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface CustomerOrderListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: CustomerOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerOrderDetailResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: CustomerOrder;
  error?: {
    code: string;
    message?: string;
  };
}

export interface CancelOrderInput {
  reason?: string;
}

export interface CancelOrderResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: {
    id: string;
    orderNumber: string;
    status: string;
    cancelledAt: string;
    cancelReason?: string;
  };
  error?: {
    code: string;
    message?: string;
  };
}

export interface ReorderAddedItem {
  productId: string;
  variantId?: string | null;
  title: string;
  sku?: string;
  quantityAdded: number;
  originalQuantity: number;
}

export interface ReorderSkippedItem {
  title: string;
  sku?: string;
  reason: string;
}

export interface ReorderResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: {
    addedItems: ReorderAddedItem[];
    skippedItems: ReorderSkippedItem[];
    cart?: any;
  };
  error?: {
    code: string;
    message?: string;
  };
}

export interface AdminRecordPaymentInput {
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  transactionId?: string;
  amount?: number;
  comment?: string;
}

export interface AdminRecordPaymentResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: {
    id: string;
    orderNumber: string;
    paymentStatus: string;
  };
  error?: {
    code: string;
    message?: string;
  };
}

export interface AdminOrderMetafieldInput {
  namespace: string;
  key: string;
  value: string;
  valueType?: "STRING" | "BOOLEAN" | "NUMBER" | "JSON";
  description?: string;
  isPublic: boolean;
}

export interface AdminOrderMetafieldResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: OrderMetafield | OrderMetafield[];
  error?: {
    code: string;
    message?: string;
  };
}
