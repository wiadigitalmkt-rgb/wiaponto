import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

export function useUserAccess() {
  const { user } = useAuth();
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) { setLoading(false); return; }
    if (user.role === 'admin') { setAccess(null); setLoading(false); return; }
    base44.entities.UserAccess.filter({ user_email: user.email })
      .then(records => { setAccess(records[0] || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  return { access, loading };
}