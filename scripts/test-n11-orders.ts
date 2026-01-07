import "dotenv/config";
import { N11Provider } from "../src/marketplaces/n11Provider.js";

function formatAddress(address: any) {
  if (!address || typeof address !== "object") return "";
  const parts = [
    address.fullName || address.name,
    address.address,
    address.district,
    address.city,
    address.postalCode,
    address.country
  ].filter(Boolean);
  return parts.join(", ");
}

function formatItem(item: any) {
  if (!item || typeof item !== "object") return "";
  const qty = item.quantity ?? item.amount;
  const price = item.price ?? item.unitPrice;
  return [
    item.productId || item.sellerStockCode || item.productName || item.title,
    qty != null ? `qty=${qty}` : null,
    price != null ? `price=${price}` : null
  ].filter(Boolean).join(" | ");
}

async function main() {
  const provider = new N11Provider();
  const startDate = process.env.N11_TEST_START_DATE;
  const endDate = process.env.N11_TEST_END_DATE;
  const params = {
    startDate: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: endDate || new Date().toISOString()
  };

  console.log("N11 order test params:", params);
  const result = await provider.getNewOrders(params);

  console.log("status:", result.status);
  console.log("message:", result.message);
  console.log("orders:", result.orders?.length ?? 0);

  if (!result.orders?.length) return;

  result.orders.forEach((order: any, index: number) => {
    console.log(`\n#${index + 1} orderNumber=${order.orderNumber} id=${order.id}`);
    console.log(`status=${order.status} createdAt=${order.createdAt} total=${order.totalAmount} currency=${order.currency}`);
    console.log("billing:", formatAddress(order.billingAddress));
    console.log("shipping:", formatAddress(order.shippingAddress));

    if (Array.isArray(order.items) && order.items.length) {
      console.log("items:");
      order.items.forEach((item: any) => {
        console.log(" -", formatItem(item));
      });
    }
  });
}

main().catch((error) => {
  console.error("N11 order test failed:", error?.message || error);
  process.exit(1);
});
