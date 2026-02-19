import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { ScanResult } from '../models/ScanResult.js';
import { Device } from '../models/Device.js';

/**
 * Get user's scan history
 */
export const getScanHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const { limit = 50 } = req.query;

        const scans = await ScanResult.find({ userId })
            .populate('resourceId', 'name sensitivity')
            .populate('deviceId', 'deviceName deviceType')
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        res.json({ scans });
    } catch (error) {
        console.error('Get scan history error:', error);
        res.status(500).json({ error: 'Failed to get scan history' });
    }
};

/**
 * Get user's devices
 */
export const getDevices = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;

        const devices = await Device.find({ userId }).sort({ lastSeenAt: -1 });

        res.json({ devices });
    } catch (error) {
        console.error('Get devices error:', error);
        res.status(500).json({ error: 'Failed to get devices' });
    }
};

/**
 * Get user statistics
 */
export const getUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;

        // Calculate statistics
        const stats = await ScanResult.aggregate([
            { $match: { userId: userId } },
            {
                $group: {
                    _id: null,
                    totalScans: { $sum: 1 },
                    avgTrustScore: { $avg: '$trustScore' },
                    allowedScans: {
                        $sum: { $cond: [{ $eq: ['$decision', 'allow'] }, 1, 0] },
                    },
                    mfaRequiredScans: {
                        $sum: { $cond: [{ $eq: ['$decision', 'mfa_required'] }, 1, 0] },
                    },
                    blockedScans: {
                        $sum: { $cond: [{ $eq: ['$decision', 'blocked'] }, 1, 0] },
                    },
                },
            },
        ]);

        const result = stats[0] || {
            totalScans: 0,
            avgTrustScore: 0,
            allowedScans: 0,
            mfaRequiredScans: 0,
            blockedScans: 0,
        };

        // Get trust score trend (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const trendData = await ScanResult.aggregate([
            { $match: { userId: userId, createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                    },
                    avgScore: { $avg: '$trustScore' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        res.json({
            totalScans: result.totalScans,
            avgTrustScore: Math.round(result.avgTrustScore || 0),
            allowedScans: result.allowedScans,
            mfaRequiredScans: result.mfaRequiredScans,
            blockedScans: result.blockedScans,
            trend: trendData.map((item) => ({
                date: item._id,
                avgScore: Math.round(item.avgScore),
                count: item.count,
            })),
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ error: 'Failed to get user statistics' });
    }
};
