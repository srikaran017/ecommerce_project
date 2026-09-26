export type PaymentGatewayType = "razorpay" | "stripe" | "cod";

export interface PaymentConfig {
  activeGateway: PaymentGatewayType;
  onlinePaymentEnabled: boolean;
  codEnabled: boolean;
  codFee: number;
  currency: string;
  gateways: {
    razorpay: {
      enabled: boolean;
      keyId: string;
      keySecret: string; // Server side only
      merchantName: string;
    };
    stripe: {
      enabled: boolean;
      publishableKey: string;
      secretKey: string; // Server side only
    };
    cod: {
      enabled: boolean;
      maxOrderLimit: number;
    };
  };
}

export const paymentConfig: PaymentConfig = {
  activeGateway: "razorpay",
  onlinePaymentEnabled: true,
  codEnabled: true,
  codFee: 50,
  currency: "INR",
  gateways: {
    razorpay: {
      enabled: true,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_sample_key",
      keySecret: process.env.RAZORPAY_KEY_SECRET || "sample_secret_key",
      merchantName: "MAISON DE ÉLÉGANCE",
    },
    stripe: {
      enabled: false,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
      secretKey: process.env.STRIPE_SECRET_KEY || "",
    },
    cod: {
      enabled: true,
      maxOrderLimit: 25000,
    },
  },
};
