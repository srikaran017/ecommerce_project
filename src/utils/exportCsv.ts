/**
 * Zero-Cost Client-Side CSV Export Utility
 * Generates RFC 4180 compliant CSV files with UTF-8 BOM for Microsoft Excel & local couriers
 */

/**
 * Escapes a cell value for CSV formatting
 */
function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Download arbitrary array of objects as a CSV file
 */
export function exportToCsv<T extends Record<string, any>>(
  filename: string,
  data: T[],
  columns: Array<{ key: keyof T | string; header: string; format?: (row: T) => any }>
): void {
  if (!data || data.length === 0) {
    console.warn("No data available to export to CSV.");
    return;
  }

  // Header row
  const headerRow = columns.map((col) => escapeCsvValue(col.header)).join(",");

  // Data rows
  const dataRows = data.map((row) =>
    columns
      .map((col) => {
        const val = col.format ? col.format(row) : (row as any)[col.key];
        return escapeCsvValue(val);
      })
      .join(",")
  );

  // Combine with UTF-8 Byte Order Mark (BOM) so Excel displays Indian Rupee / special characters properly
  const csvContent = "\uFEFF" + [headerRow, ...dataRows].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * One-click helper to export Orders for Courier / Packing Slips
 */
export function exportOrdersCsv(orders: any[], storeName: string = "Store"): void {
  const dateStr = new Date().toISOString().split("T")[0];
  exportToCsv(
    `${storeName.toLowerCase().replace(/\s+/g, "_")}_orders_${dateStr}.csv`,
    orders,
    [
      { key: "orderNumber", header: "Order ID" },
      { key: "customerName", header: "Customer Name" },
      { key: "customerPhone", header: "Phone" },
      { key: "customerEmail", header: "Email" },
      {
        key: "shippingAddress",
        header: "Delivery Address",
        format: (o) => (typeof o.shippingAddress === "object" ? Object.values(o.shippingAddress).join(", ") : o.shippingAddress),
      },
      {
        key: "items",
        header: "Items Ordered",
        format: (o) =>
          Array.isArray(o.items)
            ? o.items.map((i: any) => `${i.title} (${i.size || "Standard"}, ${i.color || "Default"}) x${i.quantity}`).join("; ")
            : "N/A",
      },
      { key: "total", header: "Order Total (₹)" },
      { key: "paymentMethod", header: "Payment Mode" },
      { key: "paymentStatus", header: "Payment Status" },
      { key: "status", header: "Fulfillment Status" },
      { key: "date", header: "Order Date", format: (o) => o.createdAt || o.date || "N/A" },
    ]
  );
}

/**
 * One-click helper to export Inventory Stock Manifest
 */
export function exportInventoryCsv(items: any[], storeName: string = "Store"): void {
  const dateStr = new Date().toISOString().split("T")[0];
  exportToCsv(
    `${storeName.toLowerCase().replace(/\s+/g, "_")}_inventory_${dateStr}.csv`,
    items,
    [
      { key: "sku", header: "SKU" },
      { key: "productName", header: "Product Title" },
      { key: "size", header: "Size" },
      { key: "colorName", header: "Color" },
      { key: "price", header: "Selling Price (₹)" },
      { key: "stock", header: "Current Stock" },
      { key: "lowStockThreshold", header: "Threshold" },
      {
        key: "status",
        header: "Inventory Status",
        format: (i) => (i.stock === 0 ? "OUT_OF_STOCK" : i.stock <= (i.lowStockThreshold || 5) ? "LOW_STOCK" : "IN_STOCK"),
      },
    ]
  );
}
