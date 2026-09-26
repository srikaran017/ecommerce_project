import { NextResponse } from "next/server";
import crypto from "crypto";
import { paymentConfig } from "@/config/payment.config";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET || paymentConfig.gateways.razorpay.keySecret;

    if (signature && webhookSecret && webhookSecret !== "sample_secret_key") {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        return NextResponse.json({ success: false, message: "Invalid webhook signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    console.log(`[Razorpay Webhook Received] Event: ${eventType}`);

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentEntity?.notes?.orderId;
      console.log(`[Order Confirmed via Webhook] Order: ${orderId}, Transaction: ${paymentEntity?.id}`);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
