import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getNextPunchType, timeToMinutes, PUNCH_LABELS } from '@/lib/clockUtils';
import PunchButtons from '@/components/PunchButtons';
import GeolocationCapture from '@/components/GeolocationCapture';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PunchClock() {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [settings, setSettings] = useState(null);
  const [selectedPunch, setSelectedPunch] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [justification, setJustification] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const nextPunch = getNextPunchType(todayRecord);
  const isDone = nextPunch === 'done';

  // Check if late (entry after tolerance)
  const isLateEntry = useCallback(() => {
    if (selectedPunch !== 'entry') return false;
    const now = new Date();
    const workStart = timeToMinutes(settings?.work_start_time || '08:00');
    const tolerance = settings?.tolerance_minutes || 10;
    const currentMin = now.getHours() * 60 + now.getMinutes();
    return currentMin > workStart + tolerance;
  }, [selectedPunch, settings]);

  useEffect(() => {
    Promise.all([
      base44.entities.TimeClock.filter({ date: today, employee_email: user?.email }),
      base44.entities.AppSettings.list(),
    ]).then(([records, settingsArr]) => {
      if (records.length > 0) setTodayRecord(records[0]);
      if (settingsArr.length > 0) setSettings(settingsArr[0]);
      setLoading(false);
    });
  }, [today, user]);

  const handleSave = async () => {
    if (!geoData) return;
    if (isLateEntry() && !justification.trim()) {
      toast.error('Justificativa obrigatória para entrada com atraso!');
      return;
    }

    setSaving(true);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const prefix = selectedPunch;

    const data = {
      [`${prefix}_time`]: timeStr,
      [`${prefix}_address`]: geoData.address,
      [`${prefix}_lat`]: geoData.lat,
      [`${prefix}_lng`]: geoData.lng,
    };

    if (prefix === 'entry' && justification.trim()) {
      data.entry_justification = justification;
    }
    if (prefix === 'exit') {
      data.status = 'complete';
    }

    try {
      let record;
      if (todayRecord) {
        record = await base44.entities.TimeClock.update(todayRecord.id, data);
        setTodayRecord({ ...todayRecord, ...data });
      } else {
        record = await base44.entities.TimeClock.create({
          date: today,
          employee_email: user.email,
          employee_name: user.full_name,
          status: 'incomplete',
          ...data,
        });
        setTodayRecord(record);
      }

      // Auto-create request for late entry
      if (prefix === 'entry' && isLateEntry()) {
        await base44.entities.TimeClockRequest.create({
          timeclock_id: record.id || todayRecord?.id,
          date: today,
          employee_email: user.email,
          employee_name: user.full_name,
          request_type: 'justification',
          clock_type: 'entry',
          reason: justification,
          old_time: settings?.work_start_time || '08:00',
          new_time: timeStr,
          status: 'pending',
        });
      }

      setSelectedPunch(null);
      setGeoData(null);
      setJustification('');
      toast.success(`${PUNCH_LABELS[prefix]} registrada com sucesso!`);
    } catch (err) {
      toast.error('Erro ao registrar ponto: ' + (err.message || 'tente novamente'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[#1a2c6a]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-[#1a2c6a]">Bate-Ponto</h2>
        <p className="text-sm text-slate-500 mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          {' · '}
          <span className="font-mono">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </p>
      </div>

      {isDone ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-green-800">Jornada Completa!</h3>
          <p className="text-sm text-green-600 mt-1">Todos os pontos do dia foram registrados.</p>
          <div className="flex justify-center gap-4 mt-4">
            {['entry', 'break', 'return', 'exit'].map(t => (
              <div key={t} className="text-center">
                <p className="text-xs text-green-600">{PUNCH_LABELS[t]}</p>
                <p className="font-mono font-bold text-green-800">{todayRecord?.[`${t}_time`]}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <PunchButtons nextPunch={nextPunch} selected={selectedPunch} onSelect={setSelectedPunch} />

          {selectedPunch && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Late entry warning */}
              {isLateEntry() && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Entrada com atraso detectada</p>
                    <p className="text-xs text-amber-600 mt-1">Justificativa obrigatória para prosseguir.</p>
                    <Textarea
                      value={justification}
                      onChange={e => setJustification(e.target.value)}
                      placeholder="Descreva o motivo do atraso..."
                      className="mt-3"
                      rows={2}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">📍 Localização</label>
                <GeolocationCapture onCapture={setGeoData} captured={geoData} />
              </div>

              {!geoData && (
                <div className="flex gap-4 text-xs text-slate-400">
                  <span className={`flex items-center gap-1 ${geoData ? 'text-green-600' : 'text-amber-500'}`}>
                    {geoData ? '✓' : '⚠'} GPS {geoData ? 'capturado' : 'obrigatório'}
                  </span>
                </div>
              )}
              <Button
                onClick={handleSave}
                disabled={saving || !geoData || (isLateEntry() && !justification.trim())}
                className="w-full h-14 text-base font-bold bg-[#ff8b00] hover:bg-[#e67a00] text-white rounded-xl shadow-lg shadow-[#ff8b00]/25"
              >
                {saving ? <Loader2 size={20} className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                Registrar {PUNCH_LABELS[selectedPunch]}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
