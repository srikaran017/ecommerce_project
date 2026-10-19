export interface CheckoutAddress {
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

export interface ValidateCouponInput {
  code: string;
  subtotal: number;
}

export interface ValidateCouponData {
  isValid: boolean;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  discountAmount: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  description?: string;
}

export interface ValidateCouponResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: ValidateCouponData;
  error?: {
    code: string;
    message?: string;
  };
}

export interface CheckoutSummaryInput {
  shippingAddressId?: string;
  shippingAddress?: CheckoutAddress;
  couponCode?: string;
}

export interface CheckoutSummaryItem {
  cartItemId: string;
  productId: string;
  variantId?: string | null;
  title: string;
  variantName?: string;
  sku: string;
  size?: string;
  color?: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  modifiers?: any[];
}

export interface CheckoutSummaryPricing {
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  freeShippingThreshold: number;
}

export interface AppliedCouponSummary {
  isValid: boolean;
  code: string;
  discountAmount: number;
  discountType?: "PERCENTAGE" | "FIXED";
  discountValue?: number;
}

export interface CheckoutSummaryData {
  cartId?: string;
  items: CheckoutSummaryItem[];
  pricing: CheckoutSummaryPricing;
  appliedCoupon?: AppliedCouponSummary | null;
  shippingAddress?: CheckoutAddress | null;
  isStockAvailable: boolean;
}

export interface CheckoutSummaryResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: CheckoutSummaryData;
  error?: {
    code: string;
    message?: string;
  };
}

export interface PlaceOrderInput {
  shippingAddressId?: string;
  shippingAddress?: CheckoutAddress;
  billingAddressSameAsShipping?: boolean;
  billingAddress?: CheckoutAddress;
  paymentMethod: "RAZORPAY" | "COD" | "UPI_QR";
  upiReference?: string;
  couponCode?: string;
  customerNotes?: string;
}

export interface RazorpayCheckoutPayload {
  orderId?: string;
  razorpayOrderId?: string;
  keyId: string;
  amount: number; // in paise (e.g. 951888 for 9518.88)
  currency: string;
}

export interface PlaceOrderData {
  order: {
    id: string;
    orderNumber: string;
    status?: string;
    orderStatus?: string;
    paymentStatus: string;
    paymentMethod: "RAZORPAY" | "COD" | "UPI_QR" | string;
    subtotal?: number;
    discountAmount?: number;
    shippingAmount?: number;
    taxAmount?: number;
    totalAmount: number;
    upiReference?: string;
    items?: any[];
    [key: string]: any;
  };
  razorpay?: RazorpayCheckoutPayload;
  paymentDetails?: {
    razorpayOrderId?: string;
    orderId?: string;
    amount: number;
    currency: string;
    keyId: string;
  };
}

export interface PlaceOrderResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: PlaceOrderData;
  error?: {
    code: string;
    message?: string;
  };
}

export interface VerifyPaymentInput {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentData {
  verified: boolean;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    totalAmount: number;
  };
}

export interface VerifyPaymentResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: VerifyPaymentData;
  error?: {
    code: string;
    message?: string;
  };
}

export interface OrderConfirmationPayment {
  gateway: string;
  status: string;
  transactionId?: string;
  amount: number;
}

export interface OrderConfirmationItem {
  id: string;
  title: string;
  sku?: string;
  size?: string;
  color?: string;
  imageUrl?: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderConfirmationData {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: "RAZORPAY" | "COD" | "UPI_QR" | string;
  upiReference?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: CheckoutAddress;
  billingAddress?: CheckoutAddress;
  items: OrderConfirmationItem[];
  pricing: {
    subtotal: number;
    discountAmount: number;
    shippingAmount: number;
    taxAmount: number;
    totalAmount: number;
    currency: string;
  };
  payments?: OrderConfirmationPayment[];
  createdAt: string;
}

export interface OrderConfirmationResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: OrderConfirmationData;
  error?: {
    code: string;
    message?: string;
  };
}
