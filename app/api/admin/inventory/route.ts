import { NextResponse } from "next/server";
import { z } from "zod";

const adjustStockSchema = z.object({
  variantId: z.string(),
  sku: z.string(),
  delta: z.number().int(),
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = adjustStockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, errors: parsed.error.format() }, { status: 400 });
    }

    const { variantId, sku, delta, reason } = parsed.data;

    // Log transaction
    const transaction = {
      id: `tx_${Date.now()}`,
      variantId,
      sku,
      quantityChange: delta,
      reason: reason || "Manual Admin Adjustment",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, transaction });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
