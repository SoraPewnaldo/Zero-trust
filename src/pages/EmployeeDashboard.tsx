import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { postScan, getUserLogs, ScanResult } from '@/lib/mock-api';
import DashboardLayout from '@/components/DashboardLayout';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [latestScan, setLatestScan] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    const logs = await getUserLogs(user.id);
    setHistory(logs);
    setLoadingHistory(false);
  }, [user]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleScan = async () => {
    if (!user) return;
    setScanning(true);
    const result = await postScan(user.id, user.username, user.role);
    setLatestScan(result);
    setScanning(false);
    loadHistory();
  };

  const decisionStyle = (d: string) => {
    if (d === 'Allow') return 'text-white bg-white/10';
    if (d === 'MFA Required') return 'text-white/80 bg-white/5';
    return 'text-white/60 bg-white/5 line-through';
  };

  return (
    <DashboardLayout title="EMPLOYEE DASHBOARD" subtitle="DEVICE TRUST VERIFICATION">
      {/* Scan Section */}
      <div className="border border-white/20 p-4 lg:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-white/40"></div>
          <span className="text-[10px] font-mono text-white/50 tracking-wider">DEVICE SCAN</span>
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
              {/* Progress bar */}
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

      {/* Scan History */}
      <div className="border border-white/20 p-4 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-white/40"></div>
          <span className="text-[10px] font-mono text-white/50 tracking-wider">SCAN HISTORY</span>
          <div className="flex-1 h-px bg-white/10"></div>
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
