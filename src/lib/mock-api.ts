export type Decision = 'Allow' | 'MFA Required' | 'Blocked';

export type ResourceType = 'Internal Dashboard' | 'Git Repository' | 'Production Console';

export type DeviceType = 'Managed' | 'Personal';
export type NetworkType = 'Corporate' | 'Home' | 'Public Wi-Fi';

export interface AccessContext {
  deviceType: DeviceType;
  networkType: NetworkType;
}

export interface DecisionFactor {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  impact: number; // -20 to +10
}

export interface DeviceInfo {
  os: string;
  browser: string;
  ip: string;
  location: string;
  lastSeen: string;
}

export interface ScanResult {
  id: string;
  userId: string;
  username: string;
  role: string;
  deviceId: string;
  trustScore: number;
  decision: Decision;
  timestamp: string;
  deviceInfo?: DeviceInfo;
  resource?: ResourceType;
  context?: AccessContext;
  factors?: DecisionFactor[];
  mfaVerified?: boolean;
}

export interface SecurityRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  resolved: boolean;
}

export interface UserSummary {
  userId: string;
  username: string;
  role: string;
  lastScan: string | null;
  lastScore: number | null;
  lastDecision: Decision | null;
  totalScans: number;
  avgScore: number;
  status: 'active' | 'blocked' | 'pending';
}

export interface DashboardStats {
  totalScans: number;
  avgScore: number;
  lastDecision: Decision | null;
  allowCount: number;
  mfaCount: number;
  blockedCount: number;
}

// Resource sensitivity thresholds — stricter for sensitive resources
const RESOURCE_THRESHOLDS: Record<ResourceType, { allow: number; mfa: number }> = {
  'Internal Dashboard': { allow: 60, mfa: 30 },
  'Git Repository': { allow: 70, mfa: 40 },
  'Production Console': { allow: 85, mfa: 55 },
};

