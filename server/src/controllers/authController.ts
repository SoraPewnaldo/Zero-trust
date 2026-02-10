import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { generateToken, AuthRequest } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Login user
 */
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400).json({ error: 'Username and password required' });
            return;
        }

        // Find user
        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) {
            // Log failed login attempt (User not found)
            await AuditLog.create({
                eventId: uuidv4(),
                eventType: 'login_failed',
                eventCategory: 'authentication',
                severity: 'warning',
                actor: {
                    username: username.toLowerCase(),
                    ipAddress: req.ip,
                },
                target: {
                    type: 'user',
                    name: username.toLowerCase(),
                },
                action: 'login',
                result: 'failure',
                context: {
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                },
                details: {
                    reason: 'User not found',
                    attemptedPassword: password // WARNING: storing passwords in logs is insecure
                },
                timestamp: new Date(),
            });

            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            // Log failed login attempt (Wrong password)
            await AuditLog.create({
                eventId: uuidv4(),
                eventType: 'login_failed',
                eventCategory: 'authentication',
                severity: 'warning',
                actor: {
                    username: username.toLowerCase(),
                    ipAddress: req.ip,
                    userId: user._id
                },
                target: {
                    type: 'user',
                    id: user._id,
                    name: user.username
                },
                action: 'login',
                result: 'failure',
                context: {
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                },
                details: {
                    reason: 'Invalid password',
                    attemptedPassword: password // WARNING: storing passwords in logs is insecure
                },
                timestamp: new Date(),
            });

            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Check user status
        if (user.status !== 'active') {
            res.status(403).json({ error: 'Account is not active' });
            return;
        }

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        // Generate JWT token
        const token = generateToken({
            id: user._id.toString(),
            username: user.username,
            role: user.role,
        });

        // Log successful login
        await AuditLog.create({
            eventId: uuidv4(),
            eventType: 'login_success',
            eventCategory: 'authentication',
            severity: 'info',
            actor: {
                userId: user._id,
                username: user.username,
                role: user.role,
                ipAddress: req.ip,
            },
            target: {
                type: 'user',
                id: user._id,
            },
            action: 'login',
            result: 'success',
            context: {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            },
            timestamp: new Date(),
        });

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

/**
 * Logout user
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user) {
            // Log logout
            await AuditLog.create({
                eventId: uuidv4(),
                eventType: 'logout',
                eventCategory: 'authentication',
                severity: 'info',
                actor: {
                    userId: req.user.id,
                    username: req.user.username,
                    role: req.user.role,
                    ipAddress: req.ip,
                },
                target: {
                    type: 'user',
                    id: req.user.id,
                },
                action: 'logout',
                result: 'success',
                context: {
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                },
                timestamp: new Date(),
            });
        }

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const user = await User.findById(req.user.id).select('-passwordHash -mfaSecret');
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            id: user._id,
            username: user.username,
            role: user.role,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            department: user.department,
            status: user.status,
            mfaEnabled: user.mfaEnabled,
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
};
