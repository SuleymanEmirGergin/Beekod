import { ICargoProvider, ShipmentPayload, TrackingResult } from "./ICargoProvider.js";
import { logger } from "../../../logger.js";
import { env } from "../../../config/env.js"; // Assuming we will add keys here later

export class YurticiProvider implements ICargoProvider {
    private simulate: boolean;

    constructor() {
        // If no real credentials, use simulation
        // this.simulate = !env.YURTICI_USERNAME; 
        this.simulate = true; // Force simulation for now until we have env vars
    }

    async createShipment(payload: ShipmentPayload): Promise<string> {
        logger.info("Yurtici.createShipment", { payload, simulate: this.simulate });

        if (this.simulate) {
            // Simulate API delay
            await new Promise(r => setTimeout(r, 1000));
            // Generate fake tracking number starting with YK
            return `YK${Math.floor(Math.random() * 1000000000)}`;
        }

        // TODO: Real SOAP implementation would go here
        throw new Error("Real Yurtici implementation not configured");
    }

    async trackShipment(trackingNumber: string): Promise<TrackingResult> {
        if (this.simulate) {
            await new Promise(r => setTimeout(r, 800));
            return {
                trackingNumber,
                status: 'InTransit',
                statusDescription: 'Transfer Merkezinde İşleniyor',
                estimatedDelivery: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                history: [
                    { date: new Date().toISOString(), description: 'Kargo Kabul Edildi', location: 'İstanbul/Kadıköy' },
                    { date: new Date().toISOString(), description: 'Transfer Aracına Yüklendi', location: 'İstanbul/Kadıköy' }
                ]
            };
        }
        throw new Error("Real Yurtici implementation not configured");
    }

    async cancelShipment(trackingNumber: string): Promise<boolean> {
        if (this.simulate) return true;
        return false;
    }
}
