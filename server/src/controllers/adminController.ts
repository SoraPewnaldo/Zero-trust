import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { ScanResult } from '../models/ScanResult.js';
import { User } from '../models/User.js';
import { Device } from '../models/Device.js';
import { AuditLog } from '../models/AuditLog.js';
import { v4 as uuidv4 } from 'uuid';

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
        const scanPromise = ScanResult.find(filter)
            .populate('userId', 'username role email')
            .populate('resourceId', 'name sensitivity')
            .populate('deviceId', 'deviceName deviceType')
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .lean();

        // Query audit logs (login failures, user creation, user deletion)
        const auditFilter: any = {
            eventType: { $in: ['login_failed', 'user_created', 'user_deleted'] }
        };

        if (startDate || endDate) {
            auditFilter.createdAt = {};
            if (startDate) auditFilter.createdAt.$gte = new Date(startDate as string);
            if (endDate) auditFilter.createdAt.$lte = new Date(endDate as string);
        }

        const auditPromise = AuditLog.find(auditFilter)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .lean();

        const [scans, auditLogs] = await Promise.all([scanPromise, auditPromise]);

        // Map audit logs to scan result shape for unified display
        const mappedAuditLogs = auditLogs.map(log => {
            let decision = 'blocked';
            let factors = [{
                name: 'Authentication Failed',
                status: 'fail',
                details: log.details?.reason || 'Invalid credentials'
            }];
            let resourceName = 'Authentication';
            let trustScore = 0;

            if (log.eventType === 'user_created') {
                decision = 'allow';
                resourceName = 'User Management';
                factors = [{ name: 'User Created', status: 'pass', details: `Created user ${log.target.name}` }];
                trustScore = 100;
            } else if (log.eventType === 'user_deleted') {
                decision = 'allow'; // or 'blocked' to highlight it? 'allow' implies success of action.
                resourceName = 'User Management';
                factors = [{ name: 'User Deleted', status: 'pass', details: `Deleted user ${log.target.name}` }];
                trustScore = 100;
            }

            return {
                _id: log._id,
                scanId: log.eventId,
                userId: log.actor.userId ? {
                    _id: log.actor.userId,
                    username: log.actor.username || 'Unknown',
                    role: log.actor.role || 'unknown'
                } : {
                    _id: 'unknown',
                    username: log.actor.username || 'Unknown',
                    role: 'unknown'
                },
                resourceId: {
                    name: resourceName
                },
                deviceId: {
                    deviceName: 'Admin Console'
                },
                trustScore: trustScore,
                decision: decision,
                createdAt: log.timestamp,
                context: {
                    ipAddress: log.context.ipAddress,
                    userAgent: log.context.userAgent,
                    geolocation: { city: log.details?.reason || log.eventType }
                },
                factors: factors
            };
        });

        // Merge and sort
        const combinedLogs = [...scans, ...mappedAuditLogs].sort((a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, Number(limit));

        const totalScans = await ScanResult.countDocuments(filter);
        const totalAudit = await AuditLog.countDocuments(auditFilter);

        res.json({
            scans: combinedLogs,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: totalScans + totalAudit,
                pages: Math.ceil((totalScans + totalAudit) / Number(limit)),
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
                    mfaRequiredScans: {
                        $sum: { $cond: [{ $eq: ['$decision', 'mfa_required'] }, 1, 0] },
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
            mfaRequiredScans: 0,
            blockedScans: 0,
        };

        const lastScan = await ScanResult.findOne({ userId }).sort({ createdAt: -1 });

        // Generate recommendations
        const recommendations = [];
        if (!user.mfaEnabled) {
            recommendations.push({
                id: 'rec-1',
                title: 'Enable MFA',
                priority: 'high',
                description: 'User has not enabled Multi-Factor Authentication.',
                resolved: false
            });
        }
        if (userStats.avgTrustScore > 0 && userStats.avgTrustScore < 60) {
            recommendations.push({
                id: 'rec-2',
                title: 'Low Trust Score',
                priority: 'medium',
                description: 'User average trust score is below 60. Investigate activity.',
                resolved: false
            });
        }
        if (userStats.blockedScans > 5) {
            recommendations.push({
                id: 'rec-3',
                title: 'High Block Rate',
                priority: 'high',
                description: 'User has a high number of blocked access attempts.',
                resolved: false
            });
        }
        if (devices.length === 0) {
            recommendations.push({
                id: 'rec-4',
                title: 'No Devices',
                priority: 'low',
                description: 'User has no registered devices.',
                resolved: true // Considered resolved if we just want to note it, or false if it's an issue.
            });
        }


        res.json({
            user,
            devices,
            scans,
            stats: {
                totalScans: userStats.totalScans,
                avgTrustScore: Math.round(userStats.avgTrustScore || 0),
                allowedScans: userStats.allowedScans,
                mfaCount: userStats.mfaRequiredScans,
                blockedScans: userStats.blockedScans,
                lastDecision: lastScan ? lastScan.decision : null,
            },
            recommendations
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

        // Log user creation
        await AuditLog.create({
            eventId: uuidv4(),
            eventType: 'user_created',
            eventCategory: 'administration',
            severity: 'info',
            actor: {
                userId: req.user!.id, // Admin
                username: req.user!.username,
                role: req.user!.role,
                ipAddress: req.ip,
            },
            target: {
                type: 'user',
                id: newUser._id,
                name: newUser.username
            },
            action: 'create_user',
            result: 'success',
            context: {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            },
            timestamp: new Date(),
        });

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

        // Sort of an audit log for deletion
        await AuditLog.create({
            eventId: uuidv4(),
            eventType: 'user_deleted',
            eventCategory: 'administration',
            severity: 'warning',
            actor: {
                userId: req.user!.id,
                username: req.user!.username,
                role: req.user!.role,
                ipAddress: req.ip,
            },
            target: {
                type: 'user',
                id: user._id,
                name: user.username
            },
            action: 'delete_user',
            result: 'success',
            context: {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            },
            timestamp: new Date(),
        });

        // Optionally clean up related data like scans and devices
        // await ScanResult.deleteMany({ userId });
        // await Device.deleteMany({ userId });

        res.json({ message: `User ${user.username} deleted successfully` });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
