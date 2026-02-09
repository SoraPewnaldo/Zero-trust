import mongoose, { Schema, Document } from 'mongoose';

export interface IDecisionFactor {
    name: string;
    category: 'device' | 'network' | 'resource' | 'user' | 'behavioral';
    status: 'pass' | 'warn' | 'fail';
    score: number;
    weight: number;
    impact: number;
    details?: string;
}

export interface IScanResult extends Document {
    scanId: string;
    userId: mongoose.Types.ObjectId;
    deviceId: mongoose.Types.ObjectId;
    resourceId: mongoose.Types.ObjectId;
    trustScore: number;
    decision: 'allow' | 'mfa_required' | 'blocked';
    decisionReason?: string;
    context: {
        deviceType: string;
        networkType: string;
        ipAddress?: string;
        geolocation?: {
            country?: string;
            city?: string;
            latitude?: number;
            longitude?: number;
        };
        timestamp: Date;
        userAgent?: string;
        sessionId?: string;
    };
    factors: IDecisionFactor[];
    mfaRequired: boolean;
    mfaVerified: boolean;
    mfaMethod?: string;
    mfaAttempts?: number;
    mfaVerifiedAt?: Date;
    accessGranted: boolean;
    accessGrantedAt?: Date;
    accessDeniedReason?: string;
    sessionDuration?: number;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    riskFlags?: string[];
    anomalyScore?: number;
    metadata?: {
        scanDuration?: number;
        retryCount?: number;
        policyVersion?: string;
    };
}

const ScanResultSchema = new Schema<IScanResult>(
    {
        scanId: {
            type: String,
            required: true,
            unique: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        deviceId: {
            type: Schema.Types.ObjectId,
            ref: 'Device',
            required: true,
        },
        resourceId: {
            type: Schema.Types.ObjectId,
            ref: 'Resource',
            required: true,
        },
        trustScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        decision: {
            type: String,
            enum: ['allow', 'mfa_required', 'blocked'],
            required: true,
        },
        decisionReason: String,
        context: {
            deviceType: { type: String, required: true },
            networkType: { type: String, required: true },
            ipAddress: String,
            geolocation: {
                country: String,
                city: String,
                latitude: Number,
                longitude: Number,
            },
            timestamp: { type: Date, default: Date.now },
            userAgent: String,
            sessionId: String,
        },
        factors: [
            {
                name: String,
                category: {
                    type: String,
                    enum: ['device', 'network', 'resource', 'user', 'behavioral'],
                },
                status: {
                    type: String,
                    enum: ['pass', 'warn', 'fail'],
                },
                score: Number,
                weight: Number,
                impact: Number,
                details: String,
            },
        ],
        mfaRequired: {
            type: Boolean,
            default: false,
        },
        mfaVerified: {
            type: Boolean,
            default: false,
        },
        mfaMethod: String,
        mfaAttempts: {
            type: Number,
            default: 0,
        },
        mfaVerifiedAt: Date,
        accessGranted: {
            type: Boolean,
            default: false,
        },
        accessGrantedAt: Date,
        accessDeniedReason: String,
        sessionDuration: Number,
        completedAt: Date,
        riskFlags: [String],
        anomalyScore: Number,
        metadata: {
            scanDuration: Number,
            retryCount: { type: Number, default: 0 },
            policyVersion: String,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
ScanResultSchema.index({ scanId: 1 });
ScanResultSchema.index({ userId: 1, createdAt: -1 });
ScanResultSchema.index({ resourceId: 1, createdAt: -1 });
ScanResultSchema.index({ decision: 1, createdAt: -1 });
ScanResultSchema.index({ accessGranted: 1, createdAt: -1 });
ScanResultSchema.index({ 'context.ipAddress': 1 });
ScanResultSchema.index({ createdAt: -1 });
ScanResultSchema.index({ userId: 1, deviceId: 1, createdAt: -1 });

export const ScanResult = mongoose.model<IScanResult>('ScanResult', ScanResultSchema);
