import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navigate } from 'react-router-dom';
import { Loader2, Save, Shield, Upload, Award } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [settings, setSettings] = useState(null);
  const [settingsId, setSettingsId] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      base44.entities.AppSettings.list(),
      base44.entities.User.list(),
    ]).then(([s, u]) => {
      setUsers(u);
      if (s.length > 0) {
        setSettings(s[0]);
        setSettingsId(s[0].id);
      } else {
        setSettings({
          work_start_time: '08:00', work_end_time: '17:00',
          lunch_duration_minutes: 60, tolerance_minutes: 10,
          saturday_schedule_start: '',
          employee_of_month_name: '', employee_of_month_photo: '',
          employee_of_month_role: '', employee_of_month_reason: '',
        });
      }
      setLoading(false);
    });
  }, [isAdmin]);

  if (!isAdmin) return <Navigate to="/" replace />;

  const handleSave = async () => {
    setSaving(true);
    if (settingsId) {
      await base44.entities.AppSettings.update(settingsId, settings);
    } else {
      const created = await base44.entities.AppSettings.create(settings);
      setSettingsId(created.id);
    }
    setSaving(false);
    toast.success('Configurações salvas com sucesso!');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setSettings({ ...settings, employee_of_month_photo: file_url });
    toast.success('Foto atualizada!');
  };

  const handleEmployeeSelect = (email) => {
    const u = users.find(x => x.email === email);
    if (!u) return;
    setSettings({ ...settings, employee_of_month_name: u.full_name, employee_of_month_email: email });
  };

  const update = (key, val) => setSettings({ ...settings, [key]: val });

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-[#1a2c6a]" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Shield size={24} className="text-[#1a2c6a]" />
        <h2 className="text-xl font-bold text-[#1a2c6a]">Configurações do Sistema</h2>
      </div>

      {/* Jornada */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-[#1a2c6a] px-5 py-3">
          <h3 className="text-white font-semibold text-sm">Jornada de Trabalho e Tolerâncias</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Início da Jornada</label>
              <Input type="time" value={settings.work_start_time || ''} onChange={e => update('work_start_time', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Fim da Jornada</label>
              <Input type="time" value={settings.work_end_time || ''} onChange={e => update('work_end_time', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Intervalo (minutos)</label>
              <Input type="number" value={settings.lunch_duration_minutes || 60} onChange={e => update('lunch_duration_minutes', Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Tolerância CLT (minutos)</label>
              <Input type="number" value={settings.tolerance_minutes || 10} onChange={e => update('tolerance_minutes', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Referência Escala de Sábados</label>
            <Input type="date" value={settings.saturday_schedule_start || ''} onChange={e => update('saturday_schedule_start', e.target.value)} />
            <p className="text-[11px] text-slate-400 mt-1">Informe a data de um sábado trabalhado para calcular a alternância da escala.</p>
          </div>
        </div>
      </section>


      {/* Employee of Month */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-[#ff8b00] px-5 py-3">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <Award size={16} /> Colaborador do Mês
          </h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Selecionar Colaborador</label>
            <Select
              value={settings.employee_of_month_email || ''}
              onValueChange={handleEmployeeSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha o colaborador do mês..." />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.email} value={u.email}>{u.full_name} — {u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Nome (editável)</label>
              <Input value={settings.employee_of_month_name || ''} onChange={e => update('employee_of_month_name', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Cargo</label>
              <Input value={settings.employee_of_month_role || ''} onChange={e => update('employee_of_month_role', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Foto</label>
            <div className="flex items-center gap-3">
              {settings.employee_of_month_photo && (
                <img src={settings.employee_of_month_photo} alt="" className="w-12 h-12 rounded-lg object-cover border-2 border-[#ff8b00]/30" />
              )}
              <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 text-sm text-slate-500 hover:border-[#ff8b00] hover:text-[#ff8b00] transition-colors">
                <Upload size={14} /> Enviar foto
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Elogio / Motivo do Reconhecimento</label>
            <Textarea value={settings.employee_of_month_reason || ''} onChange={e => update('employee_of_month_reason', e.target.value)} rows={2} placeholder="Ex: Superou todas as metas do mês com excelência..." />
          </div>
        </div>
      </section>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-12 bg-[#ff8b00] hover:bg-[#e67a00] text-white font-semibold text-base shadow-lg shadow-[#ff8b00]/25"
      >
        {saving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
        Salvar Configurações
      </Button>
    </div>
  );
}
