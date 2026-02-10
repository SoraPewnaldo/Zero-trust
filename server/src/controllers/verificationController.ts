import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth.js';
import { Device } from '../models/Device.js';
import { Resource } from '../models/Resource.js';
import { ScanResult } from '../models/ScanResult.js';
import { AuditLog } from '../models/AuditLog.js';
import { ContextDetectionService } from '../services/contextDetectionService.js';

// --- GATEKEEPER DECISION LOGIC (NODE.JS) ---
// EXACT implementation of User's requested logic
function decideAccess(score: number, resourceName: string): 'allow' | 'blocked' | 'mfa_required' {
    // Exact mapping from User request:
    // if (resource === "PROD_CLOUD" && score < 80) return "BLOCKED";
    // if (score >= 80) return "ALLOW";
    // if (score >= 60) return "MFA_REQUIRED";
    // return "BLOCKED";

    // Adapted to use internal lowercase enums
    if (resourceName === 'Production Console' && score < 80) return 'blocked';

    if (score >= 80) return 'allow';
    if (score >= 60) return 'mfa_required';
    return 'blocked';
}

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

        // --- CALL PYTHON TRUST ENGINE (PDP) ---
        let trustScore = 0;
        let factors: any[] = [];
        let engineDetails: any = {};

        try {
            console.log('🔄 Calling Python Trust Engine (PDP)...');
            const pythonEngineUrl = process.env.TRUST_ENGINE_URL || 'http://127.0.0.1:5000/scan';

            // Pass context if needed, but Engine does its own local checks (osquery/nmap)
            // Ideally corelation id or something could be passed
            const engineResponse = await axios.post(pythonEngineUrl, {
                userId,
                deviceId: device.deviceId,
                resource: resource.name
            }, { timeout: 5000 }); // 5s timeout

            trustScore = engineResponse.data.trust_score;
            engineDetails = engineResponse.data.details;

            // Map Python details to Factors for UI - ensuring they match IDecisionFactor schema
            if (engineDetails.firewall_enabled) {
                factors.push({ name: 'Firewall', category: 'device', status: 'pass', score: 25, weight: 25, impact: 25, details: 'Firewall enabled' });
            } else {
                factors.push({ name: 'Firewall', category: 'device', status: 'fail', score: 0, weight: 25, impact: 0, details: 'Firewall disabled' });
            }

            if (engineDetails.antivirus_running) {
                factors.push({ name: 'Antivirus', category: 'device', status: 'pass', score: 25, weight: 25, impact: 25, details: 'Antivirus running' });
            } else {
                factors.push({ name: 'Antivirus', category: 'device', status: 'fail', score: 0, weight: 25, impact: 0, details: 'Antivirus disabled' });
            }

            if (engineDetails.os_updated) {
                factors.push({ name: 'OS Updates', category: 'device', status: 'pass', score: 20, weight: 20, impact: 20, details: 'OS is up to date' });
            } else {
                factors.push({ name: 'OS Updates', category: 'device', status: 'warn', score: 0, weight: 20, impact: 0, details: 'OS update status unknown or pending' });
            }

            if (!engineDetails.risky_ports_found) {
                factors.push({ name: 'Safe Ports', category: 'network', status: 'pass', score: 20, weight: 20, impact: 20, details: 'No risky ports found' });
            } else {
                factors.push({ name: 'Safe Ports', category: 'network', status: 'fail', score: 0, weight: 20, impact: 0, details: 'Risky open ports detected' });
            }

            // Scan freshness is implicit
            factors.push({ name: 'Scan Freshness', category: 'behavioral', status: 'pass', score: 10, weight: 10, impact: 10, details: 'Real-time scan' });

            console.log(`✅ Trust Engine Result: Score=${trustScore}`);

        } catch (engineError) {
            console.error('❌ Failed to contact Python Trust Engine:', engineError);
            // Fallback to "Fail Open" or "Fail Closed"? Zero Trust = Fail Closed usually.
            // But for demo, we might want to allow a fallback score or error out.
            // Let's degrade gracefully but log it.
            trustScore = 0;
            factors.push({ name: 'Trust Engine Offline', category: 'device', status: 'fail', score: 0, weight: 0, impact: -100, details: 'Could not contact PDP' });
        }

        // --- GATEKEEPER DECISION ---
        const decision = decideAccess(trustScore, resource.name);

        let decisionReason = 'Trust score meets policy requirements';
        if (decision === 'blocked') {
            if (resource.name === 'Production Console' && trustScore < 80) decisionReason = 'High sensitivity resource requires > 80 trust score';
            else decisionReason = 'Trust score too low for access';
        } else if (decision === 'mfa_required') {
            decisionReason = 'Step-up authentication required due to medium trust score';
        }

        // Save scanned OS info if available from Engine
        if (engineDetails.os_version) {
            device.osVersion = engineDetails.os_version;
            await device.save();
        }

        // Create scan result
        const scanId = uuidv4();
        const scanResult = await ScanResult.create({
            scanId,
            userId,
            deviceId: device._id,
            resourceId: resource._id,
            trustScore: trustScore,
            decision: decision,
            decisionReason: decisionReason,
            context: {
                deviceType: context.deviceType,
                networkType: context.networkType,
                ipAddress: context.ipAddress,
                timestamp: new Date(),
                userAgent: context.userAgent,
            },
            factors: factors,
            mfaRequired: decision === 'mfa_required',
            mfaVerified: false,
            accessGranted: decision === 'allow',
            accessGrantedAt: decision === 'allow' ? new Date() : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            completedAt: decision === 'allow' ? new Date() : undefined,
            metadata: {
                retryCount: 0,
                policyVersion: '2.0.0-real',
                engine: 'python-pdp'
            },
        });

        // Create audit log
        await AuditLog.create({
            eventId: uuidv4(),
            eventType: 'access_attempt',
            eventCategory: 'authorization',
            severity: decision === 'blocked' ? 'warning' : 'info',
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
            result: decision === 'blocked' ? 'failure' : 'success',
            details: {
                trustScore: trustScore,
                decision: decision,
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
            trustScore: trustScore,
            decision: decision,
            decisionReason: decisionReason,
            factors: factors,
            mfaRequired: decision === 'mfa_required',
            accessGranted: decision === 'allow',
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
        if (axios.isAxiosError(error)) {
            console.error('Axios Error Details:', error.response?.data || error.message);
        }
        res.status(500).json({ error: 'Failed to initiate scan' });
    }
};

/**
 * Verify MFA and complete scan (unchanged)
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
 * Get scan status (unchanged)
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
