import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requireVerification?: boolean;
}

export default function ProtectedRoute({ children, requiredRole, requireVerification = true }: ProtectedRouteProps) {
  const { isAuthenticated, user, isVerified } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // If verification is required but not completed, redirect to verify page
  if (requireVerification && !isVerified) return <Navigate to="/verify" replace />;

  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