// Simulated device info options
const osList = ['Windows 11', 'macOS Sonoma', 'Ubuntu 22.04', 'ChromeOS', 'iOS 17'];
const browserList = ['Chrome 121', 'Firefox 122', 'Safari 17.3', 'Edge 121', 'Brave 1.62'];
const locationList = ['New York, US', 'London, UK', 'Berlin, DE', 'Tokyo, JP', 'Sydney, AU'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDeviceInfo(): DeviceInfo {
  return {
    os: randomFrom(osList),
    browser: randomFrom(browserList),
    ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    location: randomFrom(locationList),
    lastSeen: new Date().toISOString(),
  };
}

function generateDeviceId(): string {
  const chars = 'ABCDEF0123456789';
  let id = 'DEV-';
  for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

/** Generate explainable decision factors based on context and score */
function generateFactors(baseScore: number, context?: AccessContext): { factors: DecisionFactor[]; adjustedScore: number } {
  let adjustment = 0;
  const factors: DecisionFactor[] = [];

  // Firewall status
  const firewallOk = Math.random() > 0.3;
  factors.push({
    name: 'FIREWALL STATUS',
    status: firewallOk ? 'pass' : 'fail',
    detail: firewallOk ? 'Host firewall active and configured' : 'Host firewall disabled or misconfigured',
    impact: firewallOk ? 5 : -15,
  });
  adjustment += firewallOk ? 5 : -15;

  // Endpoint protection
  const epOk = Math.random() > 0.25;
  factors.push({
    name: 'ENDPOINT PROTECTION',
    status: epOk ? 'pass' : 'warn',
    detail: epOk ? 'Endpoint agent running with latest signatures' : 'Endpoint protection agent outdated',
    impact: epOk ? 5 : -10,
  });
  adjustment += epOk ? 5 : -10;

  // OS patch level
  const patchOk = Math.random() > 0.35;
  factors.push({
    name: 'OS PATCH LEVEL',
    status: patchOk ? 'pass' : 'warn',
    detail: patchOk ? 'Operating system fully patched' : 'OS missing critical security patches',
    impact: patchOk ? 3 : -8,
  });
  adjustment += patchOk ? 3 : -8;

  // Disk encryption
  const diskOk = Math.random() > 0.3;
  factors.push({
    name: 'DISK ENCRYPTION',
    status: diskOk ? 'pass' : 'fail',
    detail: diskOk ? 'Full disk encryption enabled (BitLocker/FileVault)' : 'Disk encryption not detected',
    impact: diskOk ? 3 : -12,
  });
  adjustment += diskOk ? 3 : -12;

  // Context-aware factors
  if (context) {
    const managedDevice = context.deviceType === 'Managed';
    factors.push({
      name: 'DEVICE MANAGEMENT',
      status: managedDevice ? 'pass' : 'warn',
      detail: managedDevice ? 'Corporate-managed device with MDM enrolled' : 'Personal/unmanaged device detected',
      impact: managedDevice ? 5 : -10,
    });
    adjustment += managedDevice ? 5 : -10;

    const corporateNet = context.networkType === 'Corporate';
    const homeNet = context.networkType === 'Home';
    factors.push({
      name: 'NETWORK TRUST',
      status: corporateNet ? 'pass' : homeNet ? 'warn' : 'fail',
      detail: corporateNet ? 'Connected via corporate VPN / trusted network' : homeNet ? 'Home network — moderate trust' : 'Public Wi-Fi — untrusted network',
      impact: corporateNet ? 5 : homeNet ? -5 : -15,
    });
    adjustment += corporateNet ? 5 : homeNet ? -5 : -15;
  }

  // Clamp the adjusted score
  const adjustedScore = Math.max(0, Math.min(100, baseScore + adjustment));
  return { factors, adjustedScore };
}

function computeDecision(score: number, resource?: ResourceType): Decision {
  const thresholds = resource ? RESOURCE_THRESHOLDS[resource] : { allow: 70, mfa: 40 };
  if (score >= thresholds.allow) return 'Allow';
  if (score >= thresholds.mfa) return 'MFA Required';
  return 'Blocked';
}

// In-memory store for scan logs
const scanLogs: ScanResult[] = [
  {
    id: 'log-001', userId: 'usr-002', username: 'employee', role: 'employee',
    deviceId: 'DEV-A1F3', trustScore: 92, decision: 'Allow',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    deviceInfo: { os: 'Windows 11', browser: 'Chrome 121', ip: '192.168.1.45', location: 'New York, US', lastSeen: new Date(Date.now() - 3600000 * 5).toISOString() },
    resource: 'Internal Dashboard',
    context: { deviceType: 'Managed', networkType: 'Corporate' },
    factors: [
      { name: 'FIREWALL STATUS', status: 'pass', detail: 'Host firewall active', impact: 5 },
      { name: 'ENDPOINT PROTECTION', status: 'pass', detail: 'Endpoint agent running', impact: 5 },
      { name: 'DEVICE MANAGEMENT', status: 'pass', detail: 'Corporate-managed device', impact: 5 },
      { name: 'NETWORK TRUST', status: 'pass', detail: 'Corporate VPN connected', impact: 5 },
    ],
  },
  {
    id: 'log-002', userId: 'usr-003', username: 'alice', role: 'employee',
    deviceId: 'DEV-B2C4', trustScore: 58, decision: 'MFA Required',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    deviceInfo: { os: 'macOS Sonoma', browser: 'Safari 17.3', ip: '10.0.0.12', location: 'London, UK', lastSeen: new Date(Date.now() - 3600000 * 3).toISOString() },
    resource: 'Git Repository',
    context: { deviceType: 'Personal', networkType: 'Home' },
    factors: [
      { name: 'FIREWALL STATUS', status: 'pass', detail: 'Host firewall active', impact: 5 },
      { name: 'DEVICE MANAGEMENT', status: 'warn', detail: 'Personal device detected', impact: -10 },
      { name: 'NETWORK TRUST', status: 'warn', detail: 'Home network', impact: -5 },
    ],
  },
  {
    id: 'log-003', userId: 'usr-004', username: 'bob', role: 'employee',
    deviceId: 'DEV-C3D5', trustScore: 22, decision: 'Blocked',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    deviceInfo: { os: 'Ubuntu 22.04', browser: 'Firefox 122', ip: '172.16.0.88', location: 'Berlin, DE', lastSeen: new Date(Date.now() - 3600000 * 1).toISOString() },
    resource: 'Production Console',
    context: { deviceType: 'Personal', networkType: 'Public Wi-Fi' },
    factors: [
      { name: 'FIREWALL STATUS', status: 'fail', detail: 'Firewall disabled', impact: -15 },
      { name: 'DISK ENCRYPTION', status: 'fail', detail: 'No encryption detected', impact: -12 },
      { name: 'DEVICE MANAGEMENT', status: 'warn', detail: 'Personal device', impact: -10 },
      { name: 'NETWORK TRUST', status: 'fail', detail: 'Public Wi-Fi — untrusted', impact: -15 },
    ],
  },
  {
    id: 'log-004', userId: 'usr-005', username: 'charlie', role: 'admin',
    deviceId: 'DEV-D4E6', trustScore: 85, decision: 'Allow',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    deviceInfo: { os: 'macOS Sonoma', browser: 'Chrome 121', ip: '10.0.1.5', location: 'Tokyo, JP', lastSeen: new Date(Date.now() - 3600000 * 8).toISOString() },
    resource: 'Git Repository',
    context: { deviceType: 'Managed', networkType: 'Corporate' },
    factors: [
      { name: 'FIREWALL STATUS', status: 'pass', detail: 'Host firewall active', impact: 5 },
      { name: 'ENDPOINT PROTECTION', status: 'pass', detail: 'Agent running', impact: 5 },
      { name: 'DEVICE MANAGEMENT', status: 'pass', detail: 'Managed device', impact: 5 },
      { name: 'NETWORK TRUST', status: 'pass', detail: 'Corporate VPN', impact: 5 },
    ],
  },
  {
    id: 'log-005', userId: 'usr-003', username: 'alice', role: 'employee',
    deviceId: 'DEV-B2C4', trustScore: 45, decision: 'MFA Required',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    deviceInfo: { os: 'macOS Sonoma', browser: 'Safari 17.3', ip: '10.0.0.12', location: 'London, UK', lastSeen: new Date(Date.now() - 3600000 * 12).toISOString() },
    resource: 'Internal Dashboard',
    context: { deviceType: 'Personal', networkType: 'Home' },
    factors: [
      { name: 'DEVICE MANAGEMENT', status: 'warn', detail: 'Personal device', impact: -10 },
      { name: 'OS PATCH LEVEL', status: 'warn', detail: 'OS patches missing', impact: -8 },
    ],
  },
  {
    id: 'log-006', userId: 'usr-002', username: 'employee', role: 'employee',
    deviceId: 'DEV-A1F3', trustScore: 78, decision: 'Allow',
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    deviceInfo: { os: 'Windows 11', browser: 'Chrome 121', ip: '192.168.1.45', location: 'New York, US', lastSeen: new Date(Date.now() - 3600000 * 18).toISOString() },
    resource: 'Git Repository',
    context: { deviceType: 'Managed', networkType: 'Corporate' },
    factors: [
      { name: 'FIREWALL STATUS', status: 'pass', detail: 'Active', impact: 5 },
      { name: 'NETWORK TRUST', status: 'pass', detail: 'Corporate', impact: 5 },
    ],
  },
  {
    id: 'log-007', userId: 'usr-004', username: 'bob', role: 'employee',
    deviceId: 'DEV-C3D5', trustScore: 15, decision: 'Blocked',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    deviceInfo: { os: 'Ubuntu 22.04', browser: 'Firefox 122', ip: '172.16.0.88', location: 'Berlin, DE', lastSeen: new Date(Date.now() - 3600000 * 24).toISOString() },
    resource: 'Production Console',
    context: { deviceType: 'Personal', networkType: 'Public Wi-Fi' },
    factors: [
      { name: 'FIREWALL STATUS', status: 'fail', detail: 'Disabled', impact: -15 },
      { name: 'NETWORK TRUST', status: 'fail', detail: 'Public Wi-Fi', impact: -15 },
      { name: 'DISK ENCRYPTION', status: 'fail', detail: 'Not detected', impact: -12 },
    ],
  },
  {
    id: 'log-008', userId: 'usr-006', username: 'diana', role: 'employee',
    deviceId: 'DEV-E5F7', trustScore: 67, decision: 'MFA Required',
    timestamp: new Date(Date.now() - 3600000 * 30).toISOString(),
    deviceInfo: { os: 'ChromeOS', browser: 'Chrome 121', ip: '203.0.113.42', location: 'Sydney, AU', lastSeen: new Date(Date.now() - 3600000 * 30).toISOString() },
    resource: 'Git Repository',
    context: { deviceType: 'Managed', networkType: 'Home' },
    factors: [
      { name: 'ENDPOINT PROTECTION', status: 'warn', detail: 'Outdated signatures', impact: -10 },
      { name: 'NETWORK TRUST', status: 'warn', detail: 'Home network', impact: -5 },
    ],
  },
];

/** POST /scan — simulates a device trust scan with resource & context */
export async function postScan(
  userId: string,
  username: string,
  role: string,
  resource?: ResourceType,
  context?: AccessContext,
): Promise<ScanResult> {
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

  const baseScore = Math.floor(Math.random() * 101);
  const { factors, adjustedScore } = generateFactors(baseScore, context);
  const decision = computeDecision(adjustedScore, resource);

  const result: ScanResult = {
    id: `log-${String(scanLogs.length + 1).padStart(3, '0')}`,
    userId,
    username,
    role,
    deviceId: generateDeviceId(),
    trustScore: adjustedScore,
    decision,
    timestamp: new Date().toISOString(),
    deviceInfo: generateDeviceInfo(),
    resource,
    context,
    factors,
    mfaVerified: false,
  };
  scanLogs.unshift(result);
  return result;
}

/** POST /mfa-verify — simulates MFA verification step-up */
export async function verifyMfa(scanId: string): Promise<ScanResult> {
  await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

  const entry = scanLogs.find(l => l.id === scanId);
  if (!entry) throw new Error('Scan not found');

  entry.decision = 'Allow';
  entry.mfaVerified = true;
  return { ...entry };
}

/** GET /logs — returns all scan logs, optionally filtered */
export async function getLogs(filters?: {
  username?: string;
  role?: string;
  decision?: string;
  resource?: string;
}): Promise<ScanResult[]> {
  await new Promise(r => setTimeout(r, 400 + Math.random() * 400));

  let results = [...scanLogs];
  if (filters?.username) {
    results = results.filter(l => l.username.toLowerCase().includes(filters.username!.toLowerCase()));
  }
  if (filters?.role) {
    results = results.filter(l => l.role === filters.role);
  }
  if (filters?.decision) {
    results = results.filter(l => l.decision === filters.decision);
  }
  if (filters?.resource) {
    results = results.filter(l => l.resource === filters.resource);
  }
  return results;
}

/** GET /logs for a specific user */
export async function getUserLogs(userId: string): Promise<ScanResult[]> {
  await new Promise(r => setTimeout(r, 300));
  return scanLogs.filter(l => l.userId === userId);
}

/** GET /device-info — simulates current device info */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  await new Promise(r => setTimeout(r, 200));
  return generateDeviceInfo();
}

/** Auto-detect device and network context (simulated) */
export function detectContext(): AccessContext {
  // Simulate detection based on browser/environment heuristics
  const ua = navigator.userAgent.toLowerCase();
  const isManagedHint = ua.includes('windows') || ua.includes('mac');
  const deviceType: DeviceType = isManagedHint && Math.random() > 0.3 ? 'Managed' : 'Personal';

  // Simulate network detection
  const conn = (navigator as any).connection;
  let networkType: NetworkType = 'Corporate';
  if (conn?.type === 'wifi' || conn?.effectiveType) {
    networkType = Math.random() > 0.5 ? 'Home' : 'Public Wi-Fi';
  } else {
    networkType = Math.random() > 0.4 ? 'Corporate' : Math.random() > 0.5 ? 'Home' : 'Public Wi-Fi';
  }

  return { deviceType, networkType };
}

/** GET /stats for a specific user */
export async function getUserStats(userId: string): Promise<DashboardStats> {
  await new Promise(r => setTimeout(r, 300));
  const userLogs = scanLogs.filter(l => l.userId === userId);
  const totalScans = userLogs.length;
  const avgScore = totalScans > 0 ? Math.round(userLogs.reduce((s, l) => s + l.trustScore, 0) / totalScans) : 0;
  const lastDecision = userLogs.length > 0 ? userLogs[0].decision : null;
  return {
    totalScans,
    avgScore,
    lastDecision,
    allowCount: userLogs.filter(l => l.decision === 'Allow').length,
    mfaCount: userLogs.filter(l => l.decision === 'MFA Required').length,
    blockedCount: userLogs.filter(l => l.decision === 'Blocked').length,
  };
}

/** GET /stats for admin — org-wide */
export async function getOrgStats(): Promise<DashboardStats> {
  await new Promise(r => setTimeout(r, 300));
  const totalScans = scanLogs.length;
  const avgScore = totalScans > 0 ? Math.round(scanLogs.reduce((s, l) => s + l.trustScore, 0) / totalScans) : 0;
  const lastDecision = scanLogs.length > 0 ? scanLogs[0].decision : null;
  return {
    totalScans,
    avgScore,
    lastDecision,
    allowCount: scanLogs.filter(l => l.decision === 'Allow').length,
    mfaCount: scanLogs.filter(l => l.decision === 'MFA Required').length,
    blockedCount: scanLogs.filter(l => l.decision === 'Blocked').length,
  };
}

/** GET /recommendations based on latest scan */
export function getRecommendations(score: number, factors?: DecisionFactor[]): SecurityRecommendation[] {
  const recs: SecurityRecommendation[] = [];

  // Factor-based recommendations
  if (factors) {
    factors.forEach(f => {
      if (f.status === 'fail') {
        recs.push({
          id: `rec-factor-${f.name}`,
          title: `FIX: ${f.name}`,
          description: f.detail,
          priority: 'high',
          resolved: false,
        });
      } else if (f.status === 'warn') {
        recs.push({
          id: `rec-factor-${f.name}`,
          title: `REVIEW: ${f.name}`,
          description: f.detail,
          priority: 'medium',
          resolved: false,
        });
      }
    });
  }

  // Score-based fallback recommendations
  if (recs.length === 0) {
    if (score < 70) {
      recs.push({ id: 'rec-1', title: 'ENABLE MFA', description: 'Multi-factor authentication significantly improves trust score', priority: 'high', resolved: false });
    }
    if (score < 50) {
      recs.push({ id: 'rec-2', title: 'UPDATE OS', description: 'Your operating system may be outdated', priority: 'high', resolved: false });
    }
    if (score < 30) {
      recs.push({ id: 'rec-4', title: 'VERIFY NETWORK', description: 'Connection from untrusted network detected', priority: 'high', resolved: false });
    }
  }

  if (score >= 70 && recs.length === 0) {
    recs.push({ id: 'rec-6', title: 'ALL CHECKS PASSED', description: 'Device meets all security requirements', priority: 'low', resolved: true });
  }
  return recs;
}

/** GET /users — admin user management list */
export async function getUsers(): Promise<UserSummary[]> {
  await new Promise(r => setTimeout(r, 400));
  const userMap = new Map<string, ScanResult[]>();
  scanLogs.forEach(l => {
    if (!userMap.has(l.userId)) userMap.set(l.userId, []);
    userMap.get(l.userId)!.push(l);
  });

  const users: UserSummary[] = [];
  userMap.forEach((logs, userId) => {
    const sorted = logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latest = sorted[0];
    const totalScans = logs.length;
    const avgScore = Math.round(logs.reduce((s, l) => s + l.trustScore, 0) / totalScans);
    users.push({
      userId,
      username: latest.username,
      role: latest.role,
      lastScan: latest.timestamp,
      lastScore: latest.trustScore,
      lastDecision: latest.decision,
      totalScans,
      avgScore,
      status: latest.decision === 'Blocked' ? 'blocked' : avgScore >= 40 ? 'active' : 'pending',
    });
  });
  return users;
}

/** GET /threats — recent blocked or low-score attempts */
export async function getThreats(): Promise<ScanResult[]> {
  await new Promise(r => setTimeout(r, 300));
  return scanLogs.filter(l => l.decision === 'Blocked' || l.trustScore < 30).slice(0, 10);
}

/** GET /users/:id — full employee detail with all their logs, device info, recommendations */
export interface UserDetail {
  userId: string;
  username: string;
  role: string;
  email?: string;
  department?: string;
  status: 'active' | 'blocked' | 'pending';
  stats: DashboardStats;
  deviceInfo: DeviceInfo;
  logs: ScanResult[];
  recommendations: SecurityRecommendation[];
}

export async function getUserDetail(userId: string): Promise<UserDetail | null> {
  await new Promise(r => setTimeout(r, 400));
  const userLogs = scanLogs.filter(l => l.userId === userId).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  if (userLogs.length === 0) return null;
  const latest = userLogs[0];
  const totalScans = userLogs.length;
  const avgScore = Math.round(userLogs.reduce((s, l) => s + l.trustScore, 0) / totalScans);
  return {
    userId,
    username: latest.username,
    role: latest.role,
    status: latest.decision === 'Blocked' ? 'blocked' : avgScore >= 40 ? 'active' : 'pending',
    stats: {
      totalScans,
      avgScore,
      lastDecision: latest.decision,
      allowCount: userLogs.filter(l => l.decision === 'Allow').length,
      mfaCount: userLogs.filter(l => l.decision === 'MFA Required').length,
      blockedCount: userLogs.filter(l => l.decision === 'Blocked').length,
    },
    deviceInfo: latest.deviceInfo ?? generateDeviceInfo(),
    logs: userLogs,
    recommendations: getRecommendations(latest.trustScore, latest.factors),
  };
}
