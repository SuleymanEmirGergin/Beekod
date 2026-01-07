/**
 * React Query Hooks
 * Example hooks with Zod validation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
    ProductListSchema,
    OrderListSchema,
    DashboardDataSchema,
    NotificationListSchema,
    validate,
    validateSafe,
    type Product,
    type Order,
    type DashboardData,
    type Notification,
} from '../schemas';

// ============================================
// Query Keys (for cache management)
// ============================================

export const queryKeys = {
    products: ['products'] as const,
    product: (id: string) => ['products', id] as const,
    orders: ['orders'] as const,
    order: (id: string) => ['orders', id] as const,
    dashboard: ['dashboard'] as const,
    notifications: ['notifications'] as const,
};

// ============================================
// Product Hooks
// ============================================

/**
 * Fetch all products with Zod validation
 */
export function useProducts() {
    return useQuery({
        queryKey: queryKeys.products,
        queryFn: async (): Promise<Product[]> => {
            const response = await api.get('/products');
            // Validate response data
            return validateSafe(ProductListSchema, response.data, []);
        },
    });
}

/**
 * Fetch single product
 */
export function useProduct(id: string) {
    return useQuery({
        queryKey: queryKeys.product(id),
        queryFn: async () => {
            const response = await api.get(`/products/${id}`);
            return response.data;
        },
        enabled: !!id, // Only run if ID exists
    });
}

// ============================================
// Order Hooks
// ============================================

/**
 * Fetch all orders with Zod validation
 */
export function useOrders() {
    return useQuery({
        queryKey: queryKeys.orders,
        queryFn: async (): Promise<Order[]> => {
            const response = await api.get('/orders');
            return validateSafe(OrderListSchema, response.data, []);
        },
    });
}

/**
 * Create new order mutation
 */
export function useCreateOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (orderData: Partial<Order>) => {
            const response = await api.post('/orders', orderData);
            return response.data;
        },
        onSuccess: () => {
            // Invalidate and refetch orders
            queryClient.invalidateQueries({ queryKey: queryKeys.orders });
        },
    });
}

// ============================================
// Dashboard Hooks
// ============================================

/**
 * Fetch dashboard data with Zod validation
 */
export function useDashboard() {
    return useQuery({
        queryKey: queryKeys.dashboard,
        queryFn: async (): Promise<DashboardData> => {
            const response = await api.get('/dashboard');
            return validate(DashboardDataSchema, response.data);
        },
        // Refetch every 30 seconds for live data
        refetchInterval: 30000,
    });
}

// ============================================
// Notification Hooks
// ============================================

/**
 * Fetch notifications with Zod validation
 */
export function useNotifications(limit: number = 20) {
    return useQuery({
        queryKey: [...queryKeys.notifications, limit],
        queryFn: async (): Promise<Notification[]> => {
            const response = await api.get(`/notifications?limit=${limit}`);
            return validateSafe(NotificationListSchema, response.data.notifications, []);
        },
    });
}

/**
 * Mark notification as read mutation
 */
export function useMarkNotificationRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/notifications/${id}/mark-read`);
            return response.data;
        },
        onSuccess: () => {
            // Refetch notifications
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
        },
    });
}

// ============================================
// Generic Query Hook with Validation
// ============================================

/**
 * Generic validated query hook
 * Usage: useValidatedQuery('/api/endpoint', MySchema)
 */
export function useValidatedQuery<T>(
    endpoint: string,
    schema: import('zod').ZodSchema<T>,
    options?: any
) {
    return useQuery({
        queryKey: [endpoint],
        queryFn: async (): Promise<T> => {
            const response = await api.get(endpoint);
            return validate(schema, response.data);
        },
        ...options,
    });
}
