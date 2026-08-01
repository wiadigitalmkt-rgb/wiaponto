import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { PAGES, DEFAULT_PAGES } from '@/lib/accessControl';
import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import UserAccessRow from '@/components/admin/UserAccessRow';

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [accessMap, setAccessMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    if (user?.role !== 'admin') { setLoading(false); return; }
    Promise.all([
      base44.entities.User.list(),
      base44.entities.UserAccess.list(),
    ]).then(([allUsers, allAccess]) => {
      setUsers(allUsers);
      const map = {};
      allAccess.forEach(a => { map[a.user_email] = a; });
      setAccessMap(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const handleToggle = (userEmail, pageKey, checked) => {
    setAccessMap(prev => {
      const existing = prev[userEmail];
      const current = existing ? (existing.allowed_pages || []) : [...DEFAULT_PAGES];
      const newPages = checked ? [...current, pageKey] : current.filter(p => p !== pageKey);
      return { ...prev, [userEmail]: { ...existing, user_email: userEmail, allowed_pages: newPages } };
    });
  };

  const handleSave = async (userEmail, userName) => {
    const record = accessMap[userEmail];
    setSavingId(userEmail);
    try {
      if (record.id) {
        await base44.entities.UserAccess.update(record.id, { allowed_pages: record.allowed_pages });
      } else {
        const created = await base44.entities.UserAccess.create({
          user_email: userEmail,
          user_name: userName,
          allowed_pages: record.allowed_pages,
        });
        setAccessMap(prev => ({ ...prev, [userEmail]: created }));
      }
      toast.success('Acesso atualizado!');
    } catch (err) {
      toast.error('Erro: ' + (err.message || 'tente novamente'));
    }
    setSavingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[#1a2c6a]" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldCheck size={48} className="text-slate-300 mb-3" />
        <p className="text-sm text-slate-500">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-[#1a2c6a] flex items-center gap-2">
          <ShieldCheck size={22} /> Controle de Acesso
        </h2>
        <p className="text-sm text-slate-500 mt-1">Gerencie quais páginas cada usuário pode acessar</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          Por padrão, novos usuários têm acesso a todas as páginas <b>exceto Pró-Labore</b>.
          Marque a opção <b>Pró-Labore</b> apenas para sócios autorizados.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1a2c6a] text-white">
                <th className="text-left px-4 py-3 font-semibold">Usuário</th>
                {PAGES.map(p => (
                  <th key={p.key} className="text-center px-3 py-3 font-semibold whitespace-nowrap text-xs">{p.label}</th>
                ))}
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => u.email !== user.email).map(u => (
                <UserAccessRow
                  key={u.id}
                  user={u}
                  access={accessMap[u.email]}
                  onToggle={handleToggle}
                  onSave={handleSave}
                  saving={savingId === u.email}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}