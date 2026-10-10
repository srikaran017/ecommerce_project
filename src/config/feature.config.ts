export interface FeatureConfig {
  wishlist: boolean;
  reviews: boolean;
  coupons: boolean;
  guestCheckout: boolean;
  onlinePayment: boolean;
  cashOnDelivery: boolean;
  productVariants: boolean;
  productReviews: boolean;
  search: boolean;
  filters: boolean;
  whatsapp: boolean;
  newsletter: boolean;
  loyaltyProgram: boolean;
  referralProgram: boolean;
  orderTracking: boolean;
  invoice: boolean;
  recommendations: boolean;
  recentlyViewed: boolean;
  stockManagement: boolean;
  multipleAddresses: boolean;
  customerAccounts: boolean;
  sizeChart: boolean;
  googleAuth: boolean;
}

export const featureConfig: FeatureConfig = {
  wishlist: true,
  reviews: true,
  coupons: true,
  guestCheckout: true,
  onlinePayment: true,
  cashOnDelivery: true,
  productVariants: true,
  productReviews: true,
  search: true,
  filters: true,
  whatsapp: true,
  newsletter: true,
  loyaltyProgram: false,
  referralProgram: false,
  orderTracking: true,
  invoice: true,
  recommendations: true,
  recentlyViewed: true,
  stockManagement: true,
  multipleAddresses: true,
  customerAccounts: true,
  sizeChart: true,
  googleAuth: true,
};

/**
 * Utility guard function to check feature flag enablement.
 * Can easily be replaced with a database lookup or session context.
 */
export function isFeatureEnabled(feature: keyof FeatureConfig, overrides?: Partial<FeatureConfig>): boolean {
  if (overrides && typeof overrides[feature] === "boolean") {
    return overrides[feature]!;
  }
  return !!featureConfig[feature];
}
