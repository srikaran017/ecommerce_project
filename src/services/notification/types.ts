export type NotificationChannel = "EMAIL" | "WHATSAPP" | "SMS";

export interface OrderNotificationPayload {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  totalAmount: number;
  currencySymbol: string;
  items: Array<{ title: string; size: string; color: string; quantity: number }>;
  shippingAddress: string;
}

export interface ShippingNotificationPayload {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  trackingNumber?: string;
  courierName?: string;
}

export interface NotificationResult {
  channel: NotificationChannel;
  success: boolean;
  messageId?: string;
  error?: string;
}
