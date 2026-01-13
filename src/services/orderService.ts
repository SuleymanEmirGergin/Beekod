import { ResultSetHeader } from "mysql2";
import { query } from "../db.js";
import { IOrder, IOrderItem, IOrderDbRow, mapOrderRow } from "../models/Order.js";
import { NotFoundError, InternalError } from "../errors/AppError.js";
import { socketService } from "./socketService.js";

// Define DTO specifically if needed, otherwise use any for flexibility in demo
interface CreateOrderDTO {
  source: { name: string; icon?: string; color?: string; logo?: string; marketplaceId?: string };
  customer: { name: string; email?: string; phone?: string; address?: string };
  items: any[];
  total?: string;
}

// In-Memory Storage for Demo Persistence (when DB fails)
const inMemoryOrders: any[] = [];

export const getAllOrders = async (): Promise<IOrder[]> => {
  let result: IOrder[] = [];

  try {
    const orders = await query<IOrderDbRow[]>("SELECT * FROM orders ORDER BY created_at DESC");
    for (const order of orders) {
      const items = await query<IOrderItem[]>("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
      result.push(mapOrderRow(order, items));
    }
  } catch (err) {
    console.warn("DB Select Failed, using mock/memory data only");
  }

  // Merge In-Memory Orders (created during this session but failed to save to DB)
  // We map them to ensure they match IOrder structure
  const memoryMapped = inMemoryOrders.map(o => ({
    ...o,
    // Add any missing calculated fields if needed, but the push object is usually complete
  }));

  const finalResult = [...result, ...memoryMapped];

  // FALLBACK: If ABSOLUTELY no orders (DB empty + Memory empty), return Static Mock Data suitable for new users
  if (finalResult.length === 0) {
    return [
      {
        id: 1,
        requestId: "#BK-2094",
        source: { name: "Trendyol", logo: "https://cdn.dsmcdn.com/web/production/ty-logo.svg", marketplaceId: "ty" },
        customer: { name: "Ahmet Yılmaz", initials: "AY", color: "bg-orange-500", email: "ahmet@test.com" },
        date: "Today, 10:30 AM",
        total: "₺1,299.00",
        total_amount_numeric: 1299,
        currency: "TRY",
        status: { label: "New", color: "bg-yellow-50 text-yellow-700", dot: "bg-yellow-500" },
        items: [],
        products: ["Kablosuz Kulaklık"],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        requestId: "#BK-2093",
        source: { name: "Hepsiburada", logo: "https://images.hepsiburada.net/assets/s/logo/hepsiburada_logo_2020.svg", marketplaceId: "hb" },
        customer: { name: "Ayşe Demir", initials: "AD", color: "bg-purple-500", email: "ayse@test.com" },
        date: "Yesterday, 14:15 PM",
        total: "₺850.00",
        total_amount_numeric: 850,
        currency: "TRY",
        status: { label: "Processing", color: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
        items: [],
        products: ["Akıllı Bileklik", "Ekran Koruyucu"],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  return finalResult;
};

export const getOrderById = async (requestId: string): Promise<IOrder | null> => {
  // Check memory first
  const memoryOrder = inMemoryOrders.find(o => o.requestId === requestId || o.id.toString() === requestId);
  if (memoryOrder) return memoryOrder;

  try {
    const rows = await query<IOrderDbRow[]>("SELECT * FROM orders WHERE request_id = ? OR id = ?", [requestId, requestId]);
    const order = rows[0];
    if (!order) {
      // Return null instead of throwing to be searching safely
      return null;
    }
    const items = await query<IOrderItem[]>("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
    return mapOrderRow(order, items);
  } catch (err) {
    console.warn("GetOrderById DB failed", err);
    return null;
  }
};

export const createOrder = async (orderData: any): Promise<any> => {
  const requestId = `#BK-${Math.floor(1000 + Math.random() * 9000)}`;

  // Prepare Mock Object FIRST (to use in both Success and Fallback paths)
  const mockOrder = {
    id: Math.floor(Math.random() * 10000) + 50000, // Large ID to avoid conflict
    requestId: requestId,
    source: {
      name: orderData.source?.name || "Manual",
      icon: orderData.source?.icon || "B",
      logo: orderData.source?.logo,
      color: orderData.source?.color || "bg-gray-500"
    },
    customer: {
      name: orderData.customer?.name || "Guest",
      initials: (orderData.customer?.name || "G").substring(0, 2).toUpperCase(),
      color: "bg-blue-500",
      email: orderData.customer?.email,
      phone: orderData.customer?.phone,
      address: orderData.customer?.address
    },
    date: "Just now",
    total: orderData.total || "₺0.00",
    total_amount_numeric: parseFloat((orderData.total || "0").replace(/[^0-9.]/g, "")),
    status: { label: 'New', color: 'bg-yellow-50 text-yellow-700', dot: 'bg-yellow-500' },
    items: orderData.items || [],
    products: (orderData.items || []).map((i: any) => i.name),
    currency: 'TRY',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  try {
    const { customer, source, items, total } = orderData;
    const total_amount_numeric = parseFloat((total || "0").replace(/[^0-9.]/g, ""));

    // Try DB Insert
    // NOTE: If table doesn't exist or columns mismatch, this throws
    const result = await query<any>(
      `INSERT INTO orders 
      (request_id, source_name, source_icon, source_color, customer_name, customer_email, customer_phone, customer_address, total_amount, total_amount_numeric, status_label, order_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', NOW())`,
      [
        requestId,
        source.name,
        source.icon,
        source.color,
        customer.name,
        customer.email,
        customer.phone,
        customer.address,
        total || "₺0.00",
        total_amount_numeric
      ]
    );

    const orderId = result.insertId;

    if (items && items.length > 0) {
      for (const item of items) {
        // Try items insert
        await query(
          "INSERT INTO order_items (order_id, product_name, sku, price, quantity, image_url) VALUES (?, ?, ?, ?, ?, ?)",
          [orderId, item.name, item.sku, item.price, item.quantity, item.image]
        );
      }
    }

    // If successful, we could return the DB row, OR simply return the compliant object we already prepared
    // The Frontend expects the full object structure immediately
    // Let's add the real DB ID to the mock object
    mockOrder.id = orderId;

    // Send Socket Notification
    socketService.emit('notification:new_order', {
      message: `Yeni Sipariş: ${mockOrder.total} (${mockOrder.source.name})`,
      orderId: mockOrder.requestId,
      total: mockOrder.total
    });

    return mockOrder;

  } catch (err) {
    console.warn("Order DB Insert Failed, falling back to Mock info for Demo", { err });

    // SAVE TO MEMORY so it appears in the list!
    inMemoryOrders.unshift(mockOrder); // Add to beginning

    // Return the memory object to the controller/frontend
    return mockOrder;
  }
};

export const updateOrderStatus = async (requestId: string, statusLabel: string): Promise<IOrder | null> => {
  // Check memory first
  const memoryIndex = inMemoryOrders.findIndex(o => o.requestId === requestId || o.id.toString() === requestId);
  if (memoryIndex >= 0) {
    // Update in memory
    const statusMap: Record<string, { color: string; dot: string }> = {
      New: { color: "bg-yellow-50 text-yellow-700", dot: "bg-yellow-500" },
      Processing: { color: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
      Shipped: { color: "bg-green-50 text-green-700", dot: "bg-green-500" },
      Delivered: { color: "bg-green-50 text-green-700", dot: "bg-green-500" },
      Cancelled: { color: "bg-gray-50 text-gray-700", dot: "bg-gray-400" },
      Returned: { color: "bg-red-50 text-red-700", dot: "bg-red-500" },
    };
    const statusStyle = statusMap[statusLabel] || statusMap["New"];

    inMemoryOrders[memoryIndex].status = { label: statusLabel, ...statusStyle };
    return inMemoryOrders[memoryIndex];
  }

  // DB Update
  const statusMap: Record<string, { color: string; dot: string }> = {
    New: { color: "bg-yellow-50 text-yellow-700", dot: "bg-yellow-500" },
    Processing: { color: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
    Shipped: { color: "bg-green-50 text-green-700", dot: "bg-green-500" },
    Delivered: { color: "bg-green-50 text-green-700", dot: "bg-green-500" },
    Cancelled: { color: "bg-gray-50 text-gray-700", dot: "bg-gray-400" },
    Returned: { color: "bg-red-50 text-red-700", dot: "bg-red-500" },
  };

  const statusStyle = statusMap[statusLabel] || statusMap["New"];

  try {
    const result = await query<ResultSetHeader>(
      "UPDATE orders SET status_label = ?, status_color = ?, status_dot = ? WHERE request_id = ?",
      [statusLabel, statusStyle.color, statusStyle.dot, requestId],
    );
    return await getOrderById(requestId);
  } catch (e) {
    // If DB fails, just return null or throw. 
    // For demo stability, throw descriptive error
    throw new NotFoundError("Güncelleme başarısız (DB Hatası)");
  }
};

export const updateOrderShipping = async (
  requestId: string,
  shipping: { provider: string; trackingNumber: string; labelUrl: string }
): Promise<IOrder | null> => {
  // Memory Update
  const memoryIndex = inMemoryOrders.findIndex(o => o.requestId === requestId || o.id.toString() === requestId);
  if (memoryIndex >= 0) {
    inMemoryOrders[memoryIndex].shipping = shipping;
    return inMemoryOrders[memoryIndex];
  }

  try {
    const result = await query<ResultSetHeader>(
      "UPDATE orders SET shipping_provider = ?, tracking_number = ?, shipping_label_url = ? WHERE request_id = ?",
      [shipping.provider, shipping.trackingNumber, shipping.labelUrl, requestId]
    );
    return await getOrderById(requestId);
  } catch (e) {
    throw new NotFoundError("Kargo güncelleme başarısız (DB Hatası)");
  }
};
