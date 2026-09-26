import { paymentConfig, PaymentGatewayType } from "@/config/payment.config";
import { PaymentGateway } from "./types";
import { RazorpayGateway } from "./razorpay.service";
import { CODGateway } from "./cod.service";

export class PaymentFactory {
  static getGateway(type?: PaymentGatewayType): PaymentGateway {
    const selectedGateway = type || paymentConfig.activeGateway;

    switch (selectedGateway) {
      case "razorpay":
        return new RazorpayGateway();
      case "cod":
        return new CODGateway();
      default:
        return new RazorpayGateway();
    }
  }
}

export * from "./types";
export * from "./razorpay.service";
export * from "./cod.service";
