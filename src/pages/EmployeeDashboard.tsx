import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { postScan, getUserLogs, getUserStats, getDeviceInfo, getRecommendations, ScanResult, DashboardStats, DeviceInfo, SecurityRecommendation } from '@/lib/mock-api';
import DashboardLayout from '@/components/DashboardLayout';
import { Shield, Activity, AlertTriangle, CheckCircle, Monitor, Globe, Cpu, Clock } from 'lucide-react';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [latestScan, setLatestScan] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [recommendations, setRecommendations] = useState<SecurityRecommendation[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    const [logs, userStats, device] = await Promise.all([
      getUserLogs(user.id),
      getUserStats(user.id),
      getDeviceInfo(),
    ]);
    setHistory(logs);
    setStats(userStats);
    setDeviceInfo(device);
    if (logs.length > 0) {
      setLatestScan(logs[0]);
      setRecommendations(getRecommendations(logs[0].trustScore));
    }
    setLoadingHistory(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleScan = async () => {
    if (!user) return;
    setScanning(true);
    const result = await postScan(user.id, user.username, user.role);
    setLatestScan(result);
    setRecommendations(getRecommendations(result.trustScore));
    setScanning(false);
    loadData();
  };

  const decisionStyle = (d: string) => {
    if (d === 'Allow') return 'text-white bg-white/10';
    if (d === 'MFA Required') return 'text-white/80 bg-white/5';
    return 'text-white/60 bg-white/5 line-through';
  };

  const priorityStyle = (p: string) => {
    if (p === 'high') return 'text-white bg-white/15';
    if (p === 'medium') return 'text-white/70 bg-white/8';
    return 'text-white/50 bg-white/5';
  };

  return (
    <DashboardLayout title="EMPLOYEE DASHBOARD" subtitle="DEVICE TRUST VERIFICATION">
      {/* Quick Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
              <CheckCircle size={14} className="text-white/50" />
              <span className="text-[10px] font-mono text-white/50 tracking-wider">ALLOWED</span>
            </div>
            <div className="text-2xl font-mono text-white font-bold">{stats.allowCount}</div>
          </div>
          <div className="border border-white/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-white/50" />
              <span className="text-[10px] font-mono text-white/50 tracking-wider">BLOCKED</span>
            </div>
            <div className="text-2xl font-mono text-white font-bold">{stats.blockedCount}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Access Request Panel */}
        <div className="lg:col-span-2 border border-white/20 p-4 lg:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-px bg-white/40"></div>
            <span className="text-[10px] font-mono text-white/50 tracking-wider">ACCESS REQUEST</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <button
            onClick={handleScan}
            disabled={scanning}
            className="relative px-6 py-2.5 bg-transparent text-white font-mono text-sm border border-white hover:bg-white hover:text-black transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed group mb-6"
          >
            <span className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
            <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
            {scanning ? '◐ SCANNING DEVICE...' : 'REQUEST SECURE ACCESS'}
          </button>

          {/* Trust Score Display */}
          {latestScan && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-white/50 tracking-wider">TRUST SCORE</span>
                  <span className="text-xl font-mono text-white font-bold">{latestScan.trustScore}/100</span>
                </div>
                <div className="w-full h-2 bg-white/10 border border-white/20">
                  <div
                    className="h-full bg-white transition-all duration-1000 ease-out"
                    style={{ width: `${latestScan.trustScore}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono text-white/50 tracking-wider">DECISION:</span>
                <span className={`px-3 py-1 text-xs font-mono border border-white/20 ${decisionStyle(latestScan.decision)}`}>
                  {latestScan.decision.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-4 text-[10px] font-mono text-white/40">
                <span>DEVICE: {latestScan.deviceId}</span>
                <span>•</span>
                <span>{new Date(latestScan.timestamp).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Device Info Panel */}
        <div className="border border-white/20 p-4 lg:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-px bg-white/40"></div>
            <span className="text-[10px] font-mono text-white/50 tracking-wider">DEVICE INFO</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {deviceInfo ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Cpu size={14} className="text-white/40" />
                <div>
                  <div className="text-[10px] font-mono text-white/40">OPERATING SYSTEM</div>
                  <div className="text-xs font-mono text-white/80">{deviceInfo.os}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Monitor size={14} className="text-white/40" />
                <div>
                  <div className="text-[10px] font-mono text-white/40">BROWSER</div>
                  <div className="text-xs font-mono text-white/80">{deviceInfo.browser}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe size={14} className="text-white/40" />
                <div>
                  <div className="text-[10px] font-mono text-white/40">IP ADDRESS</div>
                  <div className="text-xs font-mono text-white/80">{deviceInfo.ip}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe size={14} className="text-white/40" />
                <div>
                  <div className="text-[10px] font-mono text-white/40">LOCATION</div>
                  <div className="text-xs font-mono text-white/80">{deviceInfo.location}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={14} className="text-white/40" />
                <div>
                  <div className="text-[10px] font-mono text-white/40">LAST SEEN</div>
                  <div className="text-xs font-mono text-white/80">{new Date(deviceInfo.lastSeen).toLocaleString()}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs font-mono text-white/40 animate-pulse">LOADING DEVICE INFO...</div>
          )}
        </div>
      </div>

      {/* Security Recommendations */}
      {recommendations.length > 0 && (
        <div className="border border-white/20 p-4 lg:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-px bg-white/40"></div>
            <span className="text-[10px] font-mono text-white/50 tracking-wider">SECURITY RECOMMENDATIONS</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <div className="space-y-2">
            {recommendations.map(rec => (
              <div key={rec.id} className="flex items-start gap-3 p-3 border border-white/10">
                {rec.resolved ? (
                  <CheckCircle size={14} className="text-white/60 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle size={14} className="text-white/60 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-white/80">{rec.title}</span>
                    <span className={`px-2 py-0.5 text-[9px] font-mono border border-white/15 ${priorityStyle(rec.priority)}`}>
                      {rec.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-white/40">{rec.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Access Request Timeline */}
      {history.length > 0 && (
        <div className="border border-white/20 p-4 lg:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-px bg-white/40"></div>
            <span className="text-[10px] font-mono text-white/50 tracking-wider">ACCESS TIMELINE</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <div className="relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10"></div>
            <div className="space-y-4">
              {history.slice(0, 5).map(entry => (
                <div key={entry.id} className="flex items-start gap-4 pl-0">
                  <div className="w-[15px] h-[15px] border border-white/30 bg-black flex items-center justify-center shrink-0 z-10">
                    <div className={`w-[7px] h-[7px] ${entry.decision === 'Allow' ? 'bg-white/80' : entry.decision === 'MFA Required' ? 'bg-white/40' : 'bg-white/20'}`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`px-2 py-0.5 text-[9px] font-mono border border-white/15 ${decisionStyle(entry.decision)}`}>
                        {entry.decision.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-white/80">SCORE: {entry.trustScore}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-white/40">
                      <span>{entry.deviceId}</span>
                      <span>•</span>
                      <span>{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scan History Table */}
      <div className="border border-white/20 p-4 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-white/40"></div>
          <span className="text-[10px] font-mono text-white/50 tracking-wider">SCAN HISTORY</span>
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-[10px] font-mono text-white/30">{history.length} RECORDS</span>
        </div>

        {loadingHistory ? (
          <div className="text-xs font-mono text-white/40 animate-pulse">LOADING RECORDS...</div>
        ) : history.length === 0 ? (
          <div className="text-xs font-mono text-white/30">NO SCAN RECORDS FOUND</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">TIMESTAMP</th>
                  <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">DEVICE</th>
                  <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">SCORE</th>
                  <th className="text-[10px] font-mono text-white/50 tracking-wider py-2">DECISION</th>
                </tr>
              </thead>
              <tbody>
                {history.map(entry => (
                  <tr key={entry.id} className="border-b border-white/5">
                    <td className="text-xs font-mono text-white/60 py-2 pr-4">{new Date(entry.timestamp).toLocaleString()}</td>
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
