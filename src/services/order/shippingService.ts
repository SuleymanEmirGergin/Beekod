import { logger } from "../../logger.js";
import { cargoService, CargoProviderType } from '../cargo/cargoService.js';
import { getOrderById } from './orderService.js';

export interface ShippingLabelResult {
    provider: string;
    trackingNumber: string;
    labelUrl: string;
}

// Turkish city list for address parsing
const TURKISH_CITIES = [
    'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep',
    'Mersin', 'Diyarbakır', 'Kayseri', 'Eskişehir', 'Samsun', 'Denizli', 'Şanlıurfa',
    'Adapazarı', 'Sakarya', 'Malatya', 'Kahramanmaraş', 'Van', 'Batman', 'Elazığ',
    'Sivas', 'Manisa', 'Trabzon', 'Erzurum', 'Tekirdağ', 'Aydın', 'Kocaeli', 'Balıkesir',
    'Hatay', 'Ordu', 'Afyon', 'Afyonkarahisar', 'Çorum', 'Tokat', 'Muğla', 'Kütahya',
    'Mardin', 'Aksaray', 'Karaman', 'Düzce', 'Kastamonu', 'Isparta', 'Bolu', 'Zonguldak',
    'Giresun', 'Rize', 'Amasya', 'Edirne', 'Yozgat', 'Kırıkkale', 'Uşak', 'Nevşehir',
    'Ağrı', 'Bitlis', 'Muş', 'Siirt', 'Bingöl', 'Şırnak', 'Kars', 'Iğdır', 'Ardahan',
    'Kilis', 'Bartın', 'Karabük', 'Osmaniye', 'Adıyaman', 'Niğde', 'Çankırı', 'Sinop',
    'Bilecik', 'Kırşehir', 'Artvin', 'Hakkari', 'Bayburt', 'Gümüşhane', 'Tunceli', 'Yalova'
];

/**
 * Parse city name from Turkish address string
 */
function parseCityFromAddress(address: string | undefined): string {
    if (!address) return 'İstanbul'; // Default fallback
    
    const normalizedAddress = address.toLocaleUpperCase('tr-TR');
    
    for (const city of TURKISH_CITIES) {
        const normalizedCity = city.toLocaleUpperCase('tr-TR');
        if (normalizedAddress.includes(normalizedCity)) {
            return city;
        }
    }
    
    // Try to extract from common patterns like "34000 İstanbul" (postal codes)
    const postalMatch = address.match(/\d{5}\s+([A-Za-zİıĞğÜüŞşÖöÇç]+)/i);
    if (postalMatch?.[1]) {
        const foundCity = TURKISH_CITIES.find(
            c => c.toLocaleUpperCase('tr-TR') === postalMatch[1].toLocaleUpperCase('tr-TR')
        );
        if (foundCity) return foundCity;
    }
    
    return 'İstanbul'; // Default if not found
}

/**
 * Parse district from Turkish address (commonly after city or before it)
 */
function parseDistrictFromAddress(address: string | undefined): string {
    if (!address) return 'Merkez';
    
    // Common district patterns
    const districtPatterns = [
        /(\w+)\s*(mahallesi|mah\.?)/i,
        /(\w+)\s*(ilçesi|ilçe)/i,
    ];
    
    for (const pattern of districtPatterns) {
        const match = address.match(pattern);
        if (match?.[1]) {
            return match[1];
        }
    }
    
    return 'Merkez';
}

export const shippingService = {
    /**
     * Generate a shipping label using the real CargoService
     */
    async generateLabel(orderId: string, provider: 'Yurtici' | 'Aras' | 'MNG'): Promise<ShippingLabelResult> {
        logger.info('shippingService.generateLabel', { orderId, provider });

        // 1. Fetch Order Details
        const orderResult = await getOrderById(orderId);
        if (!orderResult.ok) {
            throw new Error(`Order ${orderId} not found or failed to fetch: ${orderResult.error?.message}`);
        }
        const order = orderResult.value;

        // 2. Map Provider String
        const providerId = provider.toLowerCase() as CargoProviderType;

        // 3. Parse city and district from address
        const recipientCity = parseCityFromAddress(order.customer.address);
        const recipientDistrict = parseDistrictFromAddress(order.customer.address);

        // 4. Create Shipment
        const result = await cargoService.createShipment({
            provider: providerId,
            barcode: order.requestId, // Use Order Request ID as Barcode/Ref
            recipientName: order.customer.name,
            recipientPhone: order.customer.phone || '',
            recipientAddress: order.customer.address || '',
            recipientCity,
            recipientDistrict,
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
