import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../validation.js';

export const authRouter = Router();

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['Admin', 'Member', 'Viewer']).optional(),
});

// LOGIN
authRouter.post('/login', validateBody(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// REGISTER (Admin only)
authRouter.post(
    '/register',
    authenticate,
    authorize(['Owner', 'Admin']),
    validateBody(registerSchema),
    async (req, res, next) => {
        try {
            const result = await authService.register(req.body);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }
);

// PUBLIC REGISTER (Self sign-up)
authRouter.post(
    '/register-public',
    validateBody(registerSchema),
    async (req, res, next) => {
        try {
            // Force role to Member for self sign-up
            const { role, ...rest } = req.body;
            const result = await authService.register({ ...rest, role: 'Member' });
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }
);

// GET CURRENT USER
authRouter.get('/me', authenticate, (req: any, res) => {
    res.json({ user: req.user });
});
