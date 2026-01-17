import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YurticiProvider } from '../../../src/services/cargo/providers/YurticiProvider.js';
import axios from 'axios';

vi.mock('axios');

describe('YurticiProvider', () => {
    let provider: YurticiProvider;

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.YURTICI_USERNAME = '';
        process.env.YURTICI_PASSWORD = '';
    });

    it('should simulate when no credentials', async () => {
        provider = new YurticiProvider();
        const result = await provider.createShipment({
            orderId: '123',
            customerName: 'John',
            address: 'Main St',
            city: 'Istanbul',
            phone: '555',
            items: []
        });
        expect(result).toContain('YK');
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('should send SOAP request when credentials exist', async () => {
        process.env.YURTICI_USERNAME = 'user';
        process.env.YURTICI_PASSWORD = 'pass';
        provider = new YurticiProvider();

        // Mock XML response
        const mockResponse = `
            <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                <soap:Body>
                    <createShipmentResponse>
                        <trackingNumber>YKREAL123</trackingNumber>
                    </createShipmentResponse>
                </soap:Body>
            </soap:Envelope>
        `;

        vi.mocked(axios.post).mockResolvedValue({ data: mockResponse });

        const result = await provider.createShipment({
            orderId: '123',
            customerName: 'John',
            address: 'Main St',
            city: 'Istanbul',
            phone: '555',
            items: []
        });

        expect(result).toBe('YKREAL123');
        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('ws.yurticikargo.com'),
            expect.stringContaining('<ws:UserName>user</ws:UserName>'), // Verify XML content
            expect.any(Object)
        );
    });
});
