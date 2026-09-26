export interface CreatePaymentOrderInput {
  orderId: string;
  orderNumber: string;
  amount: number; // In local currency units (e.g. INR)
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: Record<string, string>;
}

export interface PaymentOrderResult {
  success: boolean;
  paymentGatewayOrderId?: string;
  amount: number;
  currency: string;
  gateway: "razorpay" | "stripe" | "cod";
  clientSecretKey?: string; // Razorpay Key ID or Stripe Client Secret
  error?: string;
}

export interface VerifyPaymentInput {
  orderId: string;
  paymentGatewayOrderId?: string;
  paymentId?: string;
  signature?: string;
  rawPayload?: Record<string, any>;
}

export interface PaymentVerificationResult {
  success: boolean;
  transactionId: string;
  status: "COMPLETED" | "FAILED" | "PENDING";
  message?: string;
}

export interface RefundInput {
  transactionId: string;
  amount: number;
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  message?: string;
}

export interface PaymentGateway {
  name: string;
  createPaymentOrder(input: CreatePaymentOrderInput): Promise<PaymentOrderResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<PaymentVerificationResult>;
  refundPayment(input: RefundInput): Promise<RefundResult>;
}
