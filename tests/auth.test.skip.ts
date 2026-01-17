import 'dotenv/config';
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/server';
import { authService } from '../src/services/authService';
import { query } from '../src/db';

describe('Authentication API', () => {
    const timestamp = Date.now();
    const adminUser = {
        name: 'Test Admin',
        email: `admin_${timestamp}@example.com`,
        password: 'password123',
        role: 'Admin'
    };

    const regularUser = {
        name: 'Test Member',
        email: `member_${timestamp}@example.com`,
        password: 'password123',
        role: 'Member'
    };

    let adminToken = '';

    // Clean up after tests
    afterAll(async () => {
        await query("DELETE FROM team_members WHERE email IN (?, ?)", [adminUser.email, regularUser.email]);
    });

    it('should create an initial admin user directly via service', async () => {
        // Direct service call to bypass API auth for the first user
        const result = await authService.register(adminUser);
        expect(result).toHaveProperty('id');
        expect(result.email).toBe(adminUser.email);
    });

    it('should login and return a JWT token', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: adminUser.email,
                password: adminUser.password
            });

        if (response.status !== 200) {
            console.error('Login failed response:', response.status, JSON.stringify(response.body, null, 2));
        }

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body.user).toHaveProperty('email', adminUser.email);

        adminToken = response.body.token;
    });

    it('should return current user profile with valid token', async () => {
        const response = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${adminToken}`);

        if (response.status !== 200) {
            console.error('Me failed response:', response.status, JSON.stringify(response.body, null, 2));
        }

        expect(response.status).toBe(200);
        expect(response.body.user).toHaveProperty('email', adminUser.email);
        expect(response.body.user).toHaveProperty('role', 'Admin');
    });

    it('should fail to access profile without token', async () => {
        const response = await request(app).get('/api/auth/me');
        expect(response.status).toBe(401);
    });

    it('should register a new user using admin token', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(regularUser);

        if (response.status !== 201) {
            console.error('Register failed response:', response.status, JSON.stringify(response.body, null, 2));
        }

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('email', regularUser.email);
    });

    it('should fail login with wrong password', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: adminUser.email,
                password: 'wrongpassword'
            });

        expect(response.status).toBe(401);
    });
});
