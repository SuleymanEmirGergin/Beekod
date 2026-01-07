import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/server';

describe('API Health Check', () => {
    it('should return 200 on /health', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
    });
});

describe('Products API', () => {
    const ADMIN_KEY = process.env.ADMIN_KEY || 'test-admin-key';

    it('should list products with auth', async () => {
        const response = await request(app)
            .get('/api/products')
            .set('Authorization', `Bearer ${ADMIN_KEY}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should reject without auth', async () => {
        const response = await request(app).get('/api/products');
        expect(response.status).toBe(401);
    });
});

describe('Analytics API', () => {
    const ADMIN_KEY = 'Threem123';

    it('should return dashboard stats', async () => {
        const response = await request(app)
            .get('/api/analytics/dashboard')
            .set('Authorization', `Bearer ${ADMIN_KEY}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('totalRevenue');
    });
});

describe('Chat API', () => {
    const ADMIN_KEY = 'Threem123';

    it('should handle chat message', async () => {
        const response = await request(app)
            .post('/api/chat')
            .set('Authorization', `Bearer ${ADMIN_KEY}`)
            .send({
                message: 'Merhaba',
                locale: 'tr'
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('reply');
    });
});

describe('UTF-8 Charset', () => {
    const ADMIN_KEY = 'Threem123';

    it('should return UTF-8 charset in response', async () => {
        const response = await request(app)
            .get('/api/analytics/dashboard')
            .set('Authorization', `Bearer ${ADMIN_KEY}`);

        expect(response.headers['content-type']).toContain('charset=utf-8');
    });

    it('should handle Turkish characters correctly', async () => {
        const response = await request(app)
            .post('/api/chat')
            .set('Authorization', `Bearer ${ADMIN_KEY}`)
            .send({
                message: 'Türkçe karakter testi: ışığı çöğü',
                locale: 'tr'
            });

        expect(response.status).toBe(200);
        // Response should contain Turkish characters without corruption
        const body = JSON.stringify(response.body);
        expect(body).not.toContain('�'); // No replacement characters
    });
});
