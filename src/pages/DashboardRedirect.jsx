import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/** Redirects authenticated users to their role-based dashboard */
export default function DashboardRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to="/verify" replace />;
}
