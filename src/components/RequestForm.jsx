import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function RequestForm({ onCreated }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    request_type: 'justification',
    clock_type: 'entrada',
    reason: '',
    old_time: '',
    new_time: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason.trim()) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('TimeClockRequest').insert([
        {
          ...form,
          employee_email: user?.email || '',
          employee_name: user?.full_name || user?.name || '',
          employee_id: user?.id || null,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      toast.success('Solicitação enviada com sucesso!');
      setForm({ ...form, reason: '', old_time: '', new_time: '' });
      onCreated?.();
    } catch (err) {
      console.error('Erro ao enviar solicitação:', err);
      toast.error('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Data</label>
          <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Tipo</label>
          <Select value={form.request_type} onValueChange={v => setForm({...form, request_type: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="justification">Justificativa</SelectItem>
              <SelectItem value="correction">Correção</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Batida</label>
          <Select value={form.clock_type} onValueChange={v => setForm({...form, clock_type: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="intervalo">Intervalo</SelectItem>
              <SelectItem value="retorno">Retorno</SelectItem>
              <SelectItem value="saida">Saída</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {form.request_type === 'correction' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Horário Original</label>
            <Input type="time" value={form.old_time} onChange={e => setForm({...form, old_time: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Novo Horário</label>
            <Input type="time" value={form.new_time} onChange={e => setForm({...form, new_time: e.target.value})} />
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-slate-600 mb-1 block">Motivo / Justificativa</label>
        <Textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} rows={3} placeholder="Descreva o motivo da solicitação..." />
      </div>

      <Button type="submit" disabled={loading || !form.reason.trim()} className="bg-[#ff8b00] hover:bg-[#e67a00] text-white w-full">
        {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
        Enviar Solicitação
      </Button>
    </form>
  );
}
