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
        return {
            provider,
            trackingNumber: result.trackingNumber,
            labelUrl: `https://api.beekod.com/v1/shipping/labels/${result.trackingNumber}.pdf`
        };
    },

    /**
     * Get tracking status
     */
    async getTrackingStatus(trackingNumber: string, provider: 'Yurtici' | 'Aras' | 'MNG'): Promise<string> {
        const providerId = provider.toLowerCase() as CargoProviderType;
        const result = await cargoService.trackShipment(providerId, trackingNumber);
        return result.statusDescription;
    }
};
