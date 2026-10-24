import { CustomerOrderItem } from "./order.types";

export type TrackingStepKey =
  | "ORDER_PLACED"
  | "ORDER_CONFIRMED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

export interface TrackingStep {
  step: number; // 1 to 5
  key: TrackingStepKey;
  title: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
  timestamp: string | null;
}

export interface TrackingCheckpoint {
  id: string;
  status: string;
  statusLabel: string;
  comment: string;
  timestamp: string;
  location?: string | null;
}

export interface OrderTrackingInfo {
  status: string;
  statusLabel: string;
  currentStep: number; // 0 to 5 (0 if cancelled)
  totalSteps: number; // 5
  isDelivered: boolean;
  isCancelled: boolean;
  isReturn: boolean;
  cancelReason: string | null;
  cancelledAt: string | null;
  courierPartner: string | null;
  trackingNumber: string | null;
  estimatedDelivery: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  steps: TrackingStep[];
  checkpoints: TrackingCheckpoint[];
}

export interface TrackOrderResponseData {
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  currency: string;
  itemsCount: number;
  items: CustomerOrderItem[];
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  shippingAddress?: {
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    address1?: string;
  };
  tracking: OrderTrackingInfo;
}

export interface TrackOrderResponse {
  success: boolean;
  statusCode?: number;
  message: string;
  data?: TrackOrderResponseData;
  error?: {
    code: string;
    message?: string;
  };
}

export interface AddCheckpointInput {
  comment: string;
  location?: string;
  status?: string;
}

export interface AddCheckpointResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: {
    checkpoint: {
      id: string;
      orderId: string;
      previousStatus?: string;
      newStatus?: string;
      comment: string;
      createdAt: string;
      changedBy?: {
        id: string;
        name: string;
        email: string;
        role: string;
      };
    };
  };
  error?: {
    code: string;
    message?: string;
  };
}
