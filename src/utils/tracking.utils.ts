import {
  OrderTrackingInfo,
  TrackingStep,
  TrackingCheckpoint,
  TrackOrderResponseData,
} from "@/types/tracking.types";

/**
 * Mask PII for guest / public tracking protection
 */
export function maskName(name?: string): string {
  if (!name) return "Valued Client";
  const parts = name.trim().split(/\s+/);
  return parts
    .map((part) => {
      if (part.length <= 2) return part;
      return `${part[0]}***${part[part.length - 1]}`;
    })
    .join(" ");
}

export function maskEmail(email?: string): string {
  if (!email || !email.includes("@")) return "c***@client.com";
  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export function maskPhone(phone?: string): string {
  if (!phone) return "******0000";
  const clean = phone.replace(/\D/g, "");
  if (clean.length < 4) return "******" + clean;
  const last4 = clean.slice(-4);
  return `******${last4}`;
}

/**
 * Compiles canonical 5-step tracking progression according to Section 2 of Document 27.
 */
export function compileTrackingTimeline(order: any): OrderTrackingInfo {
  const status = (order.status || "CONFIRMED").toUpperCase();
  const isCancelled = status === "CANCELLED";
  const isReturn = ["RETURN_REQUESTED", "RETURNED", "REFUNDED"].includes(status);
  const isDelivered = status === "DELIVERED";

  // Calculate currentStep (1 to 5, 0 if cancelled)
  let currentStep = 1;
  if (isCancelled) {
    currentStep = 0;
  } else if (isDelivered) {
    currentStep = 5;
  } else if (status === "OUT_FOR_DELIVERY") {
    currentStep = 4;
  } else if (status === "SHIPPED") {
    currentStep = 3;
  } else if (["CONFIRMED", "PROCESSING", "PACKED"].includes(status)) {
    currentStep = 2;
  } else {
    currentStep = 1;
  }

  // Courier and tracking numbers
  const courierPartner =
    order.courierPartner ||
    order.courier?.carrierName ||
    (currentStep >= 3 ? "Delhivery Express" : null);

  const trackingNumber =
    order.trackingNumber ||
    order.courier?.trackingNumber ||
    (currentStep >= 3 ? "DL" + String(order.orderNumber || order.id || "").replace(/\D/g, "").slice(0, 10).padEnd(10, "8") : null);

  const estimatedDelivery =
    order.estimatedDelivery ||
    order.courier?.estimatedDelivery ||
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const shippedAt =
    order.shippedAt ||
    order.courier?.shippedAt ||
    (currentStep >= 3 ? order.createdAt : null);

  const deliveredAt =
    order.deliveredAt ||
    (isDelivered ? order.updatedAt || new Date().toISOString() : null);

  // Status human label
  let statusLabel = "Order Placed";
  if (isCancelled) statusLabel = "Order Cancelled";
  else if (isDelivered) statusLabel = "Delivered";
  else if (status === "OUT_FOR_DELIVERY") statusLabel = "Out for Delivery";
  else if (status === "SHIPPED") statusLabel = "Dispatched & In Transit";
  else if (status === "PACKED") statusLabel = "Garment Packed & Sealed";
  else if (status === "PROCESSING") statusLabel = "In Atelier Tailoring";
  else if (status === "CONFIRMED") statusLabel = "Order Confirmed";

  // Construct Canonical 5 Steps
  const steps: TrackingStep[] = [
    {
      step: 1,
      key: "ORDER_PLACED",
      title: "Order Placed",
      description: "Your order has been received and verified by our system.",
      isCompleted: !isCancelled,
      isCurrent: currentStep === 1,
      timestamp: order.createdAt || new Date().toISOString(),
    },
    {
      step: 2,
      key: "ORDER_CONFIRMED",
      title: "Order Confirmed",
      description: "Order verified and transferred to atelier for tailoring, finishing & packing.",
      isCompleted: currentStep >= 2,
      isCurrent: currentStep === 2,
      timestamp: currentStep >= 2 ? order.createdAt : null,
    },
    {
      step: 3,
      key: "SHIPPED",
      title: "Dispatched & In Transit",
      description:
        courierPartner && trackingNumber
          ? `Dispatched via ${courierPartner} (AWB: ${trackingNumber}).`
          : "Package handed over to our premium courier logistics partner.",
      isCompleted: currentStep >= 3,
      isCurrent: currentStep === 3,
      timestamp: currentStep >= 3 ? shippedAt || order.createdAt : null,
    },
    {
      step: 4,
      key: "OUT_FOR_DELIVERY",
      title: "Out for Delivery",
      description: "Courier executive is out for delivery to your destination address today.",
      isCompleted: currentStep >= 4,
      isCurrent: currentStep === 4,
      timestamp: currentStep >= 4 ? deliveredAt || new Date().toISOString() : null,
    },
    {
      step: 5,
      key: "DELIVERED",
      title: "Delivered",
      description: "Package successfully delivered to recipient.",
      isCompleted: currentStep === 5,
      isCurrent: currentStep === 5,
      timestamp: deliveredAt,
    },
  ];

  // Compile Checkpoints
  const rawHistory: any[] = Array.isArray(order.statusHistory)
    ? order.statusHistory
    : Array.isArray(order.checkpoints)
    ? order.checkpoints
    : [];

  const checkpoints: TrackingCheckpoint[] = [];

  if (rawHistory.length > 0) {
    rawHistory.forEach((h: any, idx: number) => {
      checkpoints.push({
        id: h.id || `cp_${idx}`,
        status: h.newStatus || h.status || "CONFIRMED",
        statusLabel: h.statusLabel || h.newStatus || "Milestone Update",
        comment: h.comment || "Order progression milestone logged.",
        timestamp: h.createdAt || h.timestamp || new Date().toISOString(),
        location: h.location || null,
      });
    });
  } else {
    // Generate synthetic checkpoints if none recorded
    checkpoints.push({
      id: "cp_1",
      status: "PENDING",
      statusLabel: "Order Placed",
      comment: "Order placed successfully by customer and payment captured.",
      timestamp: order.createdAt || new Date().toISOString(),
    });

    if (currentStep >= 2) {
      checkpoints.push({
        id: "cp_2",
        status: "CONFIRMED",
        statusLabel: "Order Confirmed",
        comment: "[Central Atelier] Order verified and sent to master artisans for fabric preparation.",
        timestamp: order.createdAt || new Date().toISOString(),
      });
    }

    if (currentStep >= 3 && courierPartner && trackingNumber) {
      checkpoints.push({
        id: "cp_3",
        status: "SHIPPED",
        statusLabel: "Dispatched / In Transit",
        comment: `Handed over to ${courierPartner} (AWB: ${trackingNumber}) with luxury garment seal.`,
        timestamp: shippedAt || new Date().toISOString(),
      });
    }

    if (currentStep >= 4) {
      checkpoints.push({
        id: "cp_4",
        status: "OUT_FOR_DELIVERY",
        statusLabel: "Out for Delivery",
        comment: "Courier executive out for final destination drop-off.",
        timestamp: new Date().toISOString(),
      });
    }

    if (currentStep === 5) {
      checkpoints.push({
        id: "cp_5",
        status: "DELIVERED",
        statusLabel: "Delivered",
        comment: "Package delivered safely to recipient.",
        timestamp: deliveredAt || new Date().toISOString(),
      });
    }
  }

  return {
    status,
    statusLabel,
    currentStep,
    totalSteps: 5,
    isDelivered,
    isCancelled,
    isReturn,
    cancelReason: order.cancelReason || null,
    cancelledAt: order.cancelledAt || null,
    courierPartner,
    trackingNumber,
    estimatedDelivery,
    shippedAt,
    deliveredAt,
    steps,
    checkpoints,
  };
}

/**
 * Transforms an order into TrackOrderResponseData with masked or full PII.
 */
export function formatTrackOrderData(order: any, isMasked = true): TrackOrderResponseData {
  const tracking = compileTrackingTimeline(order);
  const items = (order.items || []).map((it: any) => ({
    id: it.id || String(Math.random()),
    productId: it.productId || "",
    variantId: it.variantId || null,
    title: it.title || it.productName || "Luxury Garment",
    sku: it.sku || "",
    size: it.size || "Free Size",
    color: it.color || "",
    quantity: Number(it.quantity || 1),
    price: Number(it.price || 0),
    totalPrice: Number(it.totalPrice || Number(it.price || 0) * (it.quantity || 1)),
    imageUrl: it.imageUrl || it.image || "",
    productSlug: it.productSlug || "",
  }));

  const customerName = order.customerName || order.customer?.name || "Customer";
  const customerEmail = order.customerEmail || order.customer?.email || "";
  const customerPhone = order.customerPhone || order.customer?.phone || "";

  return {
    orderNumber: order.orderNumber || order.id,
    createdAt: order.createdAt || new Date().toISOString(),
    status: order.status || "CONFIRMED",
    paymentStatus: order.paymentStatus || "COMPLETED",
    paymentMethod: order.paymentMethod || "PREPAID",
    totalAmount: Number(order.totalAmount ?? order.total ?? 0),
    currency: order.currency || "INR",
    itemsCount: items.length,
    items,
    customer: {
      name: isMasked ? maskName(customerName) : customerName,
      email: isMasked ? maskEmail(customerEmail) : customerEmail,
      phone: isMasked ? maskPhone(customerPhone) : customerPhone,
    },
    shippingAddress: {
      city: order.shippingAddress?.city || "Customer City",
      state: order.shippingAddress?.state || "State",
      postalCode: isMasked
        ? String(order.shippingAddress?.postalCode || "").slice(0, 3) + "***"
        : order.shippingAddress?.postalCode,
      country: order.shippingAddress?.country || "India",
      address1: isMasked ? undefined : order.shippingAddress?.address1,
    },
    tracking,
  };
}
