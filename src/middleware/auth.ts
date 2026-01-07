import type { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { AppError } from '../errors/AppError.js';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        role: string;
    };
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return next(new AppError('No token provided', 401));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = authService.verifyToken(token);
        (req as AuthRequest).user = decoded;
        next();
    } catch (error) {
        next(new AppError('Invalid token', 401));
    }
};

export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as AuthRequest).user;

        if (!user) {
            return next(new AppError('User not authenticated', 401));
        }

        if (!roles.includes(user.role)) {
            return next(new AppError('Insufficient permissions', 403));
        }

        next();
    };
};
