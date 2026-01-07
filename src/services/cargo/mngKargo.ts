import { logger } from '../../logger.js';

/**
 * MNG Kargo API Client
 * Documentation: https://api.mngkargo.com.tr/docs
 */

interface MngShipmentRequest {
    barcode: string;
    recipientName: string;
    recipientPhone: string;
    recipientAddress: string;
    recipientCity: string;
    recipientDistrict: string;
    weight: number;
    desi: number;
    paymentType: 'sender' | 'recipient';
}

interface MngShipmentResponse {
    success: boolean;
    trackingNumber?: string;
    error?: string;
}

export class MngKargoClient {
    private apiKey: string;
    private apiUrl: string;

    constructor() {
        this.apiKey = process.env.MNG_API_KEY || '';
        this.apiUrl = process.env.MNG_API_URL || 'https://api.mngkargo.com.tr/v1';
    }

    async createShipment(request: MngShipmentRequest): Promise<MngShipmentResponse> {
        if (!this.apiKey) {
            logger.warn('mng.api_key_missing');
            return { success: false, error: 'API key not configured' };
        }

        try {
            logger.info('mng.create_shipment', { barcode: request.barcode });

            // Mock response
            return {
                success: true,
                trackingNumber: `MNG${Date.now()}`
            };
        } catch (error) {
            logger.error('mng.create_shipment_failed', { error });
            return { success: false, error: 'Shipment creation failed' };
        }
    }

    async trackShipment(trackingNumber: string) {
        if (!this.apiKey) {
            logger.warn('mng.api_key_missing');
            return { success: false };
        }

        try {
            logger.info('mng.track_shipment', { trackingNumber });

            return {
                success: true,
                status: 'In Transit',
                location: 'Izmir Hub',
                lastUpdate: new Date().toISOString()
            };
        } catch (error) {
            logger.error('mng.track_failed', { error });
            return { success: false };
        }
    }
}

export const mngKargo = new MngKargoClient();
