import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { ScanResult } from '../models/ScanResult.js';
import { User } from '../models/User.js';
import { Device } from '../models/Device.js';

/**
 * Get admin dashboard statistics
 */
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { timeRange = 'today' } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (timeRange) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            default:
                startDate = new Date(now.setHours(0, 0, 0, 0));
        }

        // Aggregate scan statistics
        const stats = await ScanResult.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: null,
                    totalScans: { $sum: 1 },
                    allowedScans: {
                        $sum: { $cond: [{ $eq: ['$decision', 'allow'] }, 1, 0] },
                    },
                    mfaRequiredScans: {
                        $sum: { $cond: [{ $eq: ['$decision', 'mfa_required'] }, 1, 0] },
                    },
                    blockedScans: {
                        $sum: { $cond: [{ $eq: ['$decision', 'blocked'] }, 1, 0] },
                    },
                    avgTrustScore: { $avg: '$trustScore' },
                },
            },
        ]);

        const result = stats[0] || {
            totalScans: 0,
            allowedScans: 0,
            mfaRequiredScans: 0,
            blockedScans: 0,
            avgTrustScore: 0,
        };

        // Get unique users and devices
        const uniqueUsers = await ScanResult.distinct('userId', {
            createdAt: { $gte: startDate },
        });
        const uniqueDevices = await ScanResult.distinct('deviceId', {
            createdAt: { $gte: startDate },
        });

        res.json({
            totalScans: result.totalScans,
            allowedScans: result.allowedScans,
            mfaRequiredScans: result.mfaRequiredScans,
            blockedScans: result.blockedScans,
            avgTrustScore: Math.round(result.avgTrustScore || 0),
            uniqueUsers: uniqueUsers.length,
            uniqueDevices: uniqueDevices.length,
            allowRate: result.totalScans > 0
                ? Math.round((result.allowedScans / result.totalScans) * 100)
                : 0,
            blockRate: result.totalScans > 0
                ? Math.round((result.blockedScans / result.totalScans) * 100)
                : 0,
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to get dashboard statistics' });
    }
};

/**
 * Get all scan logs with filtering
 */
export const getScanLogs = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            page = 1,
            limit = 50,
            decision,
            userId,
            resourceId,
            startDate,
            endDate,
        } = req.query;

        // Build filter
        const filter: any = {};
        if (decision) filter.decision = decision;
        if (userId) filter.userId = userId;
        if (resourceId) filter.resourceId = resourceId;
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate as string);
            if (endDate) filter.createdAt.$lte = new Date(endDate as string);
        }

        // Query scans
        const scans = await ScanResult.find(filter)
            .populate('userId', 'username role email')
            .populate('resourceId', 'name sensitivity')
            .populate('deviceId', 'deviceName deviceType')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        const total = await ScanResult.countDocuments(filter);

        res.json({
            scans,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error('Get scan logs error:', error);
        res.status(500).json({ error: 'Failed to get scan logs' });
    }
};

/**
 * Get all users
 */
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const users = await User.find()
            .select('-passwordHash -mfaSecret -mfaBackupCodes')
            .sort({ createdAt: -1 });

        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
};

/**
 * Get user detail with scan history
 */
export const getUserDetail = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        // Get user
        const user = await User.findById(userId).select('-passwordHash -mfaSecret -mfaBackupCodes');
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Get user's devices
        const devices = await Device.find({ userId }).sort({ lastSeenAt: -1 });

        // Get user's scan history
        const scans = await ScanResult.find({ userId })
            .populate('resourceId', 'name sensitivity')
            .populate('deviceId', 'deviceName deviceType')
            .sort({ createdAt: -1 })
            .limit(100);

        // Calculate user statistics
        const stats = await ScanResult.aggregate([
            { $match: { userId: user._id } },
            {
                $group: {
                    _id: null,
                    totalScans: { $sum: 1 },
                    avgTrustScore: { $avg: '$trustScore' },
                    allowedScans: {
                        $sum: { $cond: [{ $eq: ['$decision', 'allow'] }, 1, 0] },
                    },
                    blockedScans: {
                        $sum: { $cond: [{ $eq: ['$decision', 'blocked'] }, 1, 0] },
                    },
                },
            },
        ]);

        const userStats = stats[0] || {
            totalScans: 0,
            avgTrustScore: 0,
            allowedScans: 0,
            blockedScans: 0,
        };

        res.json({
            user,
            devices,
            scans,
            stats: {
                totalScans: userStats.totalScans,
                avgTrustScore: Math.round(userStats.avgTrustScore || 0),
                allowedScans: userStats.allowedScans,
                blockedScans: userStats.blockedScans,
            },
        });
    } catch (error) {
        console.error('Get user detail error:', error);
        res.status(500).json({ error: 'Failed to get user detail' });
    }
};

/**
 * Create a new user (employee or admin)
 */
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const {
            username,
            email,
            password,
            role,
            firstName,
            lastName,
            department,
            status = 'active'
        } = req.body;

        // Validation
        if (!username || !email || !password || !role) {
            res.status(400).json({ error: 'Missing required fields: username, email, password, role' });
            return;
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            res.status(409).json({ error: 'User with this username or email already exists' });
            return;
        }

        // Hash password
        // Note: In a real app we would import bcrypt, but since it's already used in initDb.ts 
        // we can dynamically import it or assume it's available via a helper service.
        // For consistency with existing codebase, let's use dynamic import or replicate the hash logic if needed.
        // Actually, let's rely on importing bcryptjs at the top of the file since it is used in initDb.ts
        // Wait, I need to check if bcryptjs is imported in this file. It is NOT.
        // I will add the import in a separate edit or just use dynamic import here for now to avoid multiple edits.
        // Better: I'll use a dynamic import for now to keep this single-step safely, or better yet, I will add the import in a previous step?
        // No, I can add the import in this same file if I replace the whole file or a larger chunk.
        // Alternatively, I will just add the function and then add the import at the top.
        // Let's assume I will add `import bcrypt from 'bcryptjs';` at the top in a separate call or use a multi-replace.
        // For now, I'll use dynamic import to be safe and self-contained in this block if possible, 
        // but Typescript might complain about types.
        // Let's just do the function logic and I'll add the import in a subsequent call.

        // Actually, I'll use a hack or just assume I'll fix imports. 
        // Let's do the right thing: I should have checked imports. 
        // I'll add the implementation here and then fix the import.

        // Dynamic import workaround to ensure it works without top-level import for now
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.default.hash(password, 10);

        const newUser = await User.create({
            username,
            email,
            passwordHash,
            role,
            firstName,
            lastName,
            department,
            status,
            mfaEnabled: false
        });

        // Return user without sensitive data
        const userResponse = newUser.toObject();
        // @ts-ignore
        delete userResponse.passwordHash;
        // @ts-ignore
        delete userResponse.mfaSecret;

        res.status(201).json({
            message: 'User created successfully',
            user: userResponse
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

/**
 * Delete a user
 */
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const requestorId = req.user!.id;

        // Prevent self-deletion
        if (userId === requestorId) {
            res.status(403).json({ error: 'Cannot delete your own account' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Delete user
        await User.findByIdAndDelete(userId);

        // Optionally clean up related data like scans and devices
        // await ScanResult.deleteMany({ userId });
        // await Device.deleteMany({ userId });

        res.json({ message: `User ${user.username} deleted successfully` });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
