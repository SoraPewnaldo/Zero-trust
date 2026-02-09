export type Decision = 'Allow' | 'MFA Required' | 'Blocked';

export interface ScanResult {
  id: string;
  userId: string;
  username: string;
  role: string;
  deviceId: string;
  trustScore: number;
  decision: Decision;
  timestamp: string;
}

// In-memory store for scan logs
const scanLogs: ScanResult[] = [
  {
    id: 'log-001', userId: 'usr-002', username: 'employee', role: 'employee',
    deviceId: 'DEV-A1F3', trustScore: 92, decision: 'Allow',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'log-002', userId: 'usr-003', username: 'alice', role: 'employee',
    deviceId: 'DEV-B2C4', trustScore: 58, decision: 'MFA Required',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'log-003', userId: 'usr-004', username: 'bob', role: 'employee',
    deviceId: 'DEV-C3D5', trustScore: 22, decision: 'Blocked',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
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
