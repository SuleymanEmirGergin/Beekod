import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { query } from '../db.js';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { AppError } from '../errors/AppError.js';
import { auditService } from './product/auditService.js';

const SALT_ROUNDS = 10;
const JWT_SECRET = config.server.jwtSecret || process.env.JWT_SECRET || 'dev-secret-do-not-use-in-prod';
const JWT_EXPIRES_IN = '24h';

export interface User {
    id: number;
    email: string;
    name: string;
    role: 'Owner' | 'Admin' | 'Member' | 'Viewer';
    avatar?: string;
}

export const authService = {
    /**
     * Login user and return token
     */
    async login(email: string, password: string): Promise<{ token: string; user: User }> {
        const users = await query<any[]>(
            `SELECT * FROM team_members WHERE email = ? AND status = 'Active' LIMIT 1`,
            [email]
        );

        const user = users[0];

        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            throw new AppError('Invalid credentials', 401);
        }

        // Update last login
        await query(`UPDATE team_members SET last_login = NOW() WHERE id = ?`, [user.id]);

        // Audit log
        await auditService.log({
            userId: user.id,
            action: 'LOGIN',
            entityType: 'USER',
            entityId: user.id,
            details: { email: user.email }
        });

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const { password_hash, ...userWithoutPass } = user;

        return { token, user: userWithoutPass };
    },

    /**
     * Register new user (Admin only functionality usually)
     */
    async register(data: { name: string; email: string; password: string; role?: string }) {
        // Check if email exists
        const existing = await query<any[]>(`SELECT id FROM team_members WHERE email = ?`, [data.email]);
        if (existing.length > 0) {
            throw new AppError('Email already exists', 400);
        }

        const hash = await bcrypt.hash(data.password, SALT_ROUNDS);

        const result = await query<any>(
            `INSERT INTO team_members (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, 'Active')`,
            [data.name, data.email, hash, data.role || 'Member']
        );

        const newUserId = result.insertId;

        // Audit log
        await auditService.log({
            action: 'REGISTER_USER',
            entityType: 'USER',
            entityId: newUserId,
            details: { email: data.email, role: data.role || 'Member' }
        });

        return { id: newUserId, email: data.email };
    },

    /**
     * Verify token
     */
    verifyToken(token: string): any {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            throw new AppError('Invalid or expired token', 401);
        }
    }
};
