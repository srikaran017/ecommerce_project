import { featureConfig } from "@/config/feature.config";
import { storeConfig } from "@/config/store.config";
import {
  OrderNotificationPayload,
  ShippingNotificationPayload,
  NotificationResult,
} from "./types";

export class NotificationManager {
  /**
   * Dispatch order confirmation via Email and WhatsApp (if enabled in featureConfig).
   */
  static async sendOrderConfirmation(
    payload: OrderNotificationPayload
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    // 1. Email Channel
    try {
      console.log(`[Email Service] Order Confirmation sent to ${payload.customerEmail} for Order #${payload.orderNumber}`);
      results.push({
        channel: "EMAIL",
        success: true,
        messageId: `email_msg_${Date.now()}`,
      });
    } catch (err: any) {
      results.push({
        channel: "EMAIL",
        success: false,
        error: err?.message || "Failed to send email",
      });
    }

    // 2. WhatsApp Channel (respect feature flag)
    if (featureConfig.whatsapp && payload.customerPhone) {
      try {
        const textMessage = `Hello ${payload.customerName}! Thank you for your order #${payload.orderNumber} at ${storeConfig.name}. Total: ${payload.currencySymbol}${payload.totalAmount}. We are preparing your clothing items for dispatch.`;
        console.log(`[WhatsApp Service] Dispatched to ${payload.customerPhone}: "${textMessage}"`);

        results.push({
          channel: "WHATSAPP",
          success: true,
          messageId: `wa_msg_${Date.now()}`,
        });
      } catch (err: any) {
        results.push({
          channel: "WHATSAPP",
          success: false,
          error: err?.message || "Failed to send WhatsApp message",
        });
      }
    }

    return results;
  }

  /**
   * Dispatch shipping update notification.
   */
  static async sendShippingUpdate(
    payload: ShippingNotificationPayload
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    console.log(`[Notification Manager] Dispatching shipping update for Order #${payload.orderNumber}`);

    results.push({
      channel: "EMAIL",
      success: true,
      messageId: `ship_email_${Date.now()}`,
    });

    if (featureConfig.whatsapp && payload.customerPhone) {
      results.push({
        channel: "WHATSAPP",
        success: true,
        messageId: `ship_wa_${Date.now()}`,
      });
    }

    return results;
  }
}
