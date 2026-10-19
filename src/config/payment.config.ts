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
  upiId: "maison@okhdfcbank",
  payeeName: "Maison De Élégance",
  instructions: "Scan the QR code or tap 'Pay via UPI App', then enter your 12-digit UPI Reference / UTR Number below to confirm.",
  codMaxLimit: 25000,
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
    upiQr: {
      enabled: true,
      upiId: "maison@okhdfcbank",
      payeeName: "Maison De Élégance",
      instructions: "Scan the QR code or tap 'Pay via UPI App', then enter your 12-digit UPI Reference / UTR Number below to confirm.",
    },
  },
};
