import { TrustPolicy, ITrustPolicy } from '../models/TrustPolicy.js';
import { Resource, IResource } from '../models/Resource.js';
import { Device, IDevice } from '../models/Device.js';
import { IDecisionFactor } from '../models/ScanResult.js';

export interface TrustEvaluationInput {
    userId: string;
    deviceId: string;
    resourceId: string;
    context: {
        deviceType: 'managed' | 'personal';
        networkType: 'corporate' | 'home' | 'public';
        ipAddress: string;
    };
    device?: IDevice;
    resource?: IResource;
}

export interface TrustEvaluationResult {
    trustScore: number;
    decision: 'allow' | 'mfa_required' | 'blocked';
    decisionReason: string;
    factors: IDecisionFactor[];
    mfaRequired: boolean;
}

export class TrustEvaluationService {
    /**
     * Evaluate trust score and make access decision
     */
    static async evaluateTrust(input: TrustEvaluationInput): Promise<TrustEvaluationResult> {
        // Get active trust policy
        const policy = await this.getActivePolicy();

        // Get resource if not provided
        const resource = input.resource || await Resource.findById(input.resourceId);
        if (!resource) {
            throw new Error('Resource not found');
        }

        // Get device if not provided
        const device = input.device || await Device.findById(input.deviceId);
        if (!device) {
            throw new Error('Device not found');
        }

        // Calculate individual factor scores
        const factors: IDecisionFactor[] = [];
        let baseScore = 50; // Start with neutral score

        // 1. Device Trust Factor
        const deviceFactor = this.evaluateDeviceTrust(device, input.context.deviceType, policy);
        factors.push(deviceFactor);
        baseScore += deviceFactor.impact;

        // 2. Network Security Factor
        const networkFactor = this.evaluateNetworkSecurity(input.context.networkType, policy);
        factors.push(networkFactor);
        baseScore += networkFactor.impact;

        // 3. Resource Sensitivity Factor
        const resourceFactor = this.evaluateResourceSensitivity(resource, policy);
        factors.push(resourceFactor);
        baseScore += resourceFactor.impact;

        // 4. User Behavior Factor (simplified)
        const behaviorFactor = this.evaluateUserBehavior(device, policy);
        factors.push(behaviorFactor);
        baseScore += behaviorFactor.impact;

        // Calculate final trust score (0-100)
        let trustScore = Math.max(0, Math.min(100, baseScore));

        // Apply resource sensitivity multiplier
        const multiplier = policy.resourceMultipliers[resource.sensitivity];
        trustScore = Math.max(0, Math.min(100, trustScore * multiplier));

        // Make decision based on thresholds
        let decision: 'allow' | 'mfa_required' | 'blocked';
        let decisionReason: string;
        let mfaRequired = false;

        if (resource.mfaRequired || policy.mfaRules.alwaysRequireForCritical && resource.sensitivity === 'critical') {
            decision = 'mfa_required';
            decisionReason = 'MFA required for this resource';
            mfaRequired = true;
        } else if (trustScore >= policy.thresholds.allowThreshold) {
            decision = 'allow';
            decisionReason = 'Trust score meets threshold for direct access';
        } else if (trustScore >= policy.thresholds.mfaThreshold) {
            decision = 'mfa_required';
            decisionReason = 'Trust score requires step-up MFA authentication';
            mfaRequired = true;
        } else {
            decision = 'blocked';
            decisionReason = 'Trust score too low - access denied';
        }

        return {
            trustScore: Math.round(trustScore),
            decision,
            decisionReason,
            factors,
            mfaRequired,
        };
    }

    /**
     * Get active trust policy
     */
    private static async getActivePolicy(): Promise<ITrustPolicy> {
        const policy = await TrustPolicy.findOne({ status: 'active' }).sort({ createdAt: -1 });
        if (!policy) {
            throw new Error('No active trust policy found');
        }
        return policy;
    }

