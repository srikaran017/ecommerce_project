export interface PublicStoreFeatures {
  wishlist: boolean;
  reviews: boolean;
  coupons: boolean;
  guestCheckout: boolean;
  onlinePayment: boolean;
  cashOnDelivery: boolean;
  productVariants: boolean;
  whatsapp: boolean;
  newsletter: boolean;
  recommendations: boolean;
  sizeChart: boolean;
  orderTracking: boolean;
  [key: string]: boolean;
}

export interface PublicStorePolicies {
  shippingPolicy?: string;
  returnPolicy?: string;
  privacyPolicy?: string;
  termsOfService?: string;
  [key: string]: string | undefined;
}

export interface PublicStoreSettings {
  storeName: string;
  tagline: string;
  currency: string;
  currencySymbol: string;
  supportEmail: string;
  supportPhone: string;
  activeTheme: string;
  freeShippingThreshold: number;
  flatShippingRate: number;
  features: PublicStoreFeatures;
  policies: PublicStorePolicies;
}

export interface PublicStoreSettingsResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: PublicStoreSettings;
}
