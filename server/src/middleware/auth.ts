import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
        role: string;
    };
}

/**
 * Verify JWT token middleware
 */
export const authenticateToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    try {
        const decoded = jwt.verify(token, config.jwt.secret) as { id: string; username: string; role: string };
        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role,
        };
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
    }
};

/**
 * Role-based access control middleware
 */
export const requireRole = (...allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }

        next();
    };
};

/**
 * Generate JWT token
 */
export const generateToken = (user: { id: string; username: string; role: string }): string => {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role,
        },
        config.jwt.secret,
        {
            expiresIn: config.jwt.expiresIn,
        } as jwt.SignOptions
    );
};
