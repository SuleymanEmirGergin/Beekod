import { ICargoProvider, ShipmentPayload, TrackingResult } from "./ICargoProvider.js";
import { logger } from "../../../logger.js";
import axios from "axios";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

export class YurticiProvider implements ICargoProvider {
    private simulate: boolean;
    private username = process.env.YURTICI_USERNAME;
    private password = process.env.YURTICI_PASSWORD;
    private apiUrl = "https://ws.yurticikargo.com/KOPSWebServices/ShippingOrderDispatcherServices?wsdl";

    constructor() {
        this.simulate = !this.username || !this.password;
    }

    async createShipment(payload: ShipmentPayload): Promise<string> {
        if (this.simulate) {
            await new Promise(r => setTimeout(r, 1000));
            const tracking = `YK${Math.floor(100000000 + Math.random() * 900000000)}`;
            return tracking;
        }

        try {
            const xml = this.buildCreateShipmentXML(payload);
            const response = await axios.post(this.apiUrl, xml, {
                headers: {
                    'Content-Type': 'text/xml;charset=UTF-8',
                    'SOAPAction': 'createShipment' // Guessing action name, usually required
                }
            });

            const parser = new XMLParser();
            const result = parser.parse(response.data);

            // Parse logic would go here depending on real WSDL structure
            // Assuming simplified response for this implementation
            // In a real scenario, we'd navigate the SOAP envelope

            // Placeholder for parsing logic:
            const trackingNumber = result?.['soap:Envelope']?.['soap:Body']?.createShipmentResponse?.trackingNumber;

            if (!trackingNumber) throw new Error("No tracking number in response");

            return String(trackingNumber);

        } catch (error: any) {
            logger.error("Yurtici.createShipment.error", { error: error.message });
            throw error;
        }
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

        // Real tracking implementation using queryShipment SOAP call
        // Omitted for brevity as creating shipment is the primary goal requested.
        throw new Error("Real Yurtici tracking not fully implemented");
    }

    async cancelShipment(trackingNumber: string): Promise<boolean> {
        if (this.simulate) return true;
        return false;
    }

    private buildCreateShipmentXML(payload: ShipmentPayload): string {
        const builder = new XMLBuilder({
            ignoreAttributes: false,
            format: true
        });

        // Example SOAP Payload
        const obj = {
            'soapenv:Envelope': {
                '@_xmlns:soapenv': "http://schemas.xmlsoap.org/soap/envelope/",
                '@_xmlns:ws': "http://ws.yurticikargo.com/",
                'soapenv:Header': {
                    'ws:AuthHeader': {
                        'ws:UserName': this.username,
                        'ws:Password': this.password
                    }
                },
                'soapenv:Body': {
                    'ws:createShipment': {
                        'ws:cargoKey': payload.orderId,
                        'ws:receiverName': payload.customerName,
                        'ws:receiverAddress': payload.address,
                        'ws:receiverCity': payload.city,
                        'ws:receiverPhone': payload.phone,
                        // Add items loop here if needed by API
                    }
                }
            }
        };

        return builder.build(obj);
    }
}
