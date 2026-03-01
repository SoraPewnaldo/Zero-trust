export type Decision = 'allow' | 'mfa_required' | 'blocked' | 'Allow' | 'MFA Required' | 'Blocked';

export interface AccessContext {
    deviceType: string;
    networkType: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp?: string | Date;
}

export interface DecisionFactor {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    detail: string;
    impact: number;
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
    decision: string;
    timestamp: string;
    deviceInfo?: DeviceInfo;
    resource?: string;
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
    lastDecision: string | null;
    totalScans: number;
    avgScore: number;
    status: 'active' | 'blocked' | 'pending';
}

export interface DashboardStats {
    totalScans: number;
    avgScore: number;
    lastDecision: string | null;
    allowCount: number;
    mfaCount: number;
    blockedCount: number;
}

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
