import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { FALLBACK_PRODUCTS } from "@/services/product.service";

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string(),
  shortDescription: z.string().optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().optional(),
  costPrice: z.number().optional(),
  brand: z.string().default("Maison"),
  gender: z.enum(["MEN", "WOMEN", "UNISEX", "KIDS"]).default("WOMEN"),
  categorySlug: z.string(),
  variants: z.array(
    z.object({
      size: z.string(),
      colorName: z.string(),
      colorHex: z.string(),
      sku: z.string(),
      price: z.number(),
      stock: z.number(),
    })
  ),
  images: z.array(z.string()).default([]),
  fabricInfo: z.string().optional(),
  careInstructions: z.string().optional(),
  fitInfo: z.string().optional(),
});

export async function GET() {
  try {
    return NextResponse.json({ success: true, products: FALLBACK_PRODUCTS });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, errors: parsed.error.format() }, { status: 400 });
    }

    const data = parsed.data;

    // Build product object
    const newProduct = {
      id: `prod_${Date.now()}`,
      ...data,
      categoryName: data.categorySlug,
      tags: [],
      images: data.images.map((url, i) => ({ url, isPrimary: i === 0 })),
      variants: data.variants.map((v, i) => ({ id: `v_${Date.now()}_${i}`, ...v })),
      stock: data.variants.reduce((acc, v) => acc + v.stock, 0),
    };

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
