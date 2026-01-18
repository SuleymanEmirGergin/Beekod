import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/server';
import { authService } from '../src/services/authService';
import { query } from '../src/db';

// Mock DB
vi.mock('../src/db.js', () => ({
    query: vi.fn(),
}));

// Mock Redis
vi.mock('../src/redis.js', () => ({
    redis: {
        get: vi.fn(),
        set: vi.fn(),
        del: vi.fn(),
        quit: vi.fn(),
        on: vi.fn(),
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

describe('Authentication API', () => {
    const timestamp = Date.now();
    const adminUser = {
        name: 'Test Admin',
        email: `admin_${timestamp}@example.com`,
        password: 'password123',
        role: 'Admin'
    };

    let adminToken = '';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterAll(async () => {
    });

    it('should create an initial admin user directly via service', async () => {
        vi.mocked(query).mockResolvedValueOnce([]);
        vi.mocked(query).mockResolvedValueOnce({ insertId: 1 });

        const result = await authService.register(adminUser);

        expect(result).toHaveProperty('id');
        expect(result.email).toBe(adminUser.email);
    });

    it('should login and return a JWT token', async () => {
        const mockUser = { ...adminUser, id: 1 };

        vi.spyOn(authService, 'login').mockResolvedValue({
            user: mockUser,
            token: 'mock-jwt-token'
        });

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: adminUser.email,
                password: adminUser.password
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token', 'mock-jwt-token');

        adminToken = response.body.token;
    });

    it('should return current user profile with valid token', async () => {
         const jwt = await import('jsonwebtoken');
         // Mock jwt.verify to return the payload containing email
         vi.spyOn(jwt.default, 'verify').mockReturnValue({
             id: 1,
             role: 'Admin',
             email: adminUser.email
         } as any);

         // Mock query if middleware/controller uses it
         vi.mocked(query).mockResolvedValueOnce([{ ...adminUser, id: 1 }]);

        const response = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.user).toBeDefined();
        expect(response.body.user).toHaveProperty('email', adminUser.email);
    });

    it('should fail to access profile without token', async () => {
        const response = await request(app).get('/api/auth/me');
        expect(response.status).toBe(401);
    });
});
