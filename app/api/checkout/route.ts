import { NextResponse } from "next/server";
import { z } from "zod";
import { PaymentFactory } from "@/services/payment";
import { NotificationManager } from "@/services/notification/notification.manager";
import { storeConfig } from "@/config/store.config";
import { FALLBACK_PRODUCTS } from "@/services/product.service";

const checkoutSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(8),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
  paymentMethod: z.enum(["razorpay", "cod", "stripe"]),
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string(),
      quantity: z.number().min(1),
    })
  ),
  couponCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { customerName, customerEmail, customerPhone, items, paymentMethod, couponCode } = parsed.data;

    // 1. Server-side price & stock verification
    let subtotal = 0;
    const resolvedItems: Array<{
      title: string;
      size: string;
      color: string;
      quantity: number;
      price: number;
      sku: string;
    }> = [];

    for (const item of items) {
      const product = FALLBACK_PRODUCTS.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, message: `Product ${item.productId} not found in atelier.` },
          { status: 404 }
        );
      }

      const variant =
        product.variants?.find((v) => v.id === item.variantId) || product.variants?.[0];

      if (!variant) {
        return NextResponse.json(
          { success: false, message: `Garment variant not found.` },
          { status: 404 }
        );
      }

      // Stock validation
      if (variant.stock < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient inventory for ${product.name} (${variant.size} / ${variant.colorName}). Only ${variant.stock} left in stock.`,
          },
          { status: 400 }
        );
      }

      const price = variant.price || product.price;
      subtotal += price * item.quantity;

      resolvedItems.push({
        title: product.name,
        size: variant.size,
        color: variant.colorName,
        quantity: item.quantity,
        price,
        sku: variant.sku,
      });

      // Atomic inventory deduction
      variant.stock = Math.max(0, variant.stock - item.quantity);
    }

    // 2. Coupon discount calculation
    let discount = 0;
    if (couponCode === "LUXE10" && subtotal >= 3000) {
      discount = Math.min(2500, Math.round((subtotal * 10) / 100));
    } else if (couponCode === "WELCOME1000" && subtotal >= 5000) {
      discount = 1000;
    }

    const shipping = subtotal >= storeConfig.shipping.freeShippingThreshold ? 0 : storeConfig.shipping.flatRate;
    const totalAmount = Math.max(0, subtotal - discount + shipping);
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const orderId = `ord_cuid_${Date.now()}`;

    // 3. Instantiate configured payment gateway
    const gateway = PaymentFactory.getGateway(paymentMethod);
    const paymentResult = await gateway.createPaymentOrder({
      orderId,
      orderNumber,
      amount: totalAmount,
      currency: storeConfig.currency.code,
      customerName,
      customerEmail,
      customerPhone,
    });

    // 4. Dispatch Email & WhatsApp notification
    await NotificationManager.sendOrderConfirmation({
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      totalAmount,
      currencySymbol: storeConfig.currency.symbol,
      items: resolvedItems,
      shippingAddress: `${parsed.data.shippingAddress.street}, ${parsed.data.shippingAddress.city}`,
    });

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      totalAmount,
      currency: storeConfig.currency.code,
      payment: paymentResult,
    });
  } catch (error: any) {
    console.error("API Checkout route failure:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Server checkout error" },
      { status: 500 }
    );
  }
}
