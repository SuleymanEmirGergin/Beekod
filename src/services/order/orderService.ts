import { ResultSetHeader } from "mysql2";
import { query } from "../../db.js";
import { IOrder, IOrderItem, IOrderDbRow, mapOrderRow } from "../../models/Order.js";
import { socketService } from "../socketService.js";
import { ok, fail, Result } from "../../utils/result.js";

interface CreateOrderDTO {
  source: { name: string; icon?: string; color?: string; logo?: string; marketplaceId?: string };
  customer: { name: string; email?: string; phone?: string; address?: string };
  items: Partial<IOrderItem>[];
  total?: string;
}

export const getAllOrders = async (): Promise<Result<IOrder[]>> => {
  try {
    const orders = await query<IOrderDbRow[]>("SELECT * FROM orders ORDER BY created_at DESC");
    const result: IOrder[] = [];

    for (const order of orders) {
      const items = await query<IOrderItem[]>("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
      result.push(mapOrderRow(order, items));
    }

    return ok(result);
  } catch (err: unknown) {
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
};

export const getRecentOrders = async (days: number, limit = 50): Promise<Result<IOrder[]>> => {
  try {
    const orders = await query<IOrderDbRow[]>(
      "SELECT * FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) ORDER BY created_at DESC LIMIT ?",
      [days, limit],
    );
    const result: IOrder[] = [];

    for (const order of orders) {
      const items = await query<IOrderItem[]>("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
      result.push(mapOrderRow(order, items));
    }

    return ok(result);
  } catch (err: unknown) {
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
};

export const getOrderById = async (requestId: string): Promise<Result<IOrder>> => {
  try {
    const rows = await query<IOrderDbRow[]>("SELECT * FROM orders WHERE request_id = ?", [requestId]);
    const order = rows[0];
    if (!order) {
      return fail(new Error(`Request ID ${requestId} ile sipariş bulunamadı`));
    }

    const items = await query<IOrderItem[]>("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
    return ok(mapOrderRow(order, items));
  } catch (err: unknown) {
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
};

export const createOrder = async (data: CreateOrderDTO): Promise<Result<IOrder>> => {
  try {
    // Generate Request ID
    const countRows = await query<{ count: number }[]>("SELECT COUNT(*) as count FROM orders");
    const count = countRows[0].count;
    const requestId = `#BK-${2095 + count}`;

    // Calculate total if not provided
    const total = data.total || "₺0.00";
    const productsList = data.items.map((item) => item.product_name).join(", ");

    // UI Helpers
    const initials = data.customer.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

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

    const statusLabel = "New";
    const statusColor = "bg-yellow-50 text-yellow-700";
    const statusDot = "bg-yellow-500";
    const orderDate = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });

    const totalNumeric = parseFloat(total.replace(/[₺.]/g, "").replace(",", ".")) || 0;

    const result = await query<ResultSetHeader>(
      `INSERT INTO orders (
              request_id, source_name, source_id, source_logo, source_icon, source_color,
              customer_name, customer_email, customer_phone, customer_address, customer_initials, customer_color,
              order_date, total_amount, total_amount_numeric, status_label, status_color, status_dot, products_list
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requestId,
        data.source.name,
        data.source.marketplaceId,
        data.source.logo,
        data.source.icon,
        data.source.color,
        data.customer.name,
        data.customer.email,
        data.customer.phone,
        data.customer.address,
        initials,
        randomColor,
        orderDate,
        total,
        totalNumeric,
        statusLabel,
        statusColor,
        statusDot,
        productsList,
      ],
    );

    const orderId = result.insertId;

    // Insert items
    for (const item of data.items) {
      const itemPriceRaw = item.price || "₺0.00";
      const itemPriceNumeric = parseFloat(itemPriceRaw.toString().replace(/[₺.]/g, "").replace(",", ".")) || 0;

      await query<ResultSetHeader>(
        `INSERT INTO order_items (order_id, product_name, sku, price, price_numeric, quantity, image_url)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_name, item.sku, itemPriceRaw, itemPriceNumeric, item.quantity, item.image_url],
      );
    }

    const finalOrderRes = await getOrderById(requestId);

    if (finalOrderRes.ok) {
      const finalOrder = finalOrderRes.value;
      socketService.emit('notification:new_order', {
        message: `Yeni Sipariş: ${finalOrder.total} (${data.source.name})`,
        orderId: finalOrder.requestId,
        total: finalOrder.total
      });
    }

    return finalOrderRes;
  } catch (err: unknown) {
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
};

export const updateOrderStatus = async (requestId: string, statusLabel: string): Promise<Result<IOrder>> => {
  try {
    // Map status label to UI colors
    const statusMap: Record<string, { color: string; dot: string }> = {
      New: { color: "bg-yellow-50 text-yellow-700", dot: "bg-yellow-500" },
      Processing: { color: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
      Shipped: { color: "bg-green-50 text-green-700", dot: "bg-green-500" },
      Delivered: { color: "bg-green-50 text-green-700", dot: "bg-green-500" },
      Cancelled: { color: "bg-gray-50 text-gray-700", dot: "bg-gray-400" },
      Returned: { color: "bg-red-50 text-red-700", dot: "bg-red-500" },
    };

    const statusStyle = statusMap[statusLabel] || statusMap["New"];

    const result = await query<ResultSetHeader>(
      "UPDATE orders SET status_label = ?, status_color = ?, status_dot = ? WHERE request_id = ?",
      [statusLabel, statusStyle.color, statusStyle.dot, requestId],
    );

    if (result.affectedRows === 0) {
      return fail(new Error(`Request ID ${requestId} ile sipariş güncellenemedi (bulunamadı)`));
    }

    return await getOrderById(requestId);
  } catch (err: unknown) {
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
};

export const updateOrderShipping = async (
  requestId: string,
  shipping: { provider: string; trackingNumber: string; labelUrl: string }
): Promise<Result<IOrder>> => {
  try {
    const result = await query<ResultSetHeader>(
      "UPDATE orders SET shipping_provider = ?, tracking_number = ?, shipping_label_url = ? WHERE request_id = ?",
      [shipping.provider, shipping.trackingNumber, shipping.labelUrl, requestId]
    );

    if (result.affectedRows === 0) {
      return fail(new Error(`Request ID ${requestId} ile sipariş güncellenemedi (bulunamadı)`));
    }

    return await getOrderById(requestId);
  } catch (err: unknown) {
    return fail(err instanceof Error ? err : new Error(String(err)));
  }
};
