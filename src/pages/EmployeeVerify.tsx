import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { ScanResult } from '@/lib/types';
import DashboardLayout from '@/components/DashboardLayout';
import { Shield, Monitor, Lock, Key, CheckCircle, Laptop, Wifi } from 'lucide-react';

interface Resource {
  _id: string;
  name: string;
  sensitivity: string;
}

export default function EmployeeVerify() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [scanResult, setScanResult] = useState<{
    scanId: string;
    trustScore: number;
    decision: string;
    mfaVerified: boolean;
    resource?: { name: string };
    factors: Array<{ name: string; status: string }>;
    accessGranted?: boolean;
  } | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await api.resources.getAll();
        setResources(data.resources || []);
        if (data.resources?.length > 0) {
          setSelectedResourceId(data.resources[0]._id);
        }
      } catch (error) {
        console.error('Failed to fetch resources', error);
      }
    };
    fetchResources();
  }, []);

  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');

  const handleScan = async () => {
    if (!user || !selectedResourceId) return;
    setScanning(true);
    try {
      const result = await api.verification.initiateScan(selectedResourceId);
      setScanResult(result);
    } catch (error) {
      console.error('Scan failed', error);
      alert('Verification server error. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleMfaVerify = () => {
    setMfaCode('');
    setMfaError('');
    setMfaModalOpen(true);
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanResult || !mfaCode) return;

    setVerifying(true);
    setMfaError('');
    try {
      const updated = await api.verification.verifyMFA(scanResult.scanId, mfaCode);
      setScanResult(updated);
      setMfaModalOpen(false);
    } catch (error) {
      console.error('MFA verification failed', error);
      setMfaError('Invalid authentication code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const isAllowed = scanResult?.decision === 'allow' || scanResult?.mfaVerified || scanResult?.accessGranted;

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
    <DashboardLayout title="ACCESS VERIFICATION" subtitle="IDENTITY & DEVICE TRUST CHECK REQUIRED">
      <div className="max-w-2xl mx-auto">
        <div className="border border-white/20 p-6 mb-6 text-center">
          <Shield size={32} className="text-white/40 mx-auto mb-3" />
          <h2 className="text-lg font-mono text-white tracking-wider mb-2">
            {!scanResult ? 'VERIFICATION REQUIRED' :
              isAllowed ? 'ACCESS GRANTED' :
                scanResult.decision === 'mfa_required' ? 'ADDITIONAL VERIFICATION NEEDED' :
                  'ACCESS DENIED'}
          </h2>
          <p className="text-[10px] font-mono text-white/40">
            {!scanResult
              ? 'Complete a device trust scan to access your dashboard'
              : isAllowed
                ? 'Your identity and device have been verified. You may proceed.'
                : scanResult.decision === 'mfa_required'
                  ? 'Your trust score requires step-up authentication.'
                  : 'Your device does not meet security requirements.'}
          </p>
        </div>

        {isAllowed && (
          <div className="text-center mb-6">
            <button
              onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/employee')}
              className="relative px-8 py-3 bg-transparent text-white font-mono text-sm border border-white hover:bg-white hover:text-black transition-all duration-200 group"
            >
              <span className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
              PROCEED TO DASHBOARD →
            </button>
          </div>
        )}

        {!isAllowed && (
          <div className="border border-white/20 p-4 lg:p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-px bg-white/40"></div>
              <span className="text-[10px] font-mono text-white/50 tracking-wider">ACCESS REQUEST</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <div className="mb-4">
              <label className="block text-[10px] font-mono text-white/40 mb-1.5 tracking-wider">TARGET RESOURCE</label>
              <div className="flex flex-wrap gap-2">
                {resources.map(r => (
                  <button
                    key={r._id}
                    onClick={() => setSelectedResourceId(r._id)}
                    className={`px-3 py-1.5 text-[10px] font-mono border transition-all duration-200 ${selectedResourceId === r._id
                      ? 'border-white text-white bg-white/20'
                      : 'border-white/10 text-white/40 hover:text-white/60 hover:border-white/40'
                      }`}
                  >
                    {r.name.toUpperCase()}
                  </button>
                ))}
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

        {scanResult && (
          <div className="border border-white/20 p-4 lg:p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-px bg-white/40"></div>
              <span className="text-[10px] font-mono text-white/50 tracking-wider">SCAN RESULT</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-white/50 tracking-wider">TRUST SCORE</span>
                <span className={`text-xl font-mono font-bold ${scanResult.trustScore >= 60 ? 'text-green-400' : 'text-red-400'}`}>{scanResult.trustScore}/100</span>
              </div>
              <div className="w-full h-2 bg-white/10 border border-white/20">
                <div
                  className={`h-full transition-all duration-1000 ease-out ${scanResult.trustScore >= 60 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${scanResult.trustScore}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-4 text-[10px] font-mono">
              <div className="flex items-center gap-2">
                <span className="text-white/50">DECISION:</span>
                <span className={`px-2 py-0.5 border ${decisionStyle(scanResult.decision)}`}>
                  {scanResult.decision?.toUpperCase()}
                  {scanResult.mfaVerified && ' ✓ MFA'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/50">RESOURCE:</span>
                <span className="text-white/80">{scanResult.resource?.name?.toUpperCase() || 'UNKNOWN'}</span>
              </div>
            </div>

            {scanResult.decision === 'mfa_required' && !scanResult.mfaVerified && (
              <div className="border border-yellow-500/20 p-4 space-y-3 mb-4 bg-yellow-500/5">
                <div className="flex items-center gap-2">
                  <Key size={14} className="text-yellow-400" />
                  <span className="text-[10px] font-mono text-yellow-400/90 tracking-wider uppercase">ADDITIONAL VERIFICATION REQUIRED</span>
                </div>
                <button
                  onClick={handleMfaVerify}
                  disabled={verifying}
                  className="w-full py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20 transition-all font-mono text-[10px]"
                >
                  {verifying ? '◐ VERIFYING...' : 'VERIFY WITH MFA'}
                </button>
              </div>
            )}

            {scanResult.factors && scanResult.factors.length > 0 && (
              <div className="space-y-1.5 mt-4">
                <div className="text-[9px] font-mono text-white/30 tracking-widest mb-2">DECISION FACTORS</div>
                {scanResult.factors.map((factor, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 border border-white/5 bg-white/[0.02]">
                    <div className={`w-1.5 h-1.5 shrink-0 ${factor.status === 'pass' ? 'bg-green-500' : factor.status === 'warn' ? 'bg-yellow-500' : factor.status === 'fail' ? 'bg-red-500' : 'bg-white/20'}`}></div>
                    <span className="text-[10px] font-mono text-white/70 flex-1">{factor.name}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-mono border ${factorStatusStyle(factor.status)}`}>
                      {factor.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MFA Modal */}
      {mfaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-black border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)] relative">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/50"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/50"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/50"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/50"></div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 border border-white/10 bg-white/5">
                  <Key size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold text-white tracking-wider">STEP-UP AUTHENTICATION</h3>
                  <p className="text-[10px] font-mono text-white/50">ENTER YOUR 6-DIGIT MFA TOKEN</p>
                </div>
              </div>

              <form onSubmit={handleMfaSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-white/40 block">AUTHENTICATOR CODE</label>
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full bg-black border border-white/20 p-3 text-center font-mono text-xl tracking-[0.5em] text-white focus:border-white/50 focus:outline-none placeholder:text-white/10"
                    autoFocus
                  />
                  <p className="text-[9px] font-mono text-white/30 text-center pt-2">
                    USE TEST CODE: <span className="text-white/60">123456</span>
                  </p>
                </div>

                {mfaError && (
                  <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-2 border border-red-500/20 justify-center">
                    {/* Assuming AlertTriangle is imported, if not I might need to check imports */}
                    <span className="text-[10px] font-mono">{mfaError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMfaModalOpen(false)}
                    className="py-3 border border-white/10 text-[10px] font-mono text-white/60 hover:bg-white/5 transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={verifying || mfaCode.length !== 6}
                    className="py-3 bg-white text-black text-[10px] font-mono font-bold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifying ? 'VERIFYING...' : 'CONFIRM ACCESS'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
