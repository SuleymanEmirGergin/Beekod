import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock DB
vi.mock('../src/db.js', () => ({
    query: vi.fn(async () => []),
}));

// Mock Redis
vi.mock('../src/redis.js', () => ({
    redis: {
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
        quit: vi.fn(),
        on: vi.fn(),
        connect: vi.fn(),
        isOpen: true,
    }
}));

// Mock Queue
vi.mock('../src/services/jobQueue.js', () => ({
    initQueue: vi.fn(),
    addJob: vi.fn(),
    videoQueue: { add: vi.fn() },
    aiModelQueue: { add: vi.fn() },
    startScheduler: vi.fn(),
}));

// Mock video/ai queues (legacy path)
vi.mock('../src/queue/index.js', () => ({
    videoQueue: { add: vi.fn(), close: vi.fn() },
    aiModelQueue: { add: vi.fn(), close: vi.fn() },
    redisConnection: {},
    defaultJobOptions: {},
}));

// Mock main queue (new path)
vi.mock('../src/services/queue/index.js', () => ({
    queue: {
        client: { ping: vi.fn().mockResolvedValue('PONG') },
        close: vi.fn(),
        add: vi.fn(),
    },
    worker: { close: vi.fn() },
    addJob: vi.fn(),
}));

// Mock alert service
vi.mock('../src/services/alertService.js', () => ({
    startStockAlertJob: vi.fn(),
}));

// Mock Analytics Service
vi.mock('../src/services/analyticsService.js', () => ({
    getDashboardStats: vi.fn().mockResolvedValue({
        totalProducts: 100,
        totalRevenue: 50000,
        lowStockCount: 5,
        topPerformers: [],
        categoryBreakdown: [],
        recentActivity: []
    }),
    getProductPerformance: vi.fn(),
    getRevenueTimeline: vi.fn(),
    getProfitMargins: vi.fn(),
    getInventoryHealth: vi.fn(),
    getMarketplacePerformance: vi.fn(),
    getInventoryForecast: vi.fn(),
    getTopSellers: vi.fn(),
    searchProducts: vi.fn(),
    getProductSalesDetail: vi.fn()
}));

// Mock config
vi.mock('../src/config.js', () => ({
    config: {
        admin: {
            apiKey: 'Threem123',
        },
        images: {
            storagePath: 'storage/images',
            publicBase: '/static/images',
            defaultProfile: 'trendyol_square',
            maxUploadBytes: 8 * 1024 * 1024,
            requireAdmin: false,
            profilesPath: 'data/image-profiles.json',
            profilesDefaultPath: 'data/image-profiles.default.json',
            profileSetsPath: 'data/marketplace-image-sets.json',
            profileSetsDefaultPath: 'data/marketplace-image-sets.default.json',
            barcodeScanEnabled: false,
        },
        security: {
            cors: {
                origins: ['http://localhost:5173'],
                methods: ['GET', 'POST'],
                headers: ['Content-Type'],
                allowCredentials: false,
            },
            hsts: {
                enabled: false,
                maxAge: 0,
            }
        },
        server: {
            jsonBodyLimit: '10mb',
            urlEncodedBodyLimit: '10mb',
            jwtSecret: 'test-secret',
        },
        marketplace: {
            mode: 'mock',
            readSource: 'db',
            liveRetryEnabled: false,
        },
        search: {
            defaultNum: 5,
            imageDefaultNum: 3,
            gl: '',
            hl: '',
            siteDefault: '',
        },
        db: {
            host: 'localhost',
            port: 3306,
            user: 'root',
            database: 'beekod',
            pool: {
                connectionLimit: 10,
            }
        },
        stores: {
            marketplace: 'mock',
            sales: 'mock',
        },
        data: {
            marketplacePath: 'data/mock_marketplace.csv',
            productPath: 'data/mock_products.csv',
            salesPath: 'data/mock_sales.csv',
            contentConfigPath: 'data/content-config.json',
            contentConfigDefaultPath: 'data/content-config.default.json',
            marketplaceMappingPath: 'data/marketplace-mappings.json',
            marketplaceMappingDefaultPath: 'data/marketplace-mappings.default.json',
            templates: {
                mappings: 'data/templates/content_mappings.json',
                seo: 'data/templates/seo_templates.json',
                social: 'data/templates/social_templates.json',
            },
        },
        google: {
            cseApiKey: '',
            cseCx: '',
        },
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 100
        }
    },
}));

// Mock logger
vi.mock('../src/logger.js', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
    chatLogger: {
        info: vi.fn(),
    },
}));

import { app } from '../src/server';
import { query } from '../src/db.js';

describe('API Health Check', () => {
    it('should return 200 on /health', async () => {
        const response = await request(app).get('/health');
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
    });
});

describe('Products API', () => {
    const ADMIN_KEY = 'Threem123';

    beforeEach(() => {
        vi.mocked(query).mockReset();
        vi.mocked(query).mockResolvedValue([{ total: 0 }]);
        vi.mocked(query).mockResolvedValue([]);
    });

    it('should list products with auth', async () => {
        vi.mocked(query).mockResolvedValueOnce([{ total: 0 }]);
        vi.mocked(query).mockResolvedValueOnce([]);

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
        // Since we mocked analyticsService, we don't need to mock query here.
        // The controller calls getDashboardStats which returns our mock data.

        const response = await request(app)
            .get('/api/analytics/dashboard')
            .set('Authorization', `Bearer ${ADMIN_KEY}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('totalProducts', 100);
    }, 60000);
});
