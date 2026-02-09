import mongoose, { Schema, Document } from 'mongoose';

export interface IResource extends Document {
    resourceId: string;
    name: string;
    description?: string;
    resourceType: 'dashboard' | 'repository' | 'console' | 'api';
    environment: 'on-prem' | 'cloud' | 'hybrid';
    cloudProvider?: 'aws' | 'azure' | 'gcp';
    sensitivity: 'standard' | 'elevated' | 'critical';
    sensitivityScore: number;
    requiredTrustScore: number;
    mfaRequired: boolean;
    allowedRoles: string[];
    url?: string;
    tags?: string[];
    status: 'active' | 'maintenance' | 'deprecated';
    createdAt: Date;
    updatedAt: Date;
    metadata?: {
        owner?: string;
        dataClassification?: string;
        complianceRequirements?: string[];
    };
}

const ResourceSchema = new Schema<IResource>(
    {
        resourceId: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        description: String,
        resourceType: {
            type: String,
            enum: ['dashboard', 'repository', 'console', 'api'],
            required: true,
        },
        environment: {
            type: String,
            enum: ['on-prem', 'cloud', 'hybrid'],
            required: true,
        },
        cloudProvider: {
            type: String,
            enum: ['aws', 'azure', 'gcp'],
        },
        sensitivity: {
            type: String,
            enum: ['standard', 'elevated', 'critical'],
            required: true,
        },
        sensitivityScore: {
            type: Number,
            required: true,
            min: 1,
            max: 10,
        },
        requiredTrustScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        mfaRequired: {
            type: Boolean,
            default: false,
        },
        allowedRoles: {
            type: [String],
            default: ['employee', 'admin'],
        },
        url: String,
        tags: [String],
        status: {
            type: String,
            enum: ['active', 'maintenance', 'deprecated'],
            default: 'active',
        },
        metadata: {
            owner: String,
            dataClassification: String,
            complianceRequirements: [String],
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
ResourceSchema.index({ resourceId: 1 });
ResourceSchema.index({ sensitivity: 1, status: 1 });
ResourceSchema.index({ environment: 1 });
ResourceSchema.index({ allowedRoles: 1 });

export const Resource = mongoose.model<IResource>('Resource', ResourceSchema);
