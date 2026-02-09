import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  postScan, verifyMfa,
  ScanResult, ResourceType, AccessContext, DeviceType, NetworkType,
} from '@/lib/mock-api';
import DashboardLayout from '@/components/DashboardLayout';
import { Shield, Monitor, Lock, Laptop, Wifi, Key, CheckCircle } from 'lucide-react';

const RESOURCES: ResourceType[] = ['Internal Dashboard', 'Git Repository', 'Production Console'];
const DEVICE_TYPES: DeviceType[] = ['Managed', 'Personal'];
const NETWORK_TYPES: NetworkType[] = ['Corporate', 'Home', 'Public Wi-Fi'];

export default function EmployeeVerify() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const [selectedResource, setSelectedResource] = useState<ResourceType>('Internal Dashboard');
  const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType>('Managed');
  const [selectedNetworkType, setSelectedNetworkType] = useState<NetworkType>('Corporate');

  const handleScan = async () => {
    if (!user) return;
    setScanning(true);
    const context: AccessContext = { deviceType: selectedDeviceType, networkType: selectedNetworkType };
    const result = await postScan(user.id, user.username, user.role, selectedResource, context);
    setScanResult(result);
    setScanning(false);
  };

  const handleMfaVerify = async () => {
    if (!scanResult) return;
    setVerifying(true);
    const updated = await verifyMfa(scanResult.id);
    setScanResult(updated);
    setVerifying(false);
  };

  const isAllowed = scanResult?.decision === 'Allow' || scanResult?.mfaVerified;

  const factorStatusStyle = (s: string) => {
    if (s === 'pass') return 'text-white bg-white/10';
    if (s === 'warn') return 'text-white/70 bg-white/[0.08]';
    return 'text-white/50 bg-white/5';
  };

  return (
    <DashboardLayout title="ACCESS VERIFICATION" subtitle="IDENTITY & DEVICE TRUST CHECK REQUIRED">
      <div className="max-w-2xl mx-auto">
        {/* Status Banner */}
        <div className="border border-white/20 p-6 mb-6 text-center">
          <Shield size={32} className="text-white/40 mx-auto mb-3" />
          <h2 className="text-lg font-mono text-white tracking-wider mb-2">
            {!scanResult ? 'VERIFICATION REQUIRED' :
              isAllowed ? 'ACCESS GRANTED' :
              scanResult.decision === 'MFA Required' ? 'ADDITIONAL VERIFICATION NEEDED' :
              'ACCESS DENIED'}
          </h2>
          <p className="text-[10px] font-mono text-white/40">
            {!scanResult
              ? 'Complete a device trust scan to access your dashboard'
              : isAllowed
              ? 'Your identity and device have been verified. You may proceed.'
              : scanResult.decision === 'MFA Required'
              ? 'Your trust score requires step-up authentication.'
              : 'Your device does not meet security requirements. Try again with different context.'}
          </p>
        </div>

        {/* If allowed, show proceed button */}
        {isAllowed && (
          <div className="text-center mb-6">
            <button
              onClick={() => navigate('/employee')}
              className="relative px-8 py-3 bg-transparent text-white font-mono text-sm border border-white hover:bg-white hover:text-black transition-all duration-200 group"
            >
              <span className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
              PROCEED TO DASHBOARD →
            </button>
          </div>
        )}

        {/* Scan Form - show when not yet allowed */}
        {!isAllowed && (
          <div className="border border-white/20 p-4 lg:p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-px bg-white/40"></div>
              <span className="text-[10px] font-mono text-white/50 tracking-wider">ACCESS REQUEST</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            {/* Resource Selection */}
            <div className="mb-4">
              <label className="block text-[10px] font-mono text-white/40 mb-1.5 tracking-wider">TARGET RESOURCE</label>
              <div className="flex flex-wrap gap-2">
                {RESOURCES.map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedResource(r)}
                    className={`px-3 py-1.5 text-[10px] font-mono border transition-all duration-200 ${
                      selectedResource === r
                        ? 'border-white text-white bg-white/10'
                        : 'border-white/20 text-white/40 hover:text-white/60 hover:border-white/40'
                    }`}
                  >
                    {r === 'Internal Dashboard' && <Monitor size={10} className="inline mr-1.5 -mt-0.5" />}
                    {r === 'Git Repository' && <Lock size={10} className="inline mr-1.5 -mt-0.5" />}
                    {r === 'Production Console' && <Shield size={10} className="inline mr-1.5 -mt-0.5" />}
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Context Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
              <div>
                <label className="block text-[10px] font-mono text-white/40 mb-1.5 tracking-wider">
                  <Laptop size={10} className="inline mr-1 -mt-0.5" /> DEVICE TYPE
                </label>
                <div className="flex gap-2">
                  {DEVICE_TYPES.map(d => (
                    <button
                      key={d}
                      onClick={() => setSelectedDeviceType(d)}
                      className={`flex-1 px-3 py-1.5 text-[10px] font-mono border transition-all duration-200 ${
                        selectedDeviceType === d
                          ? 'border-white text-white bg-white/10'
                          : 'border-white/20 text-white/40 hover:text-white/60 hover:border-white/40'
                      }`}
                    >
                      {d.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-white/40 mb-1.5 tracking-wider">
                  <Wifi size={10} className="inline mr-1 -mt-0.5" /> NETWORK TYPE
                </label>
                <div className="flex gap-2">
                  {NETWORK_TYPES.map(n => (
                    <button
                      key={n}
                      onClick={() => setSelectedNetworkType(n)}
                      className={`flex-1 px-3 py-1.5 text-[10px] font-mono border transition-all duration-200 ${
                        selectedNetworkType === n
                          ? 'border-white text-white bg-white/10'
                          : 'border-white/20 text-white/40 hover:text-white/60 hover:border-white/40'
                      }`}
                    >
                      {n.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleScan}
              disabled={scanning}
              className="w-full relative px-6 py-2.5 bg-transparent text-white font-mono text-sm border border-white hover:bg-white hover:text-black transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              <span className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
              {scanning ? '◐ SCANNING DEVICE...' : 'INITIATE VERIFICATION'}
            </button>
          </div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <div className="border border-white/20 p-4 lg:p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-px bg-white/40"></div>
              <span className="text-[10px] font-mono text-white/50 tracking-wider">SCAN RESULT</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            {/* Trust Score */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-white/50 tracking-wider">TRUST SCORE</span>
                <span className="text-xl font-mono text-white font-bold">{scanResult.trustScore}/100</span>
              </div>
              <div className="w-full h-2 bg-white/10 border border-white/20">
                <div
                  className="h-full bg-white transition-all duration-1000 ease-out"
                  style={{ width: `${scanResult.trustScore}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/50">DECISION:</span>
                <span className={`px-3 py-1 text-xs font-mono border border-white/20 ${
                  scanResult.decision === 'Allow' ? 'text-white bg-white/10' :
                  scanResult.decision === 'MFA Required' ? 'text-white/80 bg-white/5' :
                  'text-white/60 bg-white/5'
                }`}>
                  {scanResult.decision.toUpperCase()}
                  {scanResult.mfaVerified && ' ✓ MFA'}
                </span>
              </div>
              {scanResult.resource && (
                <span className="text-[10px] font-mono text-white/50">RESOURCE: {scanResult.resource.toUpperCase()}</span>
              )}
            </div>

            {/* MFA Step-Up */}
            {scanResult.decision === 'MFA Required' && !scanResult.mfaVerified && (
              <div className="border border-white/20 p-4 space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <Key size={14} className="text-white/60" />
                  <span className="text-xs font-mono text-white/80">ADDITIONAL VERIFICATION REQUIRED</span>
                </div>
                <p className="text-[10px] font-mono text-white/40">
                  Complete MFA verification to gain access to the dashboard.
                </p>
                <button
                  onClick={handleMfaVerify}
                  disabled={verifying}
                  className="relative px-5 py-2 bg-transparent text-white font-mono text-xs border border-white hover:bg-white hover:text-black transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed group"
                >
                  <span className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  {verifying ? '◐ VERIFYING...' : 'VERIFY WITH MFA'}
                </button>
              </div>
            )}

            {/* MFA Success */}
            {scanResult.mfaVerified && (
              <div className="border border-white/20 p-3 flex items-center gap-3 mb-4">
                <CheckCircle size={14} className="text-white/60" />
                <span className="text-[10px] font-mono text-white/60">MFA VERIFICATION SUCCESSFUL — ACCESS GRANTED</span>
              </div>
            )}

            {/* Decision Factors */}
            {scanResult.factors && scanResult.factors.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-white/40 tracking-wider">DECISION FACTORS</span>
                {scanResult.factors.map((factor, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 border border-white/10">
                    <div className={`w-2 h-2 shrink-0 ${factor.status === 'pass' ? 'bg-white/80' : factor.status === 'warn' ? 'bg-white/40' : 'bg-white/20'}`}></div>
                    <span className="text-[10px] font-mono text-white/70 flex-1">{factor.name}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-mono border border-white/15 ${factorStatusStyle(factor.status)}`}>
                      {factor.status.toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-mono ${factor.impact >= 0 ? 'text-white/60' : 'text-white/40'}`}>
                      {factor.impact >= 0 ? '+' : ''}{factor.impact}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Blocked - retry hint */}
        {scanResult && scanResult.decision === 'Blocked' && (
          <div className="text-center">
            <p className="text-[10px] font-mono text-white/30 mb-3">
              Your current device/network context does not meet the trust threshold.
            </p>
            <button
              onClick={() => setScanResult(null)}
              className="px-5 py-2 text-[10px] font-mono text-white/50 border border-white/20 hover:border-white/40 hover:text-white/70 transition-all"
            >
              RETRY VERIFICATION
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
