import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(username, password);
      setLoading(false);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'AUTHENTICATION_FAILED — INVALID CREDENTIALS');
      }
    } catch (err: unknown) {
      setLoading(false);
      console.error('Login submit error:', err);
      setError(`CONNECTION_ERROR — ${(err as Error)?.message || 'UNKNOWN'}`);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Corner Frame Accents */}
      <div className="absolute top-0 left-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-l-2 border-white/30 z-20"></div>
      <div className="absolute top-0 right-0 w-8 h-8 lg:w-12 lg:h-12 border-t-2 border-r-2 border-white/30 z-20"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-l-2 border-white/30 z-20"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 lg:w-12 lg:h-12 border-b-2 border-r-2 border-white/30 z-20"></div>

      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-20 border-b border-white/20">
        <div className="container mx-auto px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="font-mono text-white text-xl lg:text-2xl font-bold tracking-widest italic transform -skew-x-12">
              SoraIAM
            </div>
            <div className="h-3 lg:h-4 w-px bg-white/40"></div>
            <span className="text-white/60 text-[8px] lg:text-[10px] font-mono">ZERO.TRUST</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-white/60">
            <span>◐ SECURE.GATEWAY</span>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {/* Top decorative line */}
          <div className="flex items-center gap-2 mb-4 opacity-60">
            <div className="w-8 h-px bg-white"></div>
            <span className="text-white text-[10px] font-mono tracking-wider">◈</span>
            <div className="flex-1 h-px bg-white"></div>
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2 font-mono tracking-wider" style={{ letterSpacing: '0.1em' }}>
            AUTHENTICATE
          </h1>
          <p className="text-xs text-white/50 font-mono mb-8">
            ZERO TRUST ACCESS PROTOCOL — IDENTITY VERIFICATION REQUIRED
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-white/60 mb-1 tracking-wider">USERNAME</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-transparent border border-white/30 text-white font-mono text-sm px-4 py-3 min-h-[44px] focus:outline-none focus:border-white transition-colors placeholder:text-white/20"
                placeholder="enter username"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-white/60 mb-1 tracking-wider">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-transparent border border-white/30 text-white font-mono text-sm px-4 py-3 min-h-[44px] focus:outline-none focus:border-white transition-colors placeholder:text-white/20"
                placeholder="enter password"
                required
              />
            </div>

            {error && (
              <div className="border border-white/30 px-3 py-2 text-[10px] font-mono text-white/80 bg-white/5">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full relative px-6 py-3 min-h-[44px] bg-transparent text-white font-mono text-sm border border-white hover:bg-white hover:text-black transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              <span className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-white opacity-0 group-hover:opacity-100 transition-opacity"></span>
              {loading ? 'VERIFYING...' : 'INITIATE ACCESS'}
            </button>
          </form>



          {/* Bottom decorative */}
          <div className="flex items-center gap-2 mt-6 opacity-40">
            <span className="text-white text-[9px] font-mono">◈</span>
            <div className="flex-1 h-px bg-white"></div>
            <span className="text-white text-[9px] font-mono">AUTH.PROTOCOL.V1</span>
          </div>
        </div>
      </div>


    </main>
  );
}
