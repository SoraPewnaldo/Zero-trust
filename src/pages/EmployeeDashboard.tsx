import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { ScanResult, DashboardStats, DeviceInfo, SecurityRecommendation } from '@/lib/types';
import DashboardLayout from '@/components/DashboardLayout';
import { Shield, Activity, AlertTriangle, CheckCircle, Monitor, Globe, Cpu, Clock, Lock, Key } from 'lucide-react';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [latestScan, setLatestScan] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [resources, setResources] = useState<{ _id: string; name: string }[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const [historyResponse, statsResponse, devicesResponse, resourcesResponse] = await Promise.all([
        api.user.getScanHistory(10),
        api.user.getStats(),
        api.user.getDevices(),
        api.resources.getAll()
      ]);

      const historyData = historyResponse.scans.map((s: {
        _id: string;
        decision: string;
        resourceId?: { name: string };
        deviceId?: { deviceName: string };
        trustScore: number;
        createdAt: string;
        timestamp: string;
      }) => ({
        ...s,
        id: s._id,
        resource: s.resourceId?.name || 'Authentication',
        deviceId: s.deviceId?.deviceName || 'Web Session',
        timestamp: s.createdAt || s.timestamp
      }));

      setHistory(historyData);
      setStats({
        totalScans: statsResponse.totalScans,
        avgScore: statsResponse.avgTrustScore,
        lastDecision: historyData.length > 0 ? historyData[0].decision : null,
        allowCount: statsResponse.allowedScans,
        mfaCount: statsResponse.mfaRequiredScans,
        blockedCount: statsResponse.blockedScans
      });

      if (devicesResponse.devices?.length > 0) {
        const d = devicesResponse.devices[0];
        setDeviceInfo({
          os: d.os || 'Unknown',
          browser: d.browser || 'Unknown',
          ip: d.ipAddress || 'Unknown',
          location: d.location || 'Unknown',
          lastSeen: d.lastSeenAt || new Date().toISOString()
        });
      }

      setResources(resourcesResponse.resources || []);
      if (resourcesResponse.resources?.length > 0 && !selectedResourceId) {
        setSelectedResourceId(resourcesResponse.resources[0]._id);
      }

      if (historyData.length > 0) {
        setLatestScan(historyData[0]);
      }
    } catch (error) {
      console.error('Failed to load employee dashboard data', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [user, selectedResourceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleScan = async () => {
    if (!user || !selectedResourceId) return;
    setScanning(true);
    try {
      const result = await api.verification.initiateScan(selectedResourceId);
      // Backend returns scanId, trustScore, decision, factors, etc.
      // We need to re-fetch or manually map if we want to show it immediately.
      await loadData();
    } catch (error) {
      console.error('Scan failed', error);
      alert('Verification server error');
    } finally {
      setScanning(false);
    }
  };

  const handleMfaVerify = async () => {
    if (!latestScan) return;
    const mfaCode = prompt('Enter 6-digit MFA code:');
    if (!mfaCode) return;

    setVerifying(true);
    try {
      await api.verification.verifyMFA(latestScan.id, mfaCode);
      await loadData();
    } catch (error) {
      console.error('MFA verification failed', error);
      alert('Invalid MFA code');
    } finally {
      setVerifying(false);
    }
  };

  const decisionStyle = (d: string) => {
    const lowerD = d?.toLowerCase();
    if (lowerD === 'allow') return 'text-green-400 border-green-500/30 bg-green-500/10';
    if (lowerD === 'mfa_required' || lowerD === 'mfa required') return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
    if (lowerD === 'blocked') return 'text-red-400 border-red-500/30 bg-red-500/10';
    return 'text-white/40 border-white/20 bg-white/5';
  };

  const factorStatusStyle = (s: string) => {
    const lowerS = s?.toLowerCase();
    if (lowerS === 'pass') return 'text-green-400/80 border-green-500/20 bg-green-500/5';
    if (lowerS === 'warn') return 'text-yellow-400/80 border-yellow-500/20 bg-yellow-500/5';
    if (lowerS === 'fail') return 'text-red-400/80 border-red-500/20 bg-red-500/5';
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
        <div className="lg:col-span-2 border border-white/20 p-4 lg:p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-50"></div>

          <div className="flex items-center gap-2 mb-6 relative z-10">
            <div className="w-6 h-px bg-white/40"></div>
            <span className="text-[10px] font-mono text-white/50 tracking-wider">RESOURCES</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="space-y-4">
              <label className="text-[10px] font-mono text-white/40 block">SELECT RESOURCE TO SCAN</label>
              <div className="space-y-2">
                {resources.map((res) => (
                  <button
                    key={res._id}
                    onClick={() => setSelectedResourceId(res._id)}
                    className={`w-full text-left px-4 py-3 border transition-all duration-300 flex items-center justify-between group/btn ${selectedResourceId === res._id
                      ? 'border-white/40 bg-white/5'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                      }`}
                  >
                    <span className="text-xs font-mono text-white/80">{res.name.toUpperCase()}</span>
                    {selectedResourceId === res._id && <div className="w-1.5 h-1.5 bg-white shadow-[0_0_5px_white]"></div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <button
                onClick={handleScan}
                disabled={scanning}
                className="w-full py-4 bg-white text-black font-mono text-xs font-bold tracking-wider hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {scanning ? (
                  <>
                    <Activity size={14} className="animate-spin" />
                    RUNNING TRUST SCAN...
                  </>
                ) : (
                  <>
                    <Shield size={14} />
                    INITIATE VERIFICATION
                  </>
                )}
              </button>
              <p className="text-[9px] font-mono text-white/30 mt-3 text-center">
                SCAN DETECTS DEVICE IDENTITY, SECURITY PATCHES, AND NETWORK CONTEXT AUTOMATICALLY.
              </p>
            </div>
          </div>
        </div>

        {/* Device Info Panel */}
        <div className="border border-white/20 p-4 lg:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-px bg-white/40"></div>
            <span className="text-[10px] font-mono text-white/50 tracking-wider">ACTIVE DEVICE</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {deviceInfo ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Cpu size={14} className="text-white/40" />
                <div>
                  <div className="text-[10px] font-mono text-white/40 tracking-widest">OS</div>
                  <div className="text-xs font-mono text-white/80">{deviceInfo.os}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Monitor size={14} className="text-white/40" />
                <div>
                  <div className="text-[10px] font-mono text-white/40 tracking-widest">BROWSER</div>
                  <div className="text-xs font-mono text-white/80">{deviceInfo.browser}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe size={14} className="text-white/40" />
                <div>
                  <div className="text-[10px] font-mono text-white/40 tracking-widest">IP ADDRESS</div>
                  <div className="text-xs font-mono text-white/80">{deviceInfo.ip}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe size={14} className="text-white/40" />
                <div>
                  <div className="text-[10px] font-mono text-white/40 tracking-widest">LOCATION</div>
                  <div className="text-xs font-mono text-white/80">{deviceInfo.location}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={14} className="text-white/40" />
                <div>
                  <div className="text-[10px] font-mono text-white/40 tracking-widest">LAST SEEN</div>
                  <div className="text-xs font-mono text-white/80">{new Date(deviceInfo.lastSeen).toLocaleString()}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs font-mono text-white/40 animate-pulse">DETECTING DEVICE...</div>
          )}
        </div>
      </div>

      {/* Latest Scan Result */}
      {latestScan && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 border border-white/20 p-4 lg:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-px bg-white/40"></div>
              <span className="text-[10px] font-mono text-white/50 tracking-wider">LATEST SCAN RESULT</span>
              <span className="text-[10px] font-mono text-white/20 whitespace-nowrap overflow-hidden text-ellipsis">ID: {latestScan.id}</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <div className="flex flex-wrap items-center gap-6 mb-6">
              <div>
                <div className="text-[10px] font-mono text-white/40 tracking-widest mb-1">TRUST SCORE</div>
                <div className={`text-3xl font-mono font-bold ${latestScan.trustScore >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                  {latestScan.trustScore}/100
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-white/40 tracking-widest mb-1">DECISION</div>
                <span className={`px-2 py-1 text-xs font-mono border ${decisionStyle(latestScan.decision)}`}>
                  {latestScan.decision.toUpperCase()}
                  {latestScan.mfaVerified && ' ✓'}
                </span>
              </div>
              {latestScan.decision === 'mfa_required' && !latestScan.mfaVerified && (
                <button
                  onClick={handleMfaVerify}
                  disabled={verifying}
                  className="px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 font-mono text-[10px] hover:bg-yellow-500/20 transition-all"
                >
                  <Key size={12} className="inline mr-2" />
                  {verifying ? 'VERIFYING...' : 'STEP-UP WITH MFA'}
                </button>
              )}
            </div>

            {latestScan.factors && latestScan.factors.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[9px] font-mono text-white/30 tracking-widest mb-2">DECISION FACTORS</div>
                {latestScan.factors.map((factor, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 border border-white/5 bg-white/[0.02]">
                    <div className={`w-1.5 h-1.5 shrink-0 ${factor.status === 'pass' ? 'bg-green-500' : factor.status === 'warn' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    <span className="text-[10px] font-mono text-white/70 flex-1">{factor.name}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-mono border ${factorStatusStyle(factor.status)}`}>
                      {factor.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-white/20 p-4 lg:p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-px bg-white/40"></div>
              <span className="text-[10px] font-mono text-white/50 tracking-wider">SECURITY RECS</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>
            <div className="space-y-2 flex-1">
              {latestScan.trustScore >= 80 ? (
                <div className="p-3 border border-green-500/10 bg-green-500/5">
                  <CheckCircle size={14} className="text-green-500 mb-2" />
                  <div className="text-[10px] font-mono text-green-400/80">OPTIMAL SECURITY PARITY</div>
                  <div className="text-[9px] font-mono text-white/40 mt-1">No critical vulnerabilities detected on this device.</div>
                </div>
              ) : (
                <div className="p-3 border border-red-500/10 bg-red-500/5">
                  <AlertTriangle size={14} className="text-red-500 mb-2" />
                  <div className="text-[10px] font-mono text-red-400/80">IMPROVE TRUST SCORE</div>
                  <div className="text-[9px] font-mono text-white/40 mt-1">Check firewall status and pending security patches.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="border border-white/20 p-4 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-white/40"></div>
          <span className="text-[10px] font-mono text-white/50 tracking-wider">ACCESS LOGS</span>
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-[10px] font-mono text-white/30">{history.length} RECORDS</span>
        </div>

        {loadingHistory ? (
          <div className="text-xs font-mono text-white/40 animate-pulse">SYNCING LOGS...</div>
        ) : history.length === 0 ? (
          <div className="text-xs font-mono text-white/30">NO SECURITY EVENTS RECORDED</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-[9px] font-mono text-white/40 py-2 pr-4 uppercase">TIMESTAMP</th>
                  <th className="text-[9px] font-mono text-white/40 py-2 pr-4 uppercase">RESOURCE</th>
                  <th className="text-[9px] font-mono text-white/40 py-2 pr-4 uppercase">SCORE</th>
                  <th className="text-[9px] font-mono text-white/40 py-2 uppercase">DECISION</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} className="border-b border-white/5">
                    <td className="text-xs font-mono text-white/60 py-2 pr-4 whitespace-nowrap">{new Date(entry.timestamp).toLocaleString()}</td>
                    <td className="text-xs font-mono text-white/60 py-2 pr-4">{entry.resource}</td>
                    <td className="text-xs font-mono text-white/80 py-2 pr-4">{entry.trustScore}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 text-[9px] font-mono border ${decisionStyle(entry.decision)}`}>
                        {entry.decision?.toUpperCase()}
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