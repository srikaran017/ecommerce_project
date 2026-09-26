import { NextResponse } from "next/server";
import { PaymentFactory } from "@/services/payment";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, paymentGatewayOrderId, paymentId, signature, gateway = "razorpay" } = body;

    const paymentGateway = PaymentFactory.getGateway(gateway);
    const result = await paymentGateway.verifyPayment({
      orderId,
      paymentGatewayOrderId,
      paymentId,
      signature,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Payment verification route error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Verification failed" },
      { status: 500 }
    );
  }
}
