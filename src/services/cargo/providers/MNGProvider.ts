import { ICargoProvider, ShipmentPayload, TrackingResult } from "./ICargoProvider.js";
import { logger } from "../../../logger.js";

export class MNGProvider implements ICargoProvider {
    private simulate = true;

    async createShipment(payload: ShipmentPayload): Promise<string> {
        logger.info("MNG.createShipment", { payload });
        if (this.simulate) {
            await new Promise(r => setTimeout(r, 1500));
            // MNG format check 
            const tracking = `MC${Math.floor(100000 + Math.random() * 900000)}`;
            return tracking;
        }
        throw new Error("Real MNG implementation not configured");
    }

    async trackShipment(trackingNumber: string): Promise<TrackingResult> {
        return {
            trackingNumber,
            status: 'Delivered',
            statusDescription: 'Teslim Edildi',
            history: [
                { date: new Date().toISOString(), description: 'Teslim Edildi', location: 'Ankara/Çankaya' }
            ]
        };
    }

    async cancelShipment(trackingNumber: string): Promise<boolean> {
        return true;
    }
}
