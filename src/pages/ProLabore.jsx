import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useUserAccess } from '@/hooks/useUserAccess';
import { hasPageAccess } from '@/lib/accessControl';
import { Loader2 } from 'lucide-react';
import AdminView from '@/components/prolabore/AdminView';
import SocioView from '@/components/prolabore/SocioView';
import AccessDenied from '@/components/prolabore/AccessDenied';

export default function ProLabore() {
  const { user } = useAuth();
  const { access, loading: accessLoading } = useUserAccess();
  const [loading, setLoading] = useState(true);
  const [socios, setSocios] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    if (!user?.email) return;
    Promise.all([
      base44.entities.Socio.list(),
      base44.entities.ProLaborePayment.list(),
    ]).then(([s, p]) => {
      setSocios(s);
      setPayments(p);
      setLoading(false);
    });
  }, [user]);

  if (loading || accessLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[#1a2c6a]" />
      </div>
    );
  }

  if (!hasPageAccess(user, access, 'prolabore')) return <AccessDenied />;
  if (user.role === 'admin') return <AdminView socios={socios} payments={payments} setSocios={setSocios} setPayments={setPayments} />;

  const socio = socios.find(s => s.email === user.email);
  if (socio) return <SocioView socio={socio} payments={payments} />;
  return <AccessDenied />;
}
