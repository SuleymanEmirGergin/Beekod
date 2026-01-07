import { getSalesRecords } from "./salesStore.js";
import {
  DashboardData,
  DashboardStats,
  ChartDataPoint,
  TopSellingProduct,
  MarketplaceOrder,
} from "../models/dashboardTypes.js";

// Helper to group sales records by Order ID
const groupOrders = (records: any[]) => {
  const orders = new Map<string, any>();
  for (const record of records) {
    if (!orders.has(record.orderId)) {
      orders.set(record.orderId, {
        requestId: record.orderId,
        date: record.date,
        marketplace: record.marketplace,
        items: [],
        total: 0,
      });
    }
    const order = orders.get(record.orderId);
    order.items.push(record);
    order.total += record.unitPrice * record.quantity;
  }
  return Array.from(orders.values());
};

export const getDashboardData = async (): Promise<DashboardData> => {
  const salesRecords = await getSalesRecords();
  const orders = groupOrders(salesRecords);

  // 1. Calculate Stats
  let totalRevenue = 0;
  let returnsCount = 0; // standard csv doesn't track returns yet

  // Products map for top selling
  const productSales = new Map<string, { name: string; image: string; count: number; revenue: number }>();

  for (const record of salesRecords) {
    totalRevenue += record.unitPrice * record.quantity;

    // Aggregate products
    const key = record.barcode || "unknown";
    const current = productSales.get(key) || { name: record.barcode || "Ürün", image: "", count: 0, revenue: 0 };
    current.count += record.quantity;
    current.revenue += record.unitPrice * record.quantity;
    productSales.set(key, current);
  }

  // 2. Chart Data (Monthly)
  const monthlyData = new Map<string, { orders: number; revenue: number }>();

  for (const order of orders) {
    if (!order.date) continue;
    const date = new Date(order.date);
    if (isNaN(date.getTime())) continue;

    const monthKey = date.toLocaleString("tr-TR", { month: "long" }); // "Mart", "Kasım"

    const current = monthlyData.get(monthKey) || { orders: 0, revenue: 0 };
    current.orders += 1;
    current.revenue += order.total;
    monthlyData.set(monthKey, current);
  }

  const chartData: ChartDataPoint[] = Array.from(monthlyData.entries()).map(([label, data]) => ({
    label,
    orders: data.orders,
    revenue: data.revenue,
  }));

  // 3. Top Selling Products
  const topProducts: TopSellingProduct[] = Array.from(productSales.entries())
    .map(([id, data]) => ({
      id,
      name: data.name,
      image: data.image,
      quantity: data.count,
      orders: data.count,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // 4. Marketplace Orders (Recent 10)
  // Sort orders by date descending first
  orders.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  const marketplaceOrders: MarketplaceOrder[] = orders.slice(0, 10).map((order) => ({
    id: order.requestId,
    orderNumber: order.requestId,
    marketplace: {
      name: order.marketplace || "Diğer",
      icon: "",
    },
    productName: order.items.length > 0 ? order.items[0].barcode || "Ürün" : "Ürün",
    date: new Date(order.date).toLocaleString("tr-TR"),
    price: order.total,
    currency: "TRY",
    status: "Tamamlandı", // Default status for historical sales
  }));

  const stats: DashboardStats = {
    orders: orders.length,
    revenue: totalRevenue,
    returns: returnsCount,
    profit: totalRevenue * 0.25, // Estimates
    currency: "TRY",
  };

  return {
    stats,
    chartData,
    topProducts,
    marketplaceOrders,
  };
};
