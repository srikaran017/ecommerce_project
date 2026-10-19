import { storeConfig } from "@/config/store.config";

export type PaymentGatewayType = "razorpay" | "stripe" | "cod" | "upi_qr";

export interface PaymentMethodsConfig {
  enableRazorpay: boolean;
  enableCod: boolean;
  enableUpiQr: boolean;
  upiId: string;
  payeeName: string;
  instructions: string;
  codMaxLimit: number;
}

export const DEFAULT_PAYMENT_METHODS: PaymentMethodsConfig = {
  enableRazorpay: true,
  enableCod: true,
  enableUpiQr: true,
  upiId: storeConfig.payment.upiId,
  payeeName: storeConfig.payment.payeeName || storeConfig.name,
  instructions: storeConfig.payment.instructions,
  codMaxLimit: storeConfig.payment.codMaxLimit || 10000,
};

const PAYMENT_STORAGE_KEY = "wardrobe_payment_methods_config_v1";

/**
 * Get active payment methods configuration from client storage or defaults
 */
export function getStorePaymentConfig(): PaymentMethodsConfig {
  if (typeof window === "undefined") return DEFAULT_PAYMENT_METHODS;
  try {
    const raw = localStorage.getItem(PAYMENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PAYMENT_METHODS,
        ...parsed,
      };
    }
  } catch (err) {
    console.warn("Could not read local payment config:", err);
  }
  return DEFAULT_PAYMENT_METHODS;
}

/**
 * Save active payment methods configuration to client storage
 */
export function saveStorePaymentConfig(config: Partial<PaymentMethodsConfig>): PaymentMethodsConfig {
  const current = getStorePaymentConfig();
  const updated: PaymentMethodsConfig = {
    ...current,
    ...config,
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(updated));
      // Dispatch custom event for cross-component reactivity
      window.dispatchEvent(new Event("payment-config-updated"));
    } catch (err) {
      console.warn("Could not persist local payment config:", err);
    }
  }
  return updated;
}

export interface PaymentConfig {
  activeGateway: PaymentGatewayType;
  onlinePaymentEnabled: boolean;
  codEnabled: boolean;
  upiQrEnabled: boolean;
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
    upiQr: {
      enabled: boolean;
      upiId: string;
      payeeName: string;
      instructions: string;
    };
  };
}

export const paymentConfig: PaymentConfig = {
  activeGateway: "razorpay",
  onlinePaymentEnabled: true,
  codEnabled: true,
  upiQrEnabled: true,
  codFee: 50,
  currency: "INR",
  gateways: {
    razorpay: {
      enabled: true,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_sample_key",
      keySecret: process.env.RAZORPAY_KEY_SECRET || "sample_secret_key",
      merchantName: storeConfig.name,
    },
    stripe: {
      enabled: false,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
      secretKey: process.env.STRIPE_SECRET_KEY || "",
    },
    cod: {
      enabled: true,
      maxOrderLimit: storeConfig.payment.codMaxLimit || 10000,
    },
    upiQr: {
      enabled: true,
      upiId: storeConfig.payment.upiId,
      payeeName: storeConfig.payment.payeeName || storeConfig.name,
      instructions: storeConfig.payment.instructions,
    },
  },
};
