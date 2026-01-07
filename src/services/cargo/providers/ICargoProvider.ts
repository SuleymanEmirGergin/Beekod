export interface ShipmentPayload {
    orderId: string;
    customerName: string;
    address: string;
    city: string;
    phone: string;
    items: { name: string; quantity: number }[];
}

export interface TrackingResult {
    trackingNumber: string;
    status: 'Created' | 'InTransit' | 'Delivered' | 'Returned' | 'Problem';
    statusDescription: string;
    estimatedDelivery?: string;
    history: {
        date: string;
        description: string;
        location: string;
    }[];
}

export interface ICargoProvider {
    /**
     * Creates a shipment 
     * @returns tracking number
     */
    createShipment(payload: ShipmentPayload): Promise<string>;

    /**
     * Tracks a shipment
     */
    trackShipment(trackingNumber: string): Promise<TrackingResult>;

    /**
     * Cancels a shipment
     */
    cancelShipment(trackingNumber: string): Promise<boolean>;
}
