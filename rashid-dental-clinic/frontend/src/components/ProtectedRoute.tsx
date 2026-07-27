import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/lib/types';

export function ProtectedRoute({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setLocation('/login');
    } else if (user.role !== role) {
      // Logged in, but wrong role for this area — send them to their own dashboard.
      setLocation(user.role === 'admin' ? '/admin' : '/patient');
    }
  }, [user, loading, role, setLocation]);

  if (loading) {
    return (
      <div className="empty" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span>Loading…</span>
      </div>
    );
  }

  if (!user || user.role !== role) return null;

  return <>{children}</>;
}
