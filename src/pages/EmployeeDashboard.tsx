import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { postScan, verifyMfa, getUserLogs, getUserStats, getDeviceInfo, getRecommendations, ScanResult, DashboardStats, DeviceInfo, SecurityRecommendation, ResourceType, AccessContext, DeviceType, NetworkType } from '@/lib/mock-api';
import DashboardLayout from '@/components/DashboardLayout';
import { Shield, Activity, AlertTriangle, CheckCircle, Monitor, Globe, Cpu, Clock, Lock, Wifi, Laptop, Key } from 'lucide-react';
const RESOURCES: ResourceType[] = ['Internal Dashboard', 'Git Repository', 'Production Console'];
const DEVICE_TYPES: DeviceType[] = ['Managed', 'Personal'];
const NETWORK_TYPES: NetworkType[] = ['Corporate', 'Home', 'Public Wi-Fi'];
export default function EmployeeDashboard() {
  const {
    user
  } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [latestScan, setLatestScan] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [recommendations, setRecommendations] = useState<SecurityRecommendation[]>([]);

  // Resource & Context selection
  const [selectedResource, setSelectedResource] = useState<ResourceType>('Internal Dashboard');
  const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType>('Managed');
  const [selectedNetworkType, setSelectedNetworkType] = useState<NetworkType>('Corporate');
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    const [logs, userStats, device] = await Promise.all([getUserLogs(user.id), getUserStats(user.id), getDeviceInfo()]);
    setHistory(logs);
    setStats(userStats);
    setDeviceInfo(device);
    if (logs.length > 0) {
      setLatestScan(logs[0]);
      setRecommendations(getRecommendations(logs[0].trustScore, logs[0].factors));
    }
    setLoadingHistory(false);
  }, [user]);
  useEffect(() => {
    loadData();
  }, [loadData]);
  const handleScan = async () => {
    if (!user) return;
    setScanning(true);
    const context: AccessContext = {
      deviceType: selectedDeviceType,
      networkType: selectedNetworkType
    };
    const result = await postScan(user.id, user.username, user.role, selectedResource, context);
    setLatestScan(result);
    setRecommendations(getRecommendations(result.trustScore, result.factors));
    setScanning(false);
    loadData();
  };
  const handleMfaVerify = async () => {
    if (!latestScan) return;
    setVerifying(true);
    const updated = await verifyMfa(latestScan.id);
    setLatestScan(updated);
    setRecommendations(getRecommendations(updated.trustScore, updated.factors));
    setVerifying(false);
    loadData();
  };
  const decisionStyle = (d: string) => {
    if (d === 'Allow') return 'text-white bg-white/10';
    if (d === 'MFA Required') return 'text-white/80 bg-white/5';
    return 'text-white/60 bg-white/5 line-through';
  };
  const priorityStyle = (p: string) => {
    if (p === 'high') return 'text-white bg-white/15';
    if (p === 'medium') return 'text-white/70 bg-white/[0.08]';
    return 'text-white/50 bg-white/5';
  };
  const factorStatusStyle = (s: string) => {
    if (s === 'pass') return 'text-white bg-white/10';
    if (s === 'warn') return 'text-white/70 bg-white/[0.08]';
    return 'text-white/50 bg-white/5';
  };
  return <DashboardLayout title="EMPLOYEE DASHBOARD" subtitle="DEVICE TRUST VERIFICATION">
    {/* Quick Stats Cards */}
    {stats && <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
    </div>}

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Access Request Panel */}
      <div className="lg:col-span-2 border border-white/20 p-4 lg:p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div className="flex items-center gap-2 mb-6 relative z-10">
          <div className="w-6 h-px bg-white/40"></div>
          <span className="text-[10px] font-mono text-white/50 tracking-wider">REQUEST ACCESS</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {/* Resource Selection */}
          <div className="space-y-4">
            <label className="text-[10px] font-mono text-white/40 block">SELECT RESOURCE</label>
            <div className="space-y-2">
              {RESOURCES.map((res) => (
                <button
                  key={res}
                  onClick={() => setSelectedResource(res)}
                  className={`w-full text-left px-4 py-3 border transition-all duration-300 flex items-center justify-between group/btn ${selectedResource === res
                      ? 'border-white/40 bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                    }`}
                >
                  <span className="text-xs font-mono text-white/80">{res}</span>
                  {selectedResource === res && <div className="w-1.5 h-1.5 bg-white shadow-[0_0_5px_white]"></div>}
                </button>
              ))}
            </div>
          </div>

          {/* Context Simulation */}
          <div className="space-y-4">
            <label className="text-[10px] font-mono text-white/40 block">SIMULATE CONTEXT</label>

            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-mono text-white/30 mb-2">DEVICE TYPE</div>
                <div className="flex gap-2">
                  {DEVICE_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedDeviceType(type)}
                      className={`flex-1 py-2 border text-[10px] font-mono transition-all ${selectedDeviceType === type
                          ? 'border-white/40 bg-white/5 text-white'
                          : 'border-white/10 text-white/40 hover:border-white/20'
                        }`}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-white/30 mb-2">NETWORK</div>
                <div className="flex gap-2">
                  {NETWORK_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedNetworkType(type)}
                      className={`flex-1 py-2 border text-[10px] font-mono transition-all ${selectedNetworkType === type
                          ? 'border-white/40 bg-white/5 text-white'
                          : 'border-white/10 text-white/40 hover:border-white/20'
                        }`}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleScan}
                disabled={scanning}
                className="w-full mt-4 py-3 bg-white text-black font-mono text-xs font-bold tracking-wider hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {scanning ? (
                  <>
                    <Activity size={14} className="animate-spin" />
                    VERIFYING TRUST...
                  </>
                ) : (
                  <>
                    <Shield size={14} />
                    INITIATE ACCESS REQUEST
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Device Info Panel */}
      <div className="border border-white/20 p-4 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-px bg-white/40"></div>
          <span className="text-[10px] font-mono text-white/50 tracking-wider">DEVICE INFO</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {deviceInfo ? <div className="space-y-3">
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
        </div> : <div className="text-xs font-mono text-white/40 animate-pulse">LOADING DEVICE INFO...</div>}
      </div>
    </div>

    {/* Explainable Decision Factors */}
    {latestScan?.factors && latestScan.factors.length > 0 && <div className="border border-white/20 p-4 lg:p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-px bg-white/40"></div>
        <span className="text-[10px] font-mono text-white/50 tracking-wider">DECISION FACTORS</span>
        <div className="flex-1 h-px bg-white/10"></div>
        <span className="text-[10px] font-mono text-white/30">{latestScan.factors.length} CHECKS</span>
      </div>

      <div className="space-y-2">
        {latestScan.factors.map((factor, idx) => <div key={idx} className="flex items-center gap-3 p-3 border border-white/10">
          <div className={`w-2 h-2 shrink-0 ${factor.status === 'pass' ? 'bg-white/80' : factor.status === 'warn' ? 'bg-white/40' : 'bg-white/20'}`}></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-mono text-white/80">{factor.name}</span>
              <span className={`px-2 py-0.5 text-[9px] font-mono border border-white/15 ${factorStatusStyle(factor.status)}`}>
                {factor.status.toUpperCase()}
              </span>
            </div>
            <div className="text-[10px] font-mono text-white/40">{factor.detail}</div>
          </div>
          <span className={`text-[10px] font-mono shrink-0 ${factor.impact >= 0 ? 'text-white/60' : 'text-white/40'}`}>
            {factor.impact >= 0 ? '+' : ''}{factor.impact}
          </span>
        </div>)}
      </div>
    </div>}

    {/* Security Recommendations */}
    {recommendations.length > 0 && <div className="border border-white/20 p-4 lg:p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-px bg-white/40"></div>
        <span className="text-[10px] font-mono text-white/50 tracking-wider">SECURITY RECOMMENDATIONS</span>
        <div className="flex-1 h-px bg-white/10"></div>
      </div>

      <div className="space-y-2">
        {recommendations.map(rec => <div key={rec.id} className="flex items-start gap-3 p-3 border border-white/10">
          {rec.resolved ? <CheckCircle size={14} className="text-white/60 mt-0.5 shrink-0" /> : <AlertTriangle size={14} className="text-white/60 mt-0.5 shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-white/80">{rec.title}</span>
              <span className={`px-2 py-0.5 text-[9px] font-mono border border-white/15 ${priorityStyle(rec.priority)}`}>
                {rec.priority.toUpperCase()}
              </span>
            </div>
            <div className="text-[10px] font-mono text-white/40">{rec.description}</div>
          </div>
        </div>)}
      </div>
    </div>}

    {/* Access Request Timeline */}
    {history.length > 0 && <div className="border border-white/20 p-4 lg:p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-px bg-white/40"></div>
        <span className="text-[10px] font-mono text-white/50 tracking-wider">ACCESS TIMELINE</span>
        <div className="flex-1 h-px bg-white/10"></div>
      </div>

      <div className="relative">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10"></div>
        <div className="space-y-4">
          {history.slice(0, 5).map(entry => <div key={entry.id} className="flex items-start gap-4 pl-0">
            <div className="w-[15px] h-[15px] border border-white/30 bg-black flex items-center justify-center shrink-0 z-10">
              <div className={`w-[7px] h-[7px] ${entry.decision === 'Allow' ? 'bg-white/80' : entry.decision === 'MFA Required' ? 'bg-white/40' : 'bg-white/20'}`}></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 text-[9px] font-mono border border-white/15 ${decisionStyle(entry.decision)}`}>
                  {entry.decision.toUpperCase()}
                  {entry.mfaVerified && ' ✓'}
                </span>
                <span className="text-[10px] font-mono text-white/80">SCORE: {entry.trustScore}</span>
                {entry.resource && <span className="text-[10px] font-mono text-white/50">→ {entry.resource.toUpperCase()}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-white/40">
                <span>{entry.deviceId}</span>
                {entry.context && <>
                  <span>•</span>
                  <span>{entry.context.deviceType}</span>
                  <span>•</span>
                  <span>{entry.context.networkType}</span>
                </>}
                <span>•</span>
                <span>{new Date(entry.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>)}
        </div>
      </div>
    </div>}

    {/* Scan History Table */}
    <div className="border border-white/20 p-4 lg:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-px bg-white/40"></div>
        <span className="text-[10px] font-mono text-white/50 tracking-wider">SCAN HISTORY</span>
        <div className="flex-1 h-px bg-white/10"></div>
        <span className="text-[10px] font-mono text-white/30">{history.length} RECORDS</span>
      </div>

      {loadingHistory ? <div className="text-xs font-mono text-white/40 animate-pulse">LOADING RECORDS...</div> : history.length === 0 ? <div className="text-xs font-mono text-white/30">NO SCAN RECORDS FOUND</div> : <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">TIMESTAMP</th>
              <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">RESOURCE</th>
              <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">DEVICE</th>
              <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">CONTEXT</th>
              <th className="text-[10px] font-mono text-white/50 tracking-wider py-2 pr-4">SCORE</th>
              <th className="text-[10px] font-mono text-white/50 tracking-wider py-2">DECISION</th>
            </tr>
          </thead>
          <tbody>
            {history.map(entry => <tr key={entry.id} className="border-b border-white/5">
              <td className="text-xs font-mono text-white/60 py-2 pr-4 whitespace-nowrap">{new Date(entry.timestamp).toLocaleString()}</td>
              <td className="text-xs font-mono text-white/60 py-2 pr-4">{entry.resource ?? '—'}</td>
              <td className="text-xs font-mono text-white/60 py-2 pr-4">{entry.deviceId}</td>
              <td className="text-xs font-mono text-white/40 py-2 pr-4 whitespace-nowrap">
                {entry.context ? `${entry.context.deviceType} / ${entry.context.networkType}` : '—'}
              </td>
              <td className="text-xs font-mono text-white/80 py-2 pr-4">{entry.trustScore}</td>
              <td className="py-2">
                <span className={`px-2 py-0.5 text-[10px] font-mono border border-white/15 ${decisionStyle(entry.decision)}`}>
                  {entry.decision.toUpperCase()}
                  {entry.mfaVerified && ' ✓'}
                </span>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>}
    </div>
  </DashboardLayout>;
}