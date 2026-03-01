import mongoose, { Schema } from 'mongoose';
const TrustPolicySchema = new Schema({
  policyId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  version: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'draft', 'archived'],
    default: 'draft'
  },
  thresholds: {
    allowThreshold: {
      type: Number,
      default: 70
    },
    mfaThreshold: {
      type: Number,
      default: 40
    },
    blockThreshold: {
      type: Number,
      default: 40
    }
  },
  factorWeights: {
    deviceTrust: {
      type: Number,
      default: 30
    },
    networkSecurity: {
      type: Number,
      default: 25
    },
    resourceSensitivity: {
      type: Number,
      default: 20
    },
    userBehavior: {
      type: Number,
      default: 15
    },
    timeContext: {
      type: Number,
      default: 10
    }
  },
  deviceScoring: {
    managed: {
      type: Number,
      default: 40
    },
    personal: {
      type: Number,
      default: 10
    },
    unverified: {
      type: Number,
      default: -20
    },
    compromised: {
      type: Number,
      default: -50
    }
  },
  networkScoring: {
    corporate: {
      type: Number,
      default: 30
    },
    home: {
      type: Number,
      default: 15
    },
    public: {
      type: Number,
      default: -10
    },
    vpn: {
      type: Number,
      default: 20
    }
  },
  resourceMultipliers: {
    standard: {
      type: Number,
      default: 1.0
    },
    elevated: {
      type: Number,
      default: 1.3
    },
    critical: {
      type: Number,
      default: 1.5
    }
  },
  behavioralRules: {
    newDevicePenalty: {
      type: Number,
      default: -15
    },
    unusualLocationPenalty: {
      type: Number,
      default: -10
    },
    offHoursPenalty: {
      type: Number,
      default: -5
    },
    rapidAccessPenalty: {
      type: Number,
      default: -10
    }
  },
  mfaRules: {
    alwaysRequireForCritical: {
      type: Boolean,
      default: true
    },
    requireForNewDevice: {
      type: Boolean,
      default: true
    },
    requireForUnusualLocation: {
      type: Boolean,
      default: false
    },
    requireAfterDays: {
      type: Number,
      default: 30
    }
  },
  appliesTo: {
    roles: {
      type: [String],
      default: ['employee', 'admin']
    },
    resources: [{
      type: Schema.Types.ObjectId,
      ref: 'Resource'
    }],
    departments: [String]
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  effectiveFrom: Date,
  effectiveUntil: Date
}, {
  timestamps: true
});

// Indexes
TrustPolicySchema.index({
  policyId: 1
});
TrustPolicySchema.index({
  status: 1,
  effectiveFrom: 1
});
TrustPolicySchema.index({
  version: -1
});
export const TrustPolicy = mongoose.model('TrustPolicy', TrustPolicySchema);