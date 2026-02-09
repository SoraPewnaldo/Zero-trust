export type Decision = 'Allow' | 'MFA Required' | 'Blocked';

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

// In-memory store for scan logs
const scanLogs: ScanResult[] = [
  {
    id: 'log-001', userId: 'usr-002', username: 'employee', role: 'employee',
    deviceId: 'DEV-A1F3', trustScore: 92, decision: 'Allow',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    deviceInfo: { os: 'Windows 11', browser: 'Chrome 121', ip: '192.168.1.45', location: 'New York, US', lastSeen: new Date(Date.now() - 3600000 * 5).toISOString() },
  },
  {
    id: 'log-002', userId: 'usr-003', username: 'alice', role: 'employee',
    deviceId: 'DEV-B2C4', trustScore: 58, decision: 'MFA Required',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    deviceInfo: { os: 'macOS Sonoma', browser: 'Safari 17.3', ip: '10.0.0.12', location: 'London, UK', lastSeen: new Date(Date.now() - 3600000 * 3).toISOString() },
  },
  {
    id: 'log-003', userId: 'usr-004', username: 'bob', role: 'employee',
    deviceId: 'DEV-C3D5', trustScore: 22, decision: 'Blocked',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    deviceInfo: { os: 'Ubuntu 22.04', browser: 'Firefox 122', ip: '172.16.0.88', location: 'Berlin, DE', lastSeen: new Date(Date.now() - 3600000 * 1).toISOString() },
  },
  {
    id: 'log-004', userId: 'usr-005', username: 'charlie', role: 'admin',
    deviceId: 'DEV-D4E6', trustScore: 85, decision: 'Allow',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    deviceInfo: { os: 'macOS Sonoma', browser: 'Chrome 121', ip: '10.0.1.5', location: 'Tokyo, JP', lastSeen: new Date(Date.now() - 3600000 * 8).toISOString() },
  },
  {
    id: 'log-005', userId: 'usr-003', username: 'alice', role: 'employee',
    deviceId: 'DEV-B2C4', trustScore: 45, decision: 'MFA Required',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    deviceInfo: { os: 'macOS Sonoma', browser: 'Safari 17.3', ip: '10.0.0.12', location: 'London, UK', lastSeen: new Date(Date.now() - 3600000 * 12).toISOString() },
  },
  {
    id: 'log-006', userId: 'usr-002', username: 'employee', role: 'employee',
    deviceId: 'DEV-A1F3', trustScore: 78, decision: 'Allow',
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    deviceInfo: { os: 'Windows 11', browser: 'Chrome 121', ip: '192.168.1.45', location: 'New York, US', lastSeen: new Date(Date.now() - 3600000 * 18).toISOString() },
  },
  {
    id: 'log-007', userId: 'usr-004', username: 'bob', role: 'employee',
    deviceId: 'DEV-C3D5', trustScore: 15, decision: 'Blocked',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    deviceInfo: { os: 'Ubuntu 22.04', browser: 'Firefox 122', ip: '172.16.0.88', location: 'Berlin, DE', lastSeen: new Date(Date.now() - 3600000 * 24).toISOString() },
  },
  {
    id: 'log-008', userId: 'usr-006', username: 'diana', role: 'employee',
    deviceId: 'DEV-E5F7', trustScore: 67, decision: 'MFA Required',
    timestamp: new Date(Date.now() - 3600000 * 30).toISOString(),
    deviceInfo: { os: 'ChromeOS', browser: 'Chrome 121', ip: '203.0.113.42', location: 'Sydney, AU', lastSeen: new Date(Date.now() - 3600000 * 30).toISOString() },
  },
];

function generateDeviceId(): string {
  const chars = 'ABCDEF0123456789';
  let id = 'DEV-';
  for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function computeDecision(score: number): Decision {
  if (score >= 70) return 'Allow';
  if (score >= 40) return 'MFA Required';
  return 'Blocked';
}

/** POST /scan — simulates a device trust scan */
export async function postScan(userId: string, username: string, role: string): Promise<ScanResult> {
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

  const trustScore = Math.floor(Math.random() * 101);
  const result: ScanResult = {
    id: `log-${String(scanLogs.length + 1).padStart(3, '0')}`,
    userId,
    username,
    role,
    deviceId: generateDeviceId(),
    trustScore,
    decision: computeDecision(trustScore),
    timestamp: new Date().toISOString(),
    deviceInfo: generateDeviceInfo(),
  };
  scanLogs.unshift(result);
  return result;
}

/** GET /logs — returns all scan logs, optionally filtered */
export async function getLogs(filters?: {
  username?: string;
  role?: string;
  decision?: string;
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
export function getRecommendations(score: number): SecurityRecommendation[] {
  const recs: SecurityRecommendation[] = [];
  if (score < 70) {
    recs.push({ id: 'rec-1', title: 'ENABLE MFA', description: 'Multi-factor authentication significantly improves trust score', priority: 'high', resolved: false });
  }
  if (score < 50) {
    recs.push({ id: 'rec-2', title: 'UPDATE OS', description: 'Your operating system may be outdated — update to latest version', priority: 'high', resolved: false });
    recs.push({ id: 'rec-3', title: 'INSTALL ENDPOINT PROTECTION', description: 'No endpoint protection agent detected on device', priority: 'medium', resolved: false });
  }
  if (score < 30) {
    recs.push({ id: 'rec-4', title: 'VERIFY NETWORK', description: 'Connection from untrusted network detected', priority: 'high', resolved: false });
    recs.push({ id: 'rec-5', title: 'DISK ENCRYPTION', description: 'Enable full disk encryption to protect data at rest', priority: 'medium', resolved: false });
  }
  if (score >= 70) {
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
