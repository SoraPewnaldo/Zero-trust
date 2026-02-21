import { useState, useEffect } from 'react';
import { ScanResult, DashboardStats, UserSummary, UserDetail } from '@/lib/types';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import EmployeeForm from '@/components/admin/EmployeeForm';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Shield, Users, AlertTriangle, Activity, CheckCircle, XCircle, ArrowLeft, Monitor, Globe, Cpu, Clock, Plus, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const [logs, setLogs] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDecision, setFilterDecision] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [threats, setThreats] = useState<ScanResult[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'users' | 'analytics'>('logs');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; userId: string | null }>({ show: false, userId: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsResponse, statsResponse, usersResponse] = await Promise.all([
        api.admin.getScanLogs({
          limit: 100,
          decision: filterDecision ? filterDecision.toLowerCase() : undefined,
          role: filterRole ? filterRole.toLowerCase() : undefined,
          resource: filterResource ? filterResource.toLowerCase() : undefined,
          username: filterUser ? filterUser : undefined
        }).catch(err => {
          console.error('Failed to fetch scan logs', err);
          return { scans: [], pagination: { total: 0 } };
        }),
        api.admin.getDashboardStats().catch(err => {
          console.error('Failed to fetch dashboard stats', err);
          return { totalScans: 0, avgTrustScore: 0, allowedScans: 0, mfaRequiredScans: 0, blockedScans: 0 };
        }),
        api.admin.getUsers().catch(err => {
          console.error('Failed to fetch users', err);
          return { users: [] };
        })
      ]);

      const usersList = usersResponse?.users || [];

      // Map backend logs to frontend ScanResult interface
      const realLogs: ScanResult[] = logsResponse.scans.map((scan: {
        _id: string;
        userId?: { _id: string; username: string; role: string } | string;
        username?: string;
        role?: string;
        deviceId?: { deviceName: string } | string;
        trustScore: number;
        decision: string;
        createdAt: string;
        timestamp: string;
        context: {
          ipAddress?: string;
          geolocation?: { city?: string };
          deviceType: string;
          networkType: string;
        };
        factors: Array<{ details?: string; detail?: string }>;
        mfaVerified: boolean;
        resourceId?: { name: string };
        resource?: string;
      }) => ({
        id: scan._id,
        userId: (typeof scan.userId === 'object' && scan.userId ? scan.userId._id : scan.userId?.toString()) || 'unknown',
        username: (typeof scan.userId === 'object' && scan.userId ? scan.userId.username : scan.username) || 'Unknown',
        role: (typeof scan.userId === 'object' && scan.userId ? scan.userId.role : scan.role) || 'unknown',
        deviceId: (typeof scan.deviceId === 'object' && scan.deviceId ? scan.deviceId.deviceName : scan.deviceId?.toString()) || 'Unknown',
        trustScore: scan.trustScore,
        decision: scan.decision,
        timestamp: scan.createdAt || scan.timestamp,
        deviceInfo: {
          os: 'Unknown', // Map if available
          browser: 'Unknown', // Map if available
          ip: scan.context?.ipAddress || 'Unknown',
          location: scan.context?.geolocation?.city || 'Unknown',
          lastSeen: scan.createdAt
        },
        resource: scan.resourceId?.name || scan.resource || 'Unknown',
        context: scan.context,
        factors: (scan.factors || []).map((f) => ({
          ...f,
          detail: f.details || f.detail
        })),
        mfaVerified: scan.mfaVerified
      }));

      // Applying active filters to the real-time activity log
      let filteredLogs = realLogs;
      if (filterUser) filteredLogs = filteredLogs.filter(l => l.username.toLowerCase().includes(filterUser.toLowerCase()));
      if (filterRole) filteredLogs = filteredLogs.filter(l => l.role === filterRole);
      if (filterDecision) filteredLogs = filteredLogs.filter(l => l.decision === filterDecision);
      if (filterResource) filteredLogs = filteredLogs.filter(l => l.resource === filterResource);

      setLogs(filteredLogs);

      // Map backend stats to DashboardStats
      setStats({
        totalScans: statsResponse.totalScans,
        avgScore: statsResponse.avgTrustScore,
        lastDecision: null, // Not provided by stats endpoint
        allowCount: statsResponse.allowedScans,
        mfaCount: statsResponse.mfaRequiredScans,
        blockedCount: statsResponse.blockedScans
      });

      // Map users (handled by existing logic mostly, but ensured)
      // The users state expects UserSummary[], api.admin.getUsers returns { users: [...] }
      const realUsers = usersList.map((u: {
        _id: string;
        username: string;
        role: string;
        lastLoginAt: string;
        status: 'active' | 'blocked' | 'pending';
      }) => ({
        userId: u._id,
        username: u.username,
        role: u.role,
        lastScan: u.lastLoginAt, // Approx
        lastScore: 0, // Would need scan aggregation
        lastDecision: null,
        totalScans: 0, // Would need scan aggregation
        avgScore: 0,
        status: u.status
      }));

      // Using live user data registry provided by the system API. 
      // Note: User-specific metrics are derived from real-time verification logs.
      // To keep it simple and working:
      setUsers(realUsers);

      // Generate threats from real logs (e.g. blocked or low score)
      const realThreats = realLogs.filter(l => l.decision === 'Blocked' || l.trustScore < 40).slice(0, 10);
      setThreats(realThreats);

    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterUser, filterRole, filterDecision, filterResource]);

  const handleViewUser = async (userId: string) => {
    setLoadingUser(true);
    try {
      // Try real API first
      const data = await api.admin.getUserDetail(userId);

      // Map API response to UserDetail interface
      const userDetail: UserDetail = {
        userId: data.user._id,
        username: data.user.username,
        role: data.user.role,
        status: data.user.status,
        email: data.user.email,
        department: data.user.department,
        stats: {
          totalScans: data.stats.totalScans,
          avgScore: data.stats.avgTrustScore,
          allowCount: data.stats.allowedScans,
          mfaCount: data.stats.mfaCount,
          blockedCount: data.stats.blockedScans,
          lastDecision: data.stats.lastDecision
        },
        deviceInfo: data.devices[0] ? {
          os: data.devices[0].platform || 'Unknown',
          browser: data.devices[0].browser || 'Unknown',
          ip: data.devices[0].ipAddress || 'Unknown',
          location: 'Unknown', // Backend doesn't have location yet
          lastSeen: data.devices[0].lastSeenAt
        } : {
          os: 'Unknown',
          browser: 'Unknown',
          ip: 'Unknown',
          location: 'Unknown',
          lastSeen: new Date().toISOString()
        },
        recommendations: data.recommendations,
        logs: data.scans.map((scan: {
          factors?: Array<{ details?: string; detail?: string }>;
          deviceId?: { deviceName: string } | string;
          context?: { ipAddress?: string; geolocation?: { city?: string } };
          userId?: { _id: string; username: string; role: string } | string;
          resourceId?: { name: string };
          resource?: string;
          trustScore: number;
          decision: string;
          createdAt: string;
          timestamp: string;
          mfaVerified: boolean;
        }) => ({
          id: (scan as { _id?: string })._id || 'unknown',
          userId: (typeof scan.userId === 'object' && scan.userId && '_id' in scan.userId ? (scan.userId as { _id: string })._id : (typeof scan.userId === 'string' ? scan.userId : 'unknown')),
          username: (typeof scan.userId === 'object' && scan.userId && 'username' in scan.userId ? (scan.userId as { username: string }).username : ((scan as { username?: string }).username || 'Unknown')),
          role: (typeof scan.userId === 'object' && scan.userId && 'role' in scan.userId ? (scan.userId as { role: string }).role : ((scan as { role?: string }).role || 'unknown')),
          deviceId: (typeof scan.deviceId === 'object' && scan.deviceId && 'deviceName' in scan.deviceId ? (scan.deviceId as { deviceName: string }).deviceName : (typeof scan.deviceId === 'string' ? scan.deviceId : 'Unknown')),
          trustScore: scan.trustScore,
          decision: scan.decision,
          timestamp: scan.createdAt || scan.timestamp,
          deviceInfo: {
            os: 'Unknown',
            browser: 'Unknown',
            ip: scan.context?.ipAddress || 'Unknown',
            location: scan.context?.geolocation?.city || 'Unknown',
            lastSeen: scan.createdAt
          },
          resource: scan.resourceId?.name || scan.resource || 'Unknown',
          context: scan.context,
          mfaVerified: scan.mfaVerified,
          factors: (scan.factors || []).map((f) => ({
            ...f,
            detail: f.details || f.detail
          }))
        }))
      };

      setSelectedUser(userDetail);
    } catch (e) {
      console.warn('Failed to get user detail from real API', e);
      alert('Failed to load user details');
    }
    setLoadingUser(false);
  };

  const handleDeleteUser = async (userId: string) => {
    setConfirmDelete({ show: true, userId });
  };

  const confirmDeleteUser = async () => {
    if (!confirmDelete.userId) return;

    try {
      await api.admin.deleteUser(confirmDelete.userId);
      setConfirmDelete({ show: false, userId: null });
      // Refresh list
      fetchData();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  const decisionStyle = (d: string) => {
    const lowerD = d.toLowerCase();
    if (lowerD === 'allow') return 'text-green-400 border-green-500/30 bg-green-500/10';
    if (lowerD === 'mfa_required' || lowerD === 'mfa required') return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    if (lowerD === 'blocked') return 'text-red-400 border-red-500/30 bg-red-500/10 font-bold';
    return 'text-white/40 border-white/20 bg-white/5';
  };

  const statusStyle = (s: string) => {
    const lowerS = s.toLowerCase();
    if (lowerS === 'active') return 'text-green-400 border-green-500/30 bg-green-500/5';
    if (lowerS === 'pending') return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5';
    if (lowerS === 'blocked') return 'text-red-400 border-red-500/30 bg-red-500/5';
    return 'text-white/50 border-white/20 bg-white/5';
  };

  const factorStatusStyle = (s: string) => {
    const lowerS = s.toLowerCase();
    if (lowerS === 'pass') return 'text-green-400/80 border-green-500/20 bg-green-500/5';
    if (lowerS === 'warn') return 'text-yellow-400/80 border-yellow-500/20 bg-yellow-500/5';
    if (lowerS === 'fail') return 'text-red-400/80 border-red-500/20 bg-red-500/5';
    return 'text-white/50 bg-white/5';
  };

  // Chart data
  const decisionChartData = stats ? [
    { name: 'ALLOW', value: stats.allowCount },
    { name: 'MFA', value: stats.mfaCount },
    { name: 'BLOCKED', value: stats.blockedCount },
  ] : [];

  const scoreDistribution = (() => {
    const buckets = [
      { range: '0-20', count: 0 },
      { range: '21-40', count: 0 },
      { range: '41-60', count: 0 },
      { range: '61-80', count: 0 },
      { range: '81-100', count: 0 },
    ];
    logs.forEach(l => {
      if (l.trustScore <= 20) buckets[0].count++;
      else if (l.trustScore <= 40) buckets[1].count++;
      else if (l.trustScore <= 60) buckets[2].count++;
      else if (l.trustScore <= 80) buckets[3].count++;
      else buckets[4].count++;
    });
    return buckets;
  })();

  const COLORS = ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.25)'];

  return (
    <DashboardLayout title="ADMIN DASHBOARD" subtitle="ORGANIZATION ACCESS MANAGEMENT">
      {/* Summary Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="border border-white/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} className="text-white/50" />
              <span className="text-[10px] font-mono text-white/50 tracking-wider">TOTAL SCANS</span>
            </div>
            <div className="text-2xl font-mono text-white font-bold">{stats.totalScans}</div>
          </div>
          <div className="border border-white/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} className="text-white/50" />
              <span className="text-[10px] font-mono text-white/50 tracking-wider">AVG SCORE</span>
            </div>
            <div className="text-2xl font-mono text-white font-bold">{stats.avgScore}</div>
          </div>
          <div className="border border-white/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-white/50" />
              <span className="text-[10px] font-mono text-white/50 tracking-wider">USERS</span>
            </div>
            <div className="text-2xl font-mono text-white font-bold">{users.length}</div>
          </div>
          <div className="border border-white/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={14} className="text-white/50" />
              <span className="text-[10px] font-mono text-white/50 tracking-wider">ALLOWED</span>
            </div>
            <div className="text-2xl font-mono text-white font-bold">{stats.allowCount}</div>
          </div>
          <div className="border border-white/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} className="text-white/50" />
              <span className="text-[10px] font-mono text-white/50 tracking-wider">MFA REQ</span>
            </div>
            <div className="text-2xl font-mono text-white font-bold">{stats.mfaCount}</div>
          </div>
          <div className="border border-white/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={14} className="text-white/50" />
              <span className="text-[10px] font-mono text-white/50 tracking-wider">BLOCKED</span>
            </div>
            <div className="text-2xl font-mono text-white font-bold">{stats.blockedCount}</div>
          </div>
        </div>
      )}

      {/* Threat Alerts */}
      {threats.length > 0 && (
        <div className="border border-white/20 p-4 lg:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-px bg-white/40"></div>
            <AlertTriangle size={12} className="text-white/60" />
            <span className="text-[10px] font-mono text-white/50 tracking-wider">THREAT ALERTS</span>
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-[10px] font-mono text-white/30">{threats.length} ALERTS</span>
          </div>

          <div className="space-y-2">
            {threats.slice(0, 4).map(t => (
              <div key={t.id} className="flex items-center gap-4 p-3 border border-white/10">
                <XCircle size={14} className="text-white/50 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="text-white/80">{t.username.toUpperCase()}</span>
                    <span className="text-white/30">•</span>
                    <span className="text-white/50">{t.deviceId}</span>
                    <span className="text-white/30">•</span>
                    <span className="text-white/50">SCORE: {t.trustScore}</span>
                    {t.resource && (
                      <>
                        <span className="text-white/30">•</span>
                        <span className="text-white/50">{t.resource.toUpperCase()}</span>
                      </>
                    )}
                    {t.context && (
                      <>
                        <span className="text-white/30">•</span>
                        <span className="text-white/40">{t.context.networkType}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-mono border border-white/15 ${decisionStyle(t.decision)}`}>
                  {t.decision.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono text-white/30 hidden lg:block">{new Date(t.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-0 mb-6 border-b border-white/20">
        {(['logs', 'users', 'analytics'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-[10px] font-mono tracking-wider transition-all duration-200 border-b-2 ${activeTab === tab
              ? 'text-white border-white'
              : 'text-white/40 border-transparent hover:text-white/60'
              }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Access Logs Tab */}
      {activeTab === 'logs' && (
        <>
          {/* Filters */}
          <div className="border border-white/20 p-4 lg:p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-px bg-white/40"></div>
              <span className="text-[10px] font-mono text-white/50 tracking-wider">FILTERS</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-mono text-white/40 mb-1 tracking-wider">USERNAME</label>
                <input
                  type="text"
                  value={filterUser}
                  onChange={e => setFilterUser(e.target.value)}
                  className="w-full bg-transparent border border-white/20 text-white font-mono text-xs px-3 py-2 focus:outline-none focus:border-white/50 transition-colors placeholder:text-white/15"
                  placeholder="filter by user"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-white/40 mb-1 tracking-wider">ROLE</label>
                <select
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                  className="w-full bg-black border border-white/20 text-white font-mono text-xs px-3 py-2 focus:outline-none focus:border-white/50"
                >
                  <option value="">ALL</option>
                  <option value="employee">EMPLOYEE</option>
                  <option value="admin">ADMIN</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-white/40 mb-1 tracking-wider">DECISION</label>
                <select
                  value={filterDecision}
                  onChange={e => setFilterDecision(e.target.value)}
                  className="w-full bg-black border border-white/20 text-white font-mono text-xs px-3 py-2 focus:outline-none focus:border-white/50"
                >
                  <option value="">ALL</option>
                  <option value="allow">ALLOW</option>
                  <option value="mfa_required">MFA REQUIRED</option>
                  <option value="blocked">BLOCKED</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-white/40 mb-1 tracking-wider">RESOURCE</label>
                <select
                  value={filterResource}
                  onChange={e => setFilterResource(e.target.value)}
                  className="w-full bg-black border border-white/20 text-white font-mono text-xs px-3 py-2 focus:outline-none focus:border-white/50"
                >
                  <option value="">ALL</option>
                  <option value="Internal Web Dashboard">INTERNAL DASHBOARD</option>
                  <option value="Git Repository">GIT REPOSITORY</option>
                  <option value="Production Cloud Console">PRODUCTION CONSOLE</option>
                  <option value="HR Portal">HR PORTAL</option>
                  <option value="Authentication">AUTHENTICATION</option>
                  <option value="User Management">USER MGMT</option>
                </select>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="border border-white/20 p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-px bg-white/40"></div>
              <span className="text-[10px] font-mono text-white/50 tracking-wider">CENTRAL AUDIT LOG</span>
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-[10px] font-mono text-white/30">{logs.length} RECORDS</span>
            </div>

            {loading ? (
              <div className="text-xs font-mono text-white/40 animate-pulse">LOADING RECORDS...</div>
            ) : logs.length === 0 ? (
              <div className="text-xs font-mono text-white/30">NO RECORDS MATCH FILTERS</div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="overflow-x-auto hidden md:block">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">TIMESTAMP</th>
                        <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">USER</th>
                        <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">RESOURCE</th>
                        <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">DEVICE</th>
                        <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">CONTEXT</th>
                        <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">SCORE</th>
                        <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">DECISION</th>
                        <th className="text-[10px] font-mono text-white/50 tracking-wider py-2">DETAILS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(entry => (
                        <>
                          <tr key={entry.id} className="border-b border-white/5">
                            <td className="text-xs font-mono text-white/60 py-2 pr-4 whitespace-nowrap">{new Date(entry.timestamp).toLocaleString()}</td>
                            <td className="text-xs font-mono text-white/80 py-2 pr-4">{entry.username}</td>
                            <td className="text-xs font-mono text-white/60 py-2 pr-4">{entry.resource ?? '—'}</td>
                            <td className="text-xs font-mono text-white/60 py-2 pr-4">{entry.deviceId}</td>
                            <td className="text-xs font-mono text-white/40 py-2 pr-4 whitespace-nowrap">
                              {entry.context ? `${entry.context.deviceType} / ${entry.context.networkType}` : '—'}
                            </td>
                            <td className="text-xs font-mono text-white/80 py-2 pr-4">{entry.trustScore}</td>
                            <td className="py-2 pr-4">
                              <span className={`px-2 py-0.5 text-[10px] font-mono border ${decisionStyle(entry.decision)}`}>
                                {entry.decision.toUpperCase()}
                                {entry.mfaVerified && ' ✓'}
                              </span>
                            </td>
                            <td className="py-2">
                              {entry.factors && entry.factors.length > 0 && (
                                <button
                                  onClick={() => setExpandedLog(expandedLog === entry.id ? null : entry.id)}
                                  className="text-[10px] font-mono text-white/50 hover:text-white/80 border border-white/15 px-2 py-0.5 transition-colors"
                                >
                                  {expandedLog === entry.id ? 'HIDE' : 'FACTORS'}
                                </button>
                              )}
                            </td>
                          </tr>
                          {expandedLog === entry.id && entry.factors && (
                            <tr key={`${entry.id}-factors`}>
                              <td colSpan={8} className="py-2 px-4">
                                <div className="border border-white/10 p-3 space-y-1.5">
                                  {entry.factors.map((f, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-[10px] font-mono">
                                      <div className={`w-1.5 h-1.5 shrink-0 ${f.status === 'pass' ? 'bg-white/80' : f.status === 'warn' ? 'bg-white/40' : 'bg-white/20'}`}></div>
                                      <span className="text-white/70 w-36">{f.name}</span>
                                      <span className={`px-1.5 py-0.5 border border-white/10 ${factorStatusStyle(f.status)}`}>{f.status.toUpperCase()}</span>
                                      <span className="text-white/40 flex-1">{f.detail}</span>
                                      <span className={`${f.impact >= 0 ? 'text-white/60' : 'text-white/40'}`}>
                                        {f.impact >= 0 ? '+' : ''}{f.impact}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card Layout */}
                <div className="md:hidden space-y-3">
                  {logs.map(entry => (
                    <div key={entry.id} className="border border-white/10 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-white/80 font-bold">{entry.username}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-mono border ${decisionStyle(entry.decision)}`}>
                          {entry.decision.toUpperCase()}{entry.mfaVerified && ' ✓'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-white/50">
                        <span>SCORE: <span className="text-white/80">{entry.trustScore}</span></span>
                        <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="text-[10px] font-mono text-white/40">
                        {entry.resource ?? '—'} • {entry.deviceId}
                      </div>
                      {entry.factors && entry.factors.length > 0 && (
                        <button
                          onClick={() => setExpandedLog(expandedLog === entry.id ? null : entry.id)}
                          className="text-[10px] font-mono text-white/50 hover:text-white/80 border border-white/15 px-2 py-0.5 transition-colors w-full text-center"
                        >
                          {expandedLog === entry.id ? 'HIDE FACTORS' : 'SHOW FACTORS'}
                        </button>
                      )}
                      {expandedLog === entry.id && entry.factors && (
                        <div className="border-t border-white/10 pt-2 space-y-1">
                          {entry.factors.map((f, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[10px] font-mono">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 shrink-0 ${f.status === 'pass' ? 'bg-white/80' : f.status === 'warn' ? 'bg-white/40' : 'bg-white/20'}`}></div>
                                <span className="text-white/70">{f.name}</span>
                              </div>
                              <span className={`px-1.5 py-0.5 border border-white/10 ${factorStatusStyle(f.status)}`}>{f.status.toUpperCase()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Users Tab - List */}
      {activeTab === 'users' && !selectedUser && (
        <div className="border border-white/20 p-4 lg:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-px bg-white/40"></div>
            <span className="text-[10px] font-mono text-white/50 tracking-wider">USER MANAGEMENT</span>
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-[10px] font-mono text-white/50 tracking-wider">USER MANAGEMENT</span>
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-[10px] font-mono text-white/30">{users.length} USERS</span>
            <button
              onClick={() => setShowAddEmployee(true)}
              className="ml-4 px-3 py-1.5 bg-white text-black text-[10px] font-mono font-bold flex items-center gap-2 hover:bg-white/90 transition-colors"
            >
              <Plus size={12} /> ADD EMPLOYEE
            </button>
          </div>

          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">USER</th>
                  <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">ROLE</th>
                  <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">STATUS</th>
                  <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">SCANS</th>
                  <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">AVG SCORE</th>
                  <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">LAST SCORE</th>
                  <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">LAST DECISION</th>
                  <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">LAST SCAN</th>
                  <th className="text-[10px] font-mono text-white/50 tracking-wider py-2">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.userId} className="border-b border-white/5">
                    <td className="text-xs font-mono text-white/80 py-2 pr-4">{u.username}</td>
                    <td className="text-xs font-mono text-white/50 py-2 pr-4 uppercase">{u.role}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 text-[9px] font-mono border border-white/15 ${statusStyle(u.status)}`}>
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-xs font-mono text-white/60 py-2 pr-4">{u.totalScans}</td>
                    <td className="text-xs font-mono text-white/60 py-2 pr-4">{u.avgScore}</td>
                    <td className="text-xs font-mono text-white/80 py-2 pr-4">{u.lastScore ?? '—'}</td>
                    <td className="py-2 pr-4">
                      {u.lastDecision ? (
                        <span className={`px-2 py-0.5 text-[9px] font-mono border border-white/15 ${decisionStyle(u.lastDecision)}`}>
                          {u.lastDecision.toUpperCase()}
                        </span>
                      ) : <span className="text-xs font-mono text-white/30">—</span>}
                    </td>
                    <td className="text-xs font-mono text-white/40 py-2 pr-4 whitespace-nowrap">{u.lastScan ? new Date(u.lastScan).toLocaleString() : '—'}</td>
                    <td className="py-2">
                      <button
                        onClick={() => handleViewUser(u.userId)}
                        className="text-[10px] font-mono text-white/50 hover:text-white/80 border border-white/15 px-2 py-0.5 transition-colors hover:border-white/40"
                      >
                        VIEW
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.userId)}
                        className="text-[10px] font-mono text-red-400 hover:text-red-300 border border-red-500/20 px-2 py-0.5 transition-colors hover:border-red-500/40 ml-2 flex items-center gap-1"
                      >
                        <Trash2 size={10} /> FIRE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3">
            {users.map(u => (
              <div key={u.userId} className="border border-white/10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-white/80 font-bold">{u.username}</span>
                  <span className={`px-2 py-0.5 text-[9px] font-mono border border-white/15 ${statusStyle(u.status)}`}>
                    {u.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-white/50">
                  <span className="uppercase">{u.role}</span>
                  <span>•</span>
                  <span>SCANS: {u.totalScans}</span>
                  <span>•</span>
                  <span>AVG: {u.avgScore}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleViewUser(u.userId)}
                    className="text-[10px] font-mono text-white/50 hover:text-white/80 border border-white/15 px-3 py-1 transition-colors hover:border-white/40 flex-1 text-center min-h-[36px] flex items-center justify-center"
                  >
                    VIEW
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.userId)}
                    className="text-[10px] font-mono text-red-400 hover:text-red-300 border border-red-500/20 px-3 py-1 transition-colors hover:border-red-500/40 flex items-center justify-center gap-1 min-h-[36px]"
                  >
                    <Trash2 size={10} /> FIRE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Detail View */}
      {activeTab === 'users' && selectedUser && (
        <div>
          <button
            onClick={() => setSelectedUser(null)}
            className="flex items-center gap-2 text-[10px] font-mono text-white/50 hover:text-white/80 mb-4 transition-colors"
          >
            <ArrowLeft size={12} /> BACK TO USERS
          </button>

          <div className="border border-white/20 p-4 lg:p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-px bg-white/40"></div>
              <span className="text-[10px] font-mono text-white/50 tracking-wider">EMPLOYEE DETAIL</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <div className="flex flex-wrap items-center gap-6 mb-4">
              <div>
                <div className="text-[10px] font-mono text-white/40">USERNAME</div>
                <div className="text-lg font-mono text-white font-bold">{selectedUser.username.toUpperCase()}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-white/40">ROLE</div>
                <div className="text-sm font-mono text-white/70 uppercase">{selectedUser.role}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-white/40">STATUS</div>
                <span className={`px-2 py-0.5 text-[9px] font-mono border border-white/15 ${statusStyle(selectedUser.status)}`}>
                  {selectedUser.status.toUpperCase()}
                </span>
              </div>
              <div>
                <div className="text-[10px] font-mono text-white/40">USER ID</div>
                <div className="text-xs font-mono text-white/50">{selectedUser.userId}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'TOTAL SCANS', value: selectedUser.stats.totalScans },
                { label: 'AVG SCORE', value: selectedUser.stats.avgScore },
                { label: 'ALLOWED', value: selectedUser.stats.allowCount },
                { label: 'MFA REQ', value: selectedUser.stats.mfaCount },
                { label: 'BLOCKED', value: selectedUser.stats.blockedCount },
              ].map(s => (
                <div key={s.label} className="border border-white/10 p-3">
                  <div className="text-[9px] font-mono text-white/40">{s.label}</div>
                  <div className="text-lg font-mono text-white font-bold">{s.value}</div>
                </div>
              ))}
              <div className="border border-white/10 p-3">
                <div className="text-[9px] font-mono text-white/40">LAST DECISION</div>
                <div className="text-xs font-mono text-white/70">{selectedUser.stats.lastDecision ?? '—'}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="border border-white/20 p-4 lg:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-px bg-white/40"></div>
                <span className="text-[10px] font-mono text-white/50 tracking-wider">LAST DEVICE INFO</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>
              <div className="space-y-3">
                {[
                  { icon: <Cpu size={14} className="text-white/40" />, label: 'OS', value: selectedUser.deviceInfo.os },
                  { icon: <Monitor size={14} className="text-white/40" />, label: 'BROWSER', value: selectedUser.deviceInfo.browser },
                  { icon: <Globe size={14} className="text-white/40" />, label: 'IP ADDRESS', value: selectedUser.deviceInfo.ip },
                  { icon: <Globe size={14} className="text-white/40" />, label: 'LOCATION', value: selectedUser.deviceInfo.location },
                  { icon: <Clock size={14} className="text-white/40" />, label: 'LAST SEEN', value: new Date(selectedUser.deviceInfo.lastSeen).toLocaleString() },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    {item.icon}
                    <div>
                      <div className="text-[10px] font-mono text-white/40">{item.label}</div>
                      <div className="text-xs font-mono text-white/80">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 border border-white/20 p-4 lg:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-px bg-white/40"></div>
                <span className="text-[10px] font-mono text-white/50 tracking-wider">SECURITY RECOMMENDATIONS</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>
              <div className="space-y-2">
                {selectedUser.recommendations.map(rec => (
                  <div key={rec.id} className="flex items-start gap-3 p-3 border border-white/10">
                    {rec.resolved ? (
                      <CheckCircle size={14} className="text-white/60 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle size={14} className="text-white/60 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono text-white/80">{rec.title}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-mono border border-white/15 ${rec.priority === 'high' ? 'text-white bg-white/15' :
                          rec.priority === 'medium' ? 'text-white/70 bg-white/[0.08]' :
                            'text-white/50 bg-white/5'
                          }`}>{rec.priority.toUpperCase()}</span>
                      </div>
                      <div className="text-[10px] font-mono text-white/40">{rec.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-white/20 p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-px bg-white/40"></div>
              <span className="text-[10px] font-mono text-white/50 tracking-wider">SCAN HISTORY</span>
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-[10px] font-mono text-white/30">{selectedUser.logs.length} RECORDS</span>
            </div>
            {/* Desktop Table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">TIMESTAMP</th>
                    <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">RESOURCE</th>
                    <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">DEVICE</th>
                    <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">CONTEXT</th>
                    <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">SCORE</th>
                    <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">DECISION</th>
                    <th className="text-[10px] font-mono text-white/50 tracking-wider py-2">DETAILS</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedUser.logs.map(entry => (
                    <>
                      <tr key={entry.id} className="border-b border-white/5">
                        <td className="text-xs font-mono text-white/60 py-2 pr-4 whitespace-nowrap">{new Date(entry.timestamp).toLocaleString()}</td>
                        <td className="text-xs font-mono text-white/60 py-2 pr-4">{entry.resource ?? '—'}</td>
                        <td className="text-xs font-mono text-white/60 py-2 pr-4">{entry.deviceId}</td>
                        <td className="text-xs font-mono text-white/40 py-2 pr-4 whitespace-nowrap">
                          {entry.context ? `${entry.context.deviceType} / ${entry.context.networkType}` : '—'}
                        </td>
                        <td className="text-xs font-mono text-white/80 py-2 pr-4">{entry.trustScore}</td>
                        <td className="py-2 pr-4">
                          <span className={`px-2 py-0.5 text-[10px] font-mono border border-white/15 ${decisionStyle(entry.decision)}`}>
                            {entry.decision.toUpperCase()}
                            {entry.mfaVerified && ' ✓'}
                          </span>
                        </td>
                        <td className="py-2">
                          {entry.factors && entry.factors.length > 0 && (
                            <button
                              onClick={() => setExpandedLog(expandedLog === entry.id ? null : entry.id)}
                              className="text-[10px] font-mono text-white/50 hover:text-white/80 border border-white/15 px-2 py-0.5 transition-colors"
                            >
                              {expandedLog === entry.id ? 'HIDE' : 'FACTORS'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedLog === entry.id && entry.factors && (
                        <tr key={`${entry.id}-factors`}>
                          <td colSpan={7} className="py-2 px-4">
                            <div className="border border-white/10 p-3 space-y-1.5">
                              {entry.factors.map((f, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-[10px] font-mono">
                                  <div className={`w-1.5 h-1.5 shrink-0 ${f.status === 'pass' ? 'bg-white/80' : f.status === 'warn' ? 'bg-white/40' : 'bg-white/20'}`}></div>
                                  <span className="text-white/70 w-36">{f.name}</span>
                                  <span className={`px-1.5 py-0.5 border border-white/10 ${factorStatusStyle(f.status)}`}>{f.status.toUpperCase()}</span>
                                  <span className="text-white/40 flex-1">{f.detail}</span>
                                  <span className={`${f.impact >= 0 ? 'text-white/60' : 'text-white/40'}`}>
                                    {f.impact >= 0 ? '+' : ''}{f.impact}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-3">
              {selectedUser.logs.map(entry => (
                <div key={entry.id} className="border border-white/10 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-white/60">{entry.resource ?? '—'}</span>
                    <span className={`px-2 py-0.5 text-[9px] font-mono border border-white/15 ${decisionStyle(entry.decision)}`}>
                      {entry.decision.toUpperCase()}{entry.mfaVerified && ' ✓'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/50">
                    <span>SCORE: <span className="text-white/80">{entry.trustScore}</span></span>
                    <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="text-[10px] font-mono text-white/40">
                    {entry.deviceId}
                  </div>
                  {entry.factors && entry.factors.length > 0 && (
                    <button
                      onClick={() => setExpandedLog(expandedLog === entry.id ? null : entry.id)}
                      className="text-[10px] font-mono text-white/50 hover:text-white/80 border border-white/15 px-2 py-0.5 transition-colors w-full text-center"
                    >
                      {expandedLog === entry.id ? 'HIDE FACTORS' : 'SHOW FACTORS'}
                    </button>
                  )}
                  {expandedLog === entry.id && entry.factors && (
                    <div className="border-t border-white/10 pt-2 space-y-1">
                      {entry.factors.map((f, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[10px] font-mono">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 shrink-0 ${f.status === 'pass' ? 'bg-white/80' : f.status === 'warn' ? 'bg-white/40' : 'bg-white/20'}`}></div>
                            <span className="text-white/70">{f.name}</span>
                          </div>
                          <span className={`px-1.5 py-0.5 border border-white/10 ${factorStatusStyle(f.status)}`}>{f.status.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Decision Distribution */}
          <div className="border border-white/20 p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-px bg-white/40"></div>
              <span className="text-[10px] font-mono text-white/50 tracking-wider">DECISION DISTRIBUTION</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={decisionChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={1}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {decisionChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#000', border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: '11px' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                    itemStyle={{ color: 'rgba(255,255,255,0.8)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trust Score Distribution */}
          <div className="border border-white/20 p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-px bg-white/40"></div>
              <span className="text-[10px] font-mono text-white/50 tracking-wider">TRUST SCORE DISTRIBUTION</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution}>
                  <XAxis
                    dataKey="range"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ background: '#000', border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: '11px' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                    itemStyle={{ color: 'rgba(255,255,255,0.8)' }}
                  />
                  <Bar dataKey="count" fill="rgba(255,255,255,0.6)" stroke="rgba(255,255,255,0.3)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scans Per User */}
          <div className="border border-white/20 p-4 lg:p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-px bg-white/40"></div>
              <span className="text-[10px] font-mono text-white/50 tracking-wider">SCANS PER USER</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={users.map(u => ({ name: u.username.toUpperCase(), scans: u.totalScans, avgScore: u.avgScore }))}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ background: '#000', border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: '11px' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                    itemStyle={{ color: 'rgba(255,255,255,0.8)' }}
                  />
                  <Bar dataKey="scans" fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.3)" name="SCANS" />
                  <Bar dataKey="avgScore" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.2)" name="AVG SCORE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      {showAddEmployee && (
        <EmployeeForm
          onClose={() => setShowAddEmployee(false)}
          onSuccess={() => {
            fetchData();
          }}
          api={api}
        />
      )}

      <ConfirmationModal
        isOpen={confirmDelete.show}
        title="CONFIRM TERMINATION"
        message="Are you sure you want to fire/delete this employee? This action cannot be undone."
        confirmText="FIRE EMPLOYEE"
        cancelText="CANCEL"
        variant="danger"
        onConfirm={confirmDeleteUser}
        onCancel={() => setConfirmDelete({ show: false, userId: null })}
      />
    </DashboardLayout>
  );
}
