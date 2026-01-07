import { query } from "../db.js";

export interface IOrderItem {
  id?: number;
  order_id?: number;
  product_name: string;
  sku: string;
  price: string;
  price_numeric: number;
  quantity: number;
  image_url?: string;
}

export interface IOrder {
  id: number;
  requestId: string;
  source: {
    name: string;
    marketplaceId?: string;
    logo?: string;
    icon?: string;
    color?: string;
  };
  customer: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    initials: string;
    color: string;
  };
  date: string;
  total: string;
  total_amount_numeric: number;
  currency: string;
  status: {
    label: string;
    color: string;
    dot: string;
  };
  items: IOrderItem[];
  products: string[];
  shipping?: {
    provider: string;
    trackingNumber: string;
    labelUrl: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderDbRow {
  id: number;
  request_id: string;
  source_name: string;
  source_id?: string;
  source_logo?: string;
  source_icon?: string;
  source_color?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_initials?: string;
  customer_color?: string;
  order_date: string;
  total_amount: string;
  total_amount_numeric?: number;
  currency: string;
  status_label: string;
  status_color: string;
  status_dot: string;
  products_list?: string;
  shipping_provider?: string;
  tracking_number?: string;
  shipping_label_url?: string;
  created_at: Date;
  updated_at: Date;
}

// Convert DB row to Domain Model
export function mapOrderRow(row: IOrderDbRow, items: IOrderItem[] = []): IOrder {
  return {
    id: row.id,
    requestId: row.request_id,
    source: {
      name: row.source_name,
      marketplaceId: row.source_id,
      logo: row.source_logo,
      icon: row.source_icon,
      color: row.source_color,
    },
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      address: row.customer_address,
      initials:
        row.customer_initials ||
        row.customer_name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase(),
      color: row.customer_color || "bg-blue-500",
    },
    date: row.order_date,
    total: row.total_amount,
    total_amount_numeric: row.total_amount_numeric || 0,
    currency: row.currency,
    status: {
      label: row.status_label,
      color: row.status_color,
      dot: row.status_dot,
    },
    items: items,
    products: row.products_list ? row.products_list.split(", ") : [],
    shipping: row.shipping_provider ? {
      provider: row.shipping_provider,
      trackingNumber: row.tracking_number || '',
      labelUrl: row.shipping_label_url || '',
    } : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
