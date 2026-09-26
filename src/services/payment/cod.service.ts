import {
  PaymentGateway,
  CreatePaymentOrderInput,
  PaymentOrderResult,
  VerifyPaymentInput,
  PaymentVerificationResult,
  RefundInput,
  RefundResult,
} from "./types";

export class CODGateway implements PaymentGateway {
  name = "cod";

  async createPaymentOrder(input: CreatePaymentOrderInput): Promise<PaymentOrderResult> {
    return {
      success: true,
      paymentGatewayOrderId: `cod_${input.orderId}`,
      amount: input.amount,
      currency: input.currency,
      gateway: "cod",
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<PaymentVerificationResult> {
    return {
      success: true,
      transactionId: `cod_tx_${input.orderId}`,
      status: "PENDING", // Cash to be collected upon delivery
      message: "Cash on delivery order confirmed.",
    };
  }

  async refundPayment(input: RefundInput): Promise<RefundResult> {
    return {
      success: true,
      refundId: `cod_refund_${Date.now()}`,
      message: "Cash refund recorded for store admin processing.",
    };
  }
}
