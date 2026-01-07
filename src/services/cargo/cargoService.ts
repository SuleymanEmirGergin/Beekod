import { YurticiProvider } from './providers/YurticiProvider.js';
import { ArasProvider } from './providers/ArasProvider.js';
import { MNGProvider } from './providers/MNGProvider.js';
import { logger } from '../../logger.js';
import { ICargoProvider, ShipmentPayload } from './providers/ICargoProvider.js';

export type CargoProviderType = 'yurtici' | 'aras' | 'mng';

interface ShipmentRequest {
    provider: CargoProviderType;
    barcode: string;
    recipientName: string;
    recipientPhone: string;
    recipientAddress: string;
    recipientCity: string;
    recipientDistrict: string;
    items: { name: string; quantity: number }[];
}

interface ShipmentResponse {
    success: boolean;
    trackingNumber?: string;
    provider: CargoProviderType;
    error?: string;
}

export class CargoService {
    private providers: Record<CargoProviderType, ICargoProvider>;

    constructor() {
        this.providers = {
            yurtici: new YurticiProvider(),
            aras: new ArasProvider(),
            mng: new MNGProvider()
        };
    }

    async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
        logger.info('cargo.create_shipment', { provider: request.provider, barcode: request.barcode });

        const provider = this.providers[request.provider];
        if (!provider) {
            return { success: false, provider: request.provider, error: 'Unknown provider' };
        }

        try {
            const payload: ShipmentPayload = {
                orderId: request.barcode,
                customerName: request.recipientName,
                address: request.recipientAddress,
                city: request.recipientCity,
                phone: request.recipientPhone,
                items: request.items
            };

            const trackingNumber = await provider.createShipment(payload);
            return { success: true, trackingNumber, provider: request.provider };

        } catch (error: any) {
            logger.error('cargo.create_failed', { error });
            return { success: false, provider: request.provider, error: error.message };
        }
    }

    async trackShipment(providerName: CargoProviderType, trackingNumber: string) {
        const provider = this.providers[providerName];
        if (!provider) throw new Error("Unknown provider");
        return await provider.trackShipment(trackingNumber);
    }

    getAvailableProviders() {
        return [
            { id: 'yurtici', name: 'Yurtiçi Kargo', active: true },
            { id: 'aras', name: 'Aras Kargo', active: true },
            { id: 'mng', name: 'MNG Kargo', active: true }
        ];
    }
}

export const cargoService = new CargoService();