    /**
     * Evaluate device trust
     */
    private static evaluateDeviceTrust(
        device: IDevice,
        contextDeviceType: string,
        policy: ITrustPolicy
    ): IDecisionFactor {
        const weight = policy.factorWeights.deviceTrust;
        let score = 0;
        let status: 'pass' | 'warn' | 'fail' = 'fail';
        let details = '';

        // Score based on device type
        if (device.isManaged || contextDeviceType === 'managed') {
            score = policy.deviceScoring.managed;
            status = 'pass';
            details = 'Corporate-managed device with security controls';
        } else if (device.trustLevel === 'trusted') {
            score = policy.deviceScoring.personal;
            status = 'warn';
            details = 'Personal device - trusted but not managed';
        } else if (device.trustLevel === 'compromised') {
            score = policy.deviceScoring.compromised;
            status = 'fail';
            details = 'Device flagged as compromised';
        } else {
            score = policy.deviceScoring.unverified;
            status = 'warn';
            details = 'Unverified device';
        }

        const impact = (score * weight) / 100;

        return {
            name: 'Device Trust',
            category: 'device',
            status,
            score,
            weight,
            impact,
            details,
        };
    }

    /**
     * Evaluate network security
     */
    private static evaluateNetworkSecurity(
        networkType: string,
        policy: ITrustPolicy
    ): IDecisionFactor {
        const weight = policy.factorWeights.networkSecurity;
        let score = 0;
        let status: 'pass' | 'warn' | 'fail' = 'fail';
        let details = '';

        switch (networkType) {
            case 'corporate':
                score = policy.networkScoring.corporate;
                status = 'pass';
                details = 'Secure corporate network';
                break;
            case 'home':
                score = policy.networkScoring.home;
                status = 'warn';
                details = 'Home network - moderate security';
                break;
            case 'public':
                score = policy.networkScoring.public;
                status = 'fail';
                details = 'Public network - security risk';
                break;
            default:
                score = 0;
                status = 'fail';
                details = 'Unknown network type';
        }

        const impact = (score * weight) / 100;

        return {
            name: 'Network Security',
            category: 'network',
            status,
            score,
            weight,
            impact,
            details,
        };
    }

    /**
     * Evaluate resource sensitivity
     */
    private static evaluateResourceSensitivity(
        resource: IResource,
        policy: ITrustPolicy
    ): IDecisionFactor {
        const weight = policy.factorWeights.resourceSensitivity;
        let score = 0;
        let status: 'pass' | 'warn' | 'fail' = 'pass';
        let details = '';

        // Higher sensitivity = higher requirements (negative score adjustment)
        switch (resource.sensitivity) {
            case 'standard':
                score = 10;
                status = 'pass';
                details = 'Standard sensitivity resource';
                break;
            case 'elevated':
                score = -5;
                status = 'warn';
                details = 'Elevated sensitivity - higher requirements';
                break;
            case 'critical':
                score = -15;
                status = 'warn';
                details = 'Critical resource - strict requirements';
                break;
        }

        const impact = (score * weight) / 100;

        return {
            name: 'Resource Sensitivity',
            category: 'resource',
            status,
            score,
            weight,
            impact,
            details,
        };
    }

    /**
     * Evaluate user behavior (simplified)
     */
    private static evaluateUserBehavior(
        device: IDevice,
        policy: ITrustPolicy
    ): IDecisionFactor {
        const weight = policy.factorWeights.userBehavior;
        let score = 0;
        let status: 'pass' | 'warn' | 'fail' = 'pass';
        let details = '';

        // Check if new device
        const deviceAge = Date.now() - device.firstSeenAt.getTime();
        const isNewDevice = deviceAge < 24 * 60 * 60 * 1000; // Less than 24 hours

        if (isNewDevice) {
            score = policy.behavioralRules.newDevicePenalty;
            status = 'warn';
            details = 'New device - first time access';
        } else {
            score = 10;
            status = 'pass';
            details = 'Recognized device with history';
        }

        const impact = (score * weight) / 100;

        return {
            name: 'User Behavior',
            category: 'behavioral',
            status,
            score,
            weight,
            impact,
            details,
        };
    }
}
