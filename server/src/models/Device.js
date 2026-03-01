import mongoose, { Schema } from 'mongoose';
const DeviceSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  deviceType: {
    type: String,
    enum: ['managed', 'personal'],
    required: true
  },
  deviceName: String,
  platform: String,
  browser: String,
  osVersion: String,
  browserVersion: String,
  isManaged: {
    type: Boolean,
    default: false
  },
  trustLevel: {
    type: String,
    enum: ['trusted', 'unverified', 'compromised'],
    default: 'unverified'
  },
  lastSeenAt: {
    type: Date,
    default: Date.now
  },
  firstSeenAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: String,
  userAgent: String,
  deviceFingerprint: {
    screenResolution: String,
    timezone: String,
    language: String,
    plugins: [String]
  },
  complianceStatus: {
    antivirusEnabled: Boolean,
    diskEncrypted: Boolean,
    osUpToDate: Boolean,
    lastComplianceCheck: Date
  }
}, {
  timestamps: true
});

// Indexes
DeviceSchema.index({
  userId: 1,
  deviceId: 1
}, {
  unique: true
});
DeviceSchema.index({
  userId: 1,
  lastSeenAt: -1
});
DeviceSchema.index({
  deviceType: 1,
  trustLevel: 1
});
DeviceSchema.index({
  isManaged: 1
});
export const Device = mongoose.model('Device', DeviceSchema);