import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    passwordHash: string;
    role: 'employee' | 'admin';
    firstName?: string;
    lastName?: string;
    department?: string;
    status: 'active' | 'suspended' | 'inactive';
    mfaEnabled: boolean;
    mfaSecret?: string;
    mfaBackupCodes?: string[];
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    metadata?: {
        employeeId?: string;
        manager?: mongoose.Types.ObjectId;
        location?: string;
    };
}

const UserSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['employee', 'admin'],
            required: true,
            default: 'employee',
        },
        firstName: String,
        lastName: String,
        department: String,
        status: {
            type: String,
            enum: ['active', 'suspended', 'inactive'],
            default: 'active',
        },
        mfaEnabled: {
            type: Boolean,
            default: false,
        },
        mfaSecret: String,
        mfaBackupCodes: [String],
        lastLoginAt: Date,
        metadata: {
            employeeId: String,
            manager: { type: Schema.Types.ObjectId, ref: 'User' },
            location: String,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ createdAt: -1 });

export const User = mongoose.model<IUser>('User', UserSchema);
