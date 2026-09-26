import crypto from "crypto";
import Razorpay from "razorpay";
import { paymentConfig } from "@/config/payment.config";
import {
  PaymentGateway,
  CreatePaymentOrderInput,
  PaymentOrderResult,
  VerifyPaymentInput,
  PaymentVerificationResult,
  RefundInput,
  RefundResult,
} from "./types";

export class RazorpayGateway implements PaymentGateway {
  name = "razorpay";
  private razorpay: Razorpay | null = null;

  constructor() {
    const keyId = paymentConfig.gateways.razorpay.keyId;
    const keySecret = paymentConfig.gateways.razorpay.keySecret;

    if (keyId && keySecret && keyId !== "rzp_test_sample_key") {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }
  }

  async createPaymentOrder(input: CreatePaymentOrderInput): Promise<PaymentOrderResult> {
    try {
      if (!this.razorpay) {
        // Fallback / Sandbox mode if key not provided
        return {
          success: true,
          paymentGatewayOrderId: `rzp_order_mock_${Date.now()}`,
          amount: input.amount,
          currency: input.currency,
          gateway: "razorpay",
          clientSecretKey: paymentConfig.gateways.razorpay.keyId,
        };
      }

      const options = {
        amount: Math.round(input.amount * 100), // Razorpay accepts amounts in paise
        currency: input.currency || "INR",
        receipt: input.orderNumber,
        notes: {
          orderId: input.orderId,
          customerEmail: input.customerEmail,
          ...input.notes,
        },
      };

      const rzpOrder = await this.razorpay.orders.create(options);

      return {
        success: true,
        paymentGatewayOrderId: rzpOrder.id,
        amount: input.amount,
        currency: input.currency,
        gateway: "razorpay",
        clientSecretKey: paymentConfig.gateways.razorpay.keyId,
      };
    } catch (error: any) {
      console.error("Razorpay order creation failed:", error);
      return {
        success: false,
        amount: input.amount,
        currency: input.currency,
        gateway: "razorpay",
        error: error?.message || "Failed to initialize Razorpay payment.",
      };
    }
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<PaymentVerificationResult> {
    try {
      const { paymentGatewayOrderId, paymentId, signature } = input;

      if (!paymentGatewayOrderId || !paymentId) {
        return {
          success: false,
          transactionId: paymentId || "",
          status: "FAILED",
          message: "Missing payment details for verification.",
        };
      }

      // If mock mode
      if (paymentGatewayOrderId.startsWith("rzp_order_mock_")) {
        return {
          success: true,
          transactionId: paymentId || `pay_mock_${Date.now()}`,
          status: "COMPLETED",
          message: "Mock payment verified successfully.",
        };
      }

      const secret = paymentConfig.gateways.razorpay.keySecret;
      const body = `${paymentGatewayOrderId}|${paymentId}`;

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature === signature) {
        return {
          success: true,
          transactionId: paymentId,
          status: "COMPLETED",
          message: "Payment verified successfully.",
        };
      } else {
        return {
          success: false,
          transactionId: paymentId,
          status: "FAILED",
          message: "Invalid payment signature.",
        };
      }
    } catch (error: any) {
      console.error("Razorpay payment verification error:", error);
      return {
        success: false,
        transactionId: input.paymentId || "",
        status: "FAILED",
        message: error?.message || "Razorpay signature verification failed.",
      };
    }
  }

  async refundPayment(input: RefundInput): Promise<RefundResult> {
    try {
      if (!this.razorpay) {
        return {
          success: true,
          refundId: `rfnd_mock_${Date.now()}`,
          message: "Mock refund processed.",
        };
      }

      const refund = await this.razorpay.payments.refund(input.transactionId, {
        amount: Math.round(input.amount * 100),
        notes: { reason: input.reason || "Customer requested refund" },
      });

      return {
        success: true,
        refundId: refund.id,
        message: "Refund processed successfully.",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || "Failed to process refund.",
      };
    }
  }
}
