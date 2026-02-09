import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.js';
import { Device } from '../models/Device.js';
import { Resource } from '../models/Resource.js';
import { ScanResult } from '../models/ScanResult.js';
import { AuditLog } from '../models/AuditLog.js';
import { ContextDetectionService } from '../services/contextDetectionService.js';
import { TrustEvaluationService } from '../services/trustEvaluationService.js';

/**
 * Initiate trust scan
 */
export const initiateScan = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { resourceId } = req.body;
        const userId = req.user!.id;

        if (!resourceId) {
            res.status(400).json({ error: 'Resource ID required' });
            return;
        }

        // Detect context
        const context = ContextDetectionService.detectContext(req);

        // Find or create device
        let device = await Device.findOne({
            userId,
            deviceId: context.deviceFingerprint,
        });

        if (!device) {
            // Register new device
            device = await Device.create({
                userId,
                deviceId: context.deviceFingerprint,
                deviceType: context.deviceType,
                deviceName: `${context.deviceInfo.platform} - ${context.deviceInfo.browser}`,
                platform: context.deviceInfo.platform,
                browser: context.deviceInfo.browser,
                osVersion: context.deviceInfo.osVersion,
                browserVersion: context.deviceInfo.browserVersion,
                isManaged: context.deviceType === 'managed',
                trustLevel: context.deviceType === 'managed' ? 'trusted' : 'unverified',
                lastSeenAt: new Date(),
                firstSeenAt: new Date(),
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
            });
        } else {
            // Update device last seen
            device.lastSeenAt = new Date();
            device.ipAddress = context.ipAddress;
            await device.save();
        }

        // Get resource
        const resource = await Resource.findById(resourceId);
        if (!resource) {
            res.status(404).json({ error: 'Resource not found' });
            return;
        }

        // Check if user role is allowed
        if (!resource.allowedRoles.includes(req.user!.role)) {
            res.status(403).json({ error: 'User role not authorized for this resource' });
            return;
        }

        // Evaluate trust
        const evaluation = await TrustEvaluationService.evaluateTrust({
            userId,
            deviceId: device._id.toString(),
            resourceId: resource._id.toString(),
            context: {
                deviceType: context.deviceType,
                networkType: context.networkType,
                ipAddress: context.ipAddress,
            },
            device,
            resource,
        });

        // Create scan result
        const scanId = uuidv4();
        const scanResult = await ScanResult.create({
            scanId,
            userId,
            deviceId: device._id,
            resourceId: resource._id,
            trustScore: evaluation.trustScore,
            decision: evaluation.decision,
            decisionReason: evaluation.decisionReason,
            context: {
                deviceType: context.deviceType,
                networkType: context.networkType,
                ipAddress: context.ipAddress,
                timestamp: new Date(),
                userAgent: context.userAgent,
            },
            factors: evaluation.factors,
            mfaRequired: evaluation.mfaRequired,
            mfaVerified: false,
            accessGranted: evaluation.decision === 'allow',
            accessGrantedAt: evaluation.decision === 'allow' ? new Date() : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            completedAt: evaluation.decision === 'allow' ? new Date() : undefined,
            metadata: {
                retryCount: 0,
                policyVersion: '1.0.0',
            },
        });

        // Create audit log
        await AuditLog.create({
            eventId: uuidv4(),
            eventType: 'access_attempt',
            eventCategory: 'authorization',
            severity: evaluation.decision === 'blocked' ? 'warning' : 'info',
            actor: {
                userId: req.user!.id,
                username: req.user!.username,
                role: req.user!.role,
                ipAddress: context.ipAddress,
            },
            target: {
                type: 'resource',
                id: resource._id,
                name: resource.name,
            },
            action: 'access_request',
            result: evaluation.decision === 'blocked' ? 'failure' : 'success',
            details: {
                trustScore: evaluation.trustScore,
                decision: evaluation.decision,
            },
            context: {
                deviceId: device._id,
                scanId,
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
            },
            timestamp: new Date(),
        });

        res.json({
            scanId,
            trustScore: evaluation.trustScore,
            decision: evaluation.decision,
            decisionReason: evaluation.decisionReason,
            factors: evaluation.factors,
            mfaRequired: evaluation.mfaRequired,
            accessGranted: evaluation.decision === 'allow',
            resource: {
                id: resource._id,
                name: resource.name,
                sensitivity: resource.sensitivity,
            },
            context: {
                deviceType: context.deviceType,
                networkType: context.networkType,
            },
        });
    } catch (error) {
        console.error('Scan initiation error:', error);
        res.status(500).json({ error: 'Failed to initiate scan' });
    }
};

