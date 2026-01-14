import { query } from "../../db.js";
import { getOrderById } from "./orderService.js";
import { getMarketplaceProviders } from "../marketplace/index.js";
import { updateStock } from "../product/productService.js";
import { logger } from "../../logger.js";
import { MarketplaceOrder } from "../marketplace/types.js";

export const syncOrdersFromMarketplaces = async () => {
  const providers = getMarketplaceProviders();
  logger.info("order_sync.start");
  const results: {
    totalNewOrders: number;
    processedOrders: string[];
    errors: string[];
  } = {
    totalNewOrders: 0,
    processedOrders: [],
    errors: [],
  };

  for (const provider of providers) {
    if (!provider.isConfigured()) continue;

    try {
      const result = await provider.getNewOrders();
      if (result.ok) {
        const syncResult = result.value;
        for (const mOrder of syncResult.orders) {
          const processed = await processMarketplaceOrder(mOrder);
          if (processed) {
            results.totalNewOrders++;
            results.processedOrders.push(`${mOrder.marketplace}: ${mOrder.orderNumber}`);
          }
        }
      } else {
        results.errors.push(`${provider.name}: ${result.error instanceof Error ? result.error.message : String(result.error)}`);
      }
    } catch (error) {
      logger.error("order_sync.provider_error", { provider: provider.name, error });
      results.errors.push(`${provider.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  logger.info("order_sync.complete", { total: results.totalNewOrders });
  return results;
};

async function processMarketplaceOrder(mOrder: MarketplaceOrder) {
  // Check if order already exists
  const [existing] = await query<any[]>("SELECT id FROM orders WHERE request_id = ?", [mOrder.orderNumber]);
  if (existing) return false;

  // Helper properties
  const initials = (mOrder.customerName || "Customer Name")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const orderDate = new Date(mOrder.orderDate).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  const totalAmount = `₺${mOrder.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`;
  const productsList = mOrder.items.map((item) => item.name).join(", ");

  // Create new Order
  const result = await query<any>(
    `INSERT INTO orders (
            request_id, source_name, source_id,
            customer_name, customer_email, customer_phone, customer_address, customer_initials, customer_color,
            order_date, total_amount, total_amount_numeric, currency, status_label, status_color, status_dot, products_list,
            cargo_company, tracking_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      mOrder.orderNumber,
      mOrder.marketplace,
      mOrder.marketplace,
      mOrder.customerName,
      mOrder.customerEmail,
      mOrder.customerPhone,
      mOrder.customerAddress,
      initials,
      randomColor,
      orderDate,
      totalAmount,
      mOrder.totalAmount,
      mOrder.currency,
      "New",
      "bg-yellow-50 text-yellow-700",
      "bg-yellow-500",
      productsList,
      mOrder.cargoInfo?.cargoCompany || null,
      mOrder.cargoInfo?.trackingNumber || null
    ],
  );

  const orderId = result.insertId;

  // Insert items and Deduct stock
  for (const item of mOrder.items) {
    const itemPrice = `₺${(item.price || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`;

    let imageUrl = item.image;

    // AUTO-CREATE PRODUCT / SYNC CHECK
    if (item.barcode) {
      const [existingProduct] = await query<any[]>("SELECT id, images FROM products WHERE barcode = ?", [
        item.barcode,
      ]);

      if (!existingProduct) {
        // Product doesn't exist, auto-create it (Ghost Sync)
        logger.info("order_sync.auto_create_product", {
          barcode: item.barcode,
          name: item.name,
          marketplace: mOrder.marketplace,
        });
        
        // Use a placeholder image if none provided in order
        const defaultImage = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400";
        const prodImage = item.image || defaultImage;

        await query(
          `INSERT INTO products (
            name, sku, barcode, price, stock, category, 
            description, status, images, currency, marketplace_links
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.name,
            item.sku || item.barcode, // Fallback SKU
            item.barcode,
            item.price,
            0, // Initial stock 0 (since we just sold it, or unknown)
            "Uncategorized", // Default category
            `Auto-created from ${mOrder.marketplace} order`,
            "Active",
            JSON.stringify([prodImage]),
            mOrder.currency || "TRY",
            JSON.stringify([{ marketplace: mOrder.marketplace, url: "#", syncStatus: "synced" }])
          ]
        );
        
        if (!imageUrl) imageUrl = prodImage;
      } else {
         // If product exists but we have no image for the line item, try to use product image
         if (!imageUrl && existingProduct.images) {
            try {
                const imgs = JSON.parse(existingProduct.images);
                if (Array.isArray(imgs) && imgs.length > 0) imageUrl = imgs[0];
            } catch (e) { /* ignore json error */ }
         }
      }

      // Deduct stock (it will go negative if we started at 0, which is correct for tracking need)
      await updateStock(
        item.barcode,
        -item.quantity,
        "Marketplace Order",
        `Sipariş alındı: ${mOrder.marketplace} (${mOrder.orderNumber})`,
      );
    }

    await query(
      `INSERT INTO order_items (order_id, product_name, sku, price, price_numeric, quantity, image_url)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderId, item.name, item.sku, itemPrice, item.price, item.quantity, imageUrl],
    );
  }

  return true;
}
