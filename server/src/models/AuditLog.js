import mongoose, { Schema } from 'mongoose';
const AuditLogSchema = new Schema({
  eventId: {
    type: String,
    required: true,
    unique: true
  },
  eventType: {
    type: String,
    required: true
  },
  eventCategory: {
    type: String,
    enum: ['authentication', 'authorization', 'administration', 'security'],
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info'
  },
  actor: {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    role: String,
    ipAddress: String
  },
  target: {
    type: {
      type: String
    },
    id: Schema.Types.ObjectId,
    name: String
  },
  action: {
    type: String,
    required: true
  },
  result: {
    type: String,
    enum: ['success', 'failure'],
    required: true
  },
  details: Schema.Types.Mixed,
  context: {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Device'
    },
    sessionId: String,
    scanId: String,
    ipAddress: String,
    userAgent: String,
    geolocation: Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  complianceFlags: [String],
  retentionUntil: Date
}, {
  timestamps: true
});

// Indexes
AuditLogSchema.index({
  eventId: 1
});
AuditLogSchema.index({
  eventType: 1,
  timestamp: -1
});
AuditLogSchema.index({
  'actor.userId': 1,
  timestamp: -1
});
AuditLogSchema.index({
  'target.id': 1,
  timestamp: -1
});
AuditLogSchema.index({
  severity: 1,
  timestamp: -1
});
AuditLogSchema.index({
  timestamp: -1
});
AuditLogSchema.index({
  retentionUntil: 1
});
export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);