/**
 * Verify MFA and complete scan
 */
export const verifyMFA = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { scanId, mfaCode } = req.body;

        if (!scanId || !mfaCode) {
            res.status(400).json({ error: 'Scan ID and MFA code required' });
            return;
        }

        // Find scan result
        const scanResult = await ScanResult.findOne({ scanId });
        if (!scanResult) {
            res.status(404).json({ error: 'Scan not found' });
            return;
        }

        // Verify scan belongs to user
        if (scanResult.userId.toString() !== req.user!.id) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }

        // Check if MFA is required
        if (!scanResult.mfaRequired) {
            res.status(400).json({ error: 'MFA not required for this scan' });
            return;
        }

        // Simplified MFA verification (in production, use proper TOTP validation)
        const isValidMFA = mfaCode === '123456' || mfaCode.length === 6;

        if (!isValidMFA) {
            scanResult.mfaAttempts = (scanResult.mfaAttempts || 0) + 1;
            await scanResult.save();

            res.status(401).json({ error: 'Invalid MFA code' });
            return;
        }

        // Update scan result
        scanResult.mfaVerified = true;
        scanResult.mfaVerifiedAt = new Date();
        scanResult.mfaMethod = 'totp';
        scanResult.accessGranted = true;
        scanResult.accessGrantedAt = new Date();
        scanResult.completedAt = new Date();
        await scanResult.save();

        // Create audit log
        await AuditLog.create({
            eventId: uuidv4(),
            eventType: 'mfa_verified',
            eventCategory: 'authentication',
            severity: 'info',
            actor: {
                userId: req.user!.id,
                username: req.user!.username,
                role: req.user!.role,
            },
            target: {
                type: 'scan',
                id: scanResult._id,
            },
            action: 'mfa_verification',
            result: 'success',
            context: {
                scanId,
            },
            timestamp: new Date(),
        });

        res.json({
            success: true,
            accessGranted: true,
            message: 'MFA verified successfully',
        });
    } catch (error) {
        console.error('MFA verification error:', error);
        res.status(500).json({ error: 'Failed to verify MFA' });
    }
};

/**
 * Get scan status
 */
export const getScanStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { scanId } = req.params;

        const scanResult = await ScanResult.findOne({ scanId })
            .populate('resourceId', 'name sensitivity')
            .populate('deviceId', 'deviceName deviceType');

        if (!scanResult) {
            res.status(404).json({ error: 'Scan not found' });
            return;
        }

        // Verify scan belongs to user
        if (scanResult.userId.toString() !== req.user!.id) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }

        res.json({
            scanId: scanResult.scanId,
            trustScore: scanResult.trustScore,
            decision: scanResult.decision,
            decisionReason: scanResult.decisionReason,
            factors: scanResult.factors,
            mfaRequired: scanResult.mfaRequired,
            mfaVerified: scanResult.mfaVerified,
            accessGranted: scanResult.accessGranted,
            createdAt: scanResult.createdAt,
            completedAt: scanResult.completedAt,
        });
    } catch (error) {
        console.error('Get scan status error:', error);
        res.status(500).json({ error: 'Failed to get scan status' });
    }
};
