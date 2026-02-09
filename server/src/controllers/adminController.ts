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
