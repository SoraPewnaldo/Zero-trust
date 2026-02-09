import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document {
    userId: mongoose.Types.ObjectId;
    deviceId: string;
    deviceType: 'managed' | 'personal';
    deviceName?: string;
    platform?: string;
    browser?: string;
    osVersion?: string;
    browserVersion?: string;
    isManaged: boolean;
    trustLevel: 'trusted' | 'unverified' | 'compromised';
    lastSeenAt: Date;
    firstSeenAt: Date;
    ipAddress?: string;
    userAgent?: string;
    deviceFingerprint?: {
        screenResolution?: string;
        timezone?: string;
        language?: string;
        plugins?: string[];
    };
    complianceStatus?: {
        antivirusEnabled?: boolean;
        diskEncrypted?: boolean;
        osUpToDate?: boolean;
        lastComplianceCheck?: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        deviceId: {
            type: String,
            required: true,
        },
        deviceType: {
            type: String,
            enum: ['managed', 'personal'],
            required: true,
        },
        deviceName: String,
        platform: String,
        browser: String,
        osVersion: String,
        browserVersion: String,
        isManaged: {
            type: Boolean,
            default: false,
        },
        trustLevel: {
            type: String,
            enum: ['trusted', 'unverified', 'compromised'],
            default: 'unverified',
        },
        lastSeenAt: {
            type: Date,
            default: Date.now,
        },
        firstSeenAt: {
            type: Date,
            default: Date.now,
        },
        ipAddress: String,
        userAgent: String,
        deviceFingerprint: {
            screenResolution: String,
            timezone: String,
            language: String,
            plugins: [String],
        },
        complianceStatus: {
            antivirusEnabled: Boolean,
            diskEncrypted: Boolean,
            osUpToDate: Boolean,
            lastComplianceCheck: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
DeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
DeviceSchema.index({ userId: 1, lastSeenAt: -1 });
DeviceSchema.index({ deviceType: 1, trustLevel: 1 });
DeviceSchema.index({ isManaged: 1 });

export const Device = mongoose.model<IDevice>('Device', DeviceSchema);
