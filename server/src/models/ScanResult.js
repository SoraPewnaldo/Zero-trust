import mongoose, { Schema } from 'mongoose';
const ScanResultSchema = new Schema({
  scanId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  resourceId: {
    type: Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },
  trustScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  decision: {
    type: String,
    enum: ['allow', 'mfa_required', 'blocked'],
    required: true
  },
  decisionReason: String,
  context: {
    deviceType: {
      type: String,
      required: true
    },
    networkType: {
      type: String,
      required: true
    },
    ipAddress: String,
    geolocation: {
      country: String,
      city: String,
      latitude: Number,
      longitude: Number
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    userAgent: String,
    sessionId: String
  },
  factors: [{
    name: String,
    category: {
      type: String,
      enum: ['device', 'network', 'resource', 'user', 'behavioral']
    },
    status: {
      type: String,
      enum: ['pass', 'warn', 'fail']
    },
    score: Number,
    weight: Number,
    impact: Number,
    details: String
  }],
  mfaRequired: {
    type: Boolean,
    default: false
  },
  mfaVerified: {
    type: Boolean,
    default: false
  },
  mfaMethod: String,
  mfaAttempts: {
    type: Number,
    default: 0
  },
  mfaVerifiedAt: Date,
  accessGranted: {
    type: Boolean,
    default: false
  },
  accessGrantedAt: Date,
  accessDeniedReason: String,
  sessionDuration: Number,
  completedAt: Date,
  riskFlags: [String],
  anomalyScore: Number,
  metadata: {
    scanDuration: Number,
    retryCount: {
      type: Number,
      default: 0
    },
    policyVersion: String
  }
}, {
  timestamps: true
});

// Composite indexes (scanId unique index auto-created by schema above)
ScanResultSchema.index({
  userId: 1,
  createdAt: -1
});
ScanResultSchema.index({
  resourceId: 1,
  createdAt: -1
});
ScanResultSchema.index({
  decision: 1,
  createdAt: -1
});
ScanResultSchema.index({
  accessGranted: 1,
  createdAt: -1
});
ScanResultSchema.index({
  'context.ipAddress': 1
});
ScanResultSchema.index({
  createdAt: -1
});
ScanResultSchema.index({
  userId: 1,
  deviceId: 1,
  createdAt: -1
});
export const ScanResult = mongoose.model('ScanResult', ScanResultSchema);