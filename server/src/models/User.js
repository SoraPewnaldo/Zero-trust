import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['employee', 'admin', 'super_admin', 'security_analyst', 'resource_manager'],
    required: true,
    default: 'employee'
  },
  firstName: String,
  lastName: String,
  department: String,
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active'
  },
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  mfaSecret: String,
  mfaBackupCodes: [String],
  lastLoginAt: Date,
  metadata: {
    employeeId: String,
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    location: String
  }
}, {
  timestamps: true
});

// Composite and sort indexes (unique indexes are auto-created by schema above)
UserSchema.index({
  role: 1,
  status: 1
});
UserSchema.index({
  createdAt: -1
});
export const User = mongoose.model('User', UserSchema);