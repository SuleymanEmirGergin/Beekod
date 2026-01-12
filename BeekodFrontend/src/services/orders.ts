import api from './api';

// Interfaces based on UI requirements
export interface OrderSource {
  name: string;
  logo?: string;
  color?: string;
  icon?: string;
}

export interface OrderCustomer {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  initials: string;
  color: string;
}

export interface OrderStatus {
  label: string;
  color: string;
  dot: string;
}

export interface OrderItem {
  name: string;
  sku: string;
  image: string;
  price: string;
  quantity: number;
}

export interface Order {
  id: string; // From backend requestId
  source: OrderSource;
  customer: OrderCustomer;
  date: string;
  total: string;
  status: OrderStatus;
  products: string[];
  items: OrderItem[];
  shipping?: {
    provider: string;
    trackingNumber: string;
    labelUrl?: string;
  };
}

// API Functions
export const getOrders = async (): Promise<Order[]> => {
  try {
    const { data } = await api.get('/orders');

    if (!Array.isArray(data)) {
      console.warn('API getOrders returned non-array data:', data);
      return [];
    }

    // Map backend _id to id if needed, but we use requestId as id
    return data.map((order: any) => ({
      id: order.requestId,
      source: order.source,
      customer: order.customer,
      date: order.date,
      total: order.total,
      status: order.status,
      products: order.products,
      items: order.items,
      shipping: order.shipping_provider ? {
        provider: order.shipping_provider,
        trackingNumber: order.tracking_number,
        labelUrl: order.shipping_label_url
      } : undefined
    }));
  } catch (error) {
    console.error('API getOrders failed', error);
    return [];
  }
};

export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    const { data } = await api.get(`/orders/${id}`);
    return {
      id: data.requestId,
      source: data.source,
      customer: data.customer,
      date: data.date,
      total: data.total,
      status: data.status,
      products: data.products,
      items: data.items,
    };
  } catch (error) {
    console.error('API getOrderById failed', error);
    return null;
  }
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<Order> => {
  try {
    const { data } = await api.put(`/orders/${orderId}/status`, { status });
    return {
      id: data.requestId,
      source: data.source,
      customer: data.customer,
      date: data.date,
      total: data.total,
      status: data.status,
      products: data.products,
      items: data.items,
    };
  } catch (error) {
    console.error('API updateOrderStatus failed', error);
    throw error;
  }
};

export const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
  try {
    const { data } = await api.post('/orders', orderData);
    return {
      id: data.requestId,
      source: data.source,
      customer: data.customer,
      date: data.date,
      total: data.total,
      status: data.status,
      products: data.products,
      items: data.items,
    };
  } catch (error) {
    console.error('API createOrder failed', error);
    throw error;
  }
};

export const syncOrders = async (): Promise<any> => {
  try {
    const { data } = await api.post('/orders/sync');
    return data;
  } catch (error) {
    console.error('API syncOrders failed', error);
    throw error;
  }
};

export const generateShippingLabel = async (orderId: string, provider: string): Promise<any> => {
  try {
    const { data } = await api.post(`/orders/${orderId}/shipping-label`, { provider });
    return data;
  } catch (error) {
    console.error('API generateShippingLabel failed', error);
    throw error;
  }
};

export const getShippingStats = async (): Promise<any> => {
  try {
    const { data } = await api.get('/orders/shipping/stats');
    return data;
  } catch (error) {
    console.error('API getShippingStats failed', error);
    throw error;
  }
};
