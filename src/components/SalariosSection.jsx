import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SalariosSection({ users }) {
  const [salaries, setSalaries] = useState({});
  const [saving, setSaving] = useState({});

  // Pre-load all salaries from users list
  useEffect(() => {
    const map = {};
    users.forEach(u => { map[u.email] = u.base_salary != null ? String(u.base_salary) : ''; });
    setSalaries(map);
  }, [users]);

  const handleSave = async (u) => {
    setSaving(prev => ({ ...prev, [u.email]: true }));
    await base44.entities.User.update(u.id, { base_salary: parseFloat(salaries[u.email]) || 0 });
    setSaving(prev => ({ ...prev, [u.email]: false }));
    toast.success(`Salário de ${u.full_name} atualizado!`);
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-[#1a2c6a] px-5 py-3">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <DollarSign size={16} /> Salários dos Colaboradores
        </h3>
      </div>
      <div className="p-5 space-y-3">
        {users.map(u => (
          <div key={u.email} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{u.full_name}</p>
              <p className="text-xs text-slate-400 truncate">{u.email}</p>
            </div>
            <div className="flex items-center gap-1 w-44">
              <span className="text-xs text-slate-400 shrink-0">R$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={salaries[u.email] ?? ''}
                onChange={e => setSalaries(prev => ({ ...prev, [u.email]: e.target.value }))}
                className="h-8 text-sm font-mono"
              />
            </div>
            <Button
              size="sm"
              onClick={() => handleSave(u)}
              disabled={saving[u.email]}
              className="h-8 px-3 bg-[#1a2c6a] hover:bg-[#152358] text-white shrink-0"
            >
              {saving[u.email] ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            </Button>
          </div>
        ))}
        {users.length === 0 && (
          <p className="text-xs text-slate-400 italic">Nenhum colaborador encontrado.</p>
        )}
      </div>
    </section>
  );
}