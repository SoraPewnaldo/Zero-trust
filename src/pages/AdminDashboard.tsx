import { useState, useEffect } from 'react';
import { getLogs, ScanResult } from '@/lib/mock-api';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminDashboard() {
  const [logs, setLogs] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDecision, setFilterDecision] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    const data = await getLogs({
      username: filterUser || undefined,
      role: filterRole || undefined,
      decision: filterDecision || undefined,
    });
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [filterUser, filterRole, filterDecision]);

  const decisionStyle = (d: string) => {
    if (d === 'Allow') return 'text-white bg-white/10';
    if (d === 'MFA Required') return 'text-white/80 bg-white/5';
    return 'text-white/60 bg-white/5 line-through';
  };

  return (
    <DashboardLayout title="ADMIN DASHBOARD" subtitle="ORGANIZATION ACCESS LOGS">
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
        </div>
      </div>

      {/* Logs Table */}
      <div className="border border-white/20 p-4 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-white/40"></div>
          <span className="text-[10px] font-mono text-white/50 tracking-wider">ACCESS LOGS</span>
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
                  <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">ROLE</th>
                  <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">DEVICE</th>
                  <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">SCORE</th>
                  <th className="text-[10px] font-mono text-white/50 tracking-wider py-2">DECISION</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(entry => (
                  <tr key={entry.id} className="border-b border-white/5">
                    <td className="text-xs font-mono text-white/60 py-2 pr-4 whitespace-nowrap">{new Date(entry.timestamp).toLocaleString()}</td>
                    <td className="text-xs font-mono text-white/80 py-2 pr-4">{entry.username}</td>
                    <td className="text-xs font-mono text-white/50 py-2 pr-4 uppercase">{entry.role}</td>
                    <td className="text-xs font-mono text-white/60 py-2 pr-4">{entry.deviceId}</td>
                    <td className="text-xs font-mono text-white/80 py-2 pr-4">{entry.trustScore}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 text-[10px] font-mono border border-white/15 ${decisionStyle(entry.decision)}`}>
                        {entry.decision.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
