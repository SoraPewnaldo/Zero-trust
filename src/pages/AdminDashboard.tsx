import { useState, useEffect } from 'react';
import { getLogs, getOrgStats, getUsers, getThreats, getUserDetail, ScanResult, DashboardStats, UserSummary, UserDetail } from '@/lib/mock-api';
import DashboardLayout from '@/components/DashboardLayout';
import { Shield, Users, AlertTriangle, Activity, CheckCircle, XCircle, ArrowLeft, Monitor, Globe, Cpu, Clock } from 'lucide-react';
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

  const fetchData = async () => {
    setLoading(true);
    const [logData, orgStats, userData, threatData] = await Promise.all([
      getLogs({
        username: filterUser || undefined,
        role: filterRole || undefined,
        decision: filterDecision || undefined,
        resource: filterResource || undefined,
      }),
      getOrgStats(),
      getUsers(),
      getThreats(),
    ]);
    setLogs(logData);
    setStats(orgStats);
    setUsers(userData);
    setThreats(threatData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filterUser, filterRole, filterDecision, filterResource]);

  const handleViewUser = async (userId: string) => {
    setLoadingUser(true);
    const detail = await getUserDetail(userId);
    setSelectedUser(detail);
    setLoadingUser(false);
  };

  const decisionStyle = (d: string) => {
    if (d === 'Allow') return 'text-white bg-white/10';
    if (d === 'MFA Required') return 'text-white/80 bg-white/5';
    return 'text-white/60 bg-white/5 line-through';
  };

  const statusStyle = (s: string) => {
    if (s === 'active') return 'text-white bg-white/10';
    if (s === 'pending') return 'text-white/70 bg-white/5';
    return 'text-white/50 bg-white/5 line-through';
  };

  const factorStatusStyle = (s: string) => {
    if (s === 'pass') return 'text-white bg-white/10';
    if (s === 'warn') return 'text-white/70 bg-white/[0.08]';
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
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
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
            className={`px-4 py-2 text-[10px] font-mono tracking-wider transition-all duration-200 border-b-2 ${
              activeTab === tab
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
                  <option value="Allow">ALLOW</option>
                  <option value="MFA Required">MFA REQUIRED</option>
                  <option value="Blocked">BLOCKED</option>
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
                  <option value="Internal Dashboard">INTERNAL DASHBOARD</option>
                  <option value="Git Repository">GIT REPOSITORY</option>
                  <option value="Production Console">PRODUCTION CONSOLE</option>
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
              <div className="overflow-x-auto">
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
            <span className="text-[10px] font-mono text-white/30">{users.length} USERS</span>
          </div>

          <div className="overflow-x-auto">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
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
                        <span className={`px-2 py-0.5 text-[9px] font-mono border border-white/15 ${
                          rec.priority === 'high' ? 'text-white bg-white/15' :
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
            <div className="overflow-x-auto">
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
    </DashboardLayout>
  );
}
