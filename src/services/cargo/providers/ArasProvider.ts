import { ICargoProvider, ShipmentPayload, TrackingResult } from "./ICargoProvider.js";
import { logger } from "../../../logger.js";

export class ArasProvider implements ICargoProvider {
    private simulate = true;

    async createShipment(payload: ShipmentPayload): Promise<string> {
        logger.info("Aras.createShipment", { payload });
        if (this.simulate) {
            await new Promise(r => setTimeout(r, 1200));
            // Aras usually 13 digits
            return `3${Math.floor(Math.random() * 1000000000000)}`;
        }
        throw new Error("Real Aras implementation not configured");
    }

    async trackShipment(trackingNumber: string): Promise<TrackingResult> {
        return {
            trackingNumber,
            status: 'Created',
            statusDescription: 'Sipariş Alındı',
            history: [
                { date: new Date().toISOString(), description: 'Elektronik Bilgi Alındı', location: 'Sistem' }
            ]
        };
    }

    async cancelShipment(trackingNumber: string): Promise<boolean> {
        return true;
    }
}
