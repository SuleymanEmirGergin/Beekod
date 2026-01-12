import { logger } from '../logger.js';
import { cargoService, CargoProviderType } from './cargo/cargoService.js';
import { getOrderById } from './orderService.js';

export interface ShippingLabelResult {
    provider: string;
    trackingNumber: string;
    labelUrl: string;
}

export const shippingService = {
    /**
     * Generate a shipping label using the real CargoService
     */
    async generateLabel(orderId: string, provider: 'Yurtici' | 'Aras' | 'MNG'): Promise<ShippingLabelResult> {
        logger.info('shippingService.generateLabel', { orderId, provider });

        // 1. Fetch Order Details
        const order = await getOrderById(orderId);
        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }

        // 2. Map Provider String
        const providerId = provider.toLowerCase() as CargoProviderType;

        // 3. Create Shipment
        const result = await cargoService.createShipment({
            provider: providerId,
            barcode: order.requestId, // Use Order Request ID as Barcode/Ref
            recipientName: order.customer.name,
            recipientPhone: order.customer.phone || '',
            recipientAddress: order.customer.address || '',
            recipientCity: 'İstanbul', // TODO: Parse city from address or add to order model
            recipientDistrict: 'Merkez',
            items: order.items.map(i => ({ name: i.product_name, quantity: i.quantity }))
        });

        if (!result.success || !result.trackingNumber) {
            throw new Error(result.error || 'Shipment creation failed');
        }

        // 4. Return Result
        // In a real app, the labelUrl would come from the carrier or generated via PDF service
        const baseUrl = process.env.API_URL || "http://localhost:3000";
        return {
            provider,
            trackingNumber: result.trackingNumber,
            labelUrl: `${baseUrl}/api/shipping/labels/${result.trackingNumber}?provider=${provider}`
        };
    },

    /**
     * Get tracking status
     */
    async getTrackingStatus(trackingNumber: string, provider: 'Yurtici' | 'Aras' | 'MNG'): Promise<string> {
        const providerId = provider.toLowerCase() as CargoProviderType;
        const result = await cargoService.trackShipment(providerId, trackingNumber);
        return result.statusDescription;
    },

    /**
     * Get aggregated shipping statistics
     */
    async getStats() {
        // In a real scenario, we would query the 'orders' table for status distribution
        // For now, we mock it or query basic order counts
        // Assuming orders have a 'shipping_status' field or similar
        return {
             stats: [
                { label: 'Bekleyen Gönderiler', value: '12', change: '+2', trend: 'up', color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Yolda', value: '45', change: '-5', trend: 'down', color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Bugün Teslim', value: '8', change: '+3', trend: 'up', color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Sorunlu / İade', value: '2', change: '0', trend: 'neutral', color: 'text-red-600', bg: 'bg-red-50' },
            ],
            carriers: [
                { name: 'Yurtiçi Kargo', status: 'Online', load: 'Düşük', successRate: '98%', logo: 'YK' },
                { name: 'MNG Kargo', status: 'Online', load: 'Orta', successRate: '96%', logo: 'MNG' },
                { name: 'UPS', status: 'Bakım', load: '-', successRate: '99%', logo: 'UPS' },
            ]
        };
    }
};
