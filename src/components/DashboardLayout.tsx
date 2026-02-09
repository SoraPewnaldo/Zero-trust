import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function DashboardLayout({ title, subtitle, children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <main className="relative min-h-screen bg-black">
      {/* Top Header */}
      <div className="border-b border-white/20">
        <div className="container mx-auto px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 lg:gap-4">
            <div
              className="font-mono text-white text-xl lg:text-2xl font-bold tracking-widest italic transform -skew-x-12 cursor-pointer"
              onClick={() => navigate('/')}
            >
              UIMIX
            </div>
            <div className="h-3 lg:h-4 w-px bg-white/40"></div>
            <span className="text-white/60 text-[8px] lg:text-[10px] font-mono">ZERO.TRUST</span>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <span className="text-[10px] font-mono text-white/50">
              {user?.username.toUpperCase()} [{user?.role.toUpperCase()}]
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-[10px] font-mono text-white/60 border border-white/20 hover:bg-white hover:text-black transition-all duration-200"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-10">
        {/* Page Title */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center gap-2 mb-3 opacity-60">
            <div className="w-8 h-px bg-white"></div>
            <span className="text-white text-[10px] font-mono tracking-wider">◈</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>
          <h1 className="text-xl lg:text-3xl font-bold text-white font-mono tracking-wider" style={{ letterSpacing: '0.1em' }}>
            {title}
          </h1>
          <p className="text-[10px] lg:text-xs text-white/40 font-mono mt-1">{subtitle}</p>
        </div>

        {children}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/20 bg-black/80 backdrop-blur-sm z-20">
        <div className="container mx-auto px-4 lg:px-8 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[8px] lg:text-[9px] font-mono text-white/40">
            <span>SYSTEM.ACTIVE</span>
            <span>V1.0.0</span>
          </div>
          <div className="flex items-center gap-2 text-[8px] lg:text-[9px] font-mono text-white/40">
            <div className="w-1 h-1 bg-white/60 rounded-full animate-pulse"></div>
            <span>SECURE.CONNECTION</span>
          </div>
        </div>
      </div>
    </main>
  );
}
