import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { calculateDayMetrics, minutesToHHMM, PUNCH_LABELS } from '@/lib/clockUtils';
import { exportMirrorPDF } from '@/components/ExportPDF';
import SelfieDialog from '@/components/SelfieDialog';
import EditPunchDialog from '@/components/EditPunchDialog';
import ImportPunchDialog from '@/components/ImportPunchDialog';
import FinancialSummary from '@/components/FinancialSummary';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Loader2, ChevronLeft, ChevronRight, Camera, Pencil, Upload, User } from 'lucide-react';

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function TimeClockMirror() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(user?.email || '');
  const [selfie, setSelfie] = useState({ open: false, punch: null, record: null });
  const [editDay, setEditDay] = useState({ open: false, record: null, date: '' });
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      base44.entities.User.list().then(u => {
        setUsers(u);
        if (!selectedEmail) setSelectedEmail(u[0]?.email || user.email);
      });
    } else {
      setSelectedEmail(user.email);
    }
  }, [isAdmin]);

  const targetEmail = isAdmin ? selectedEmail : user.email;

  const load = useCallback(() => {
    if (!targetEmail) return;
    setLoading(true);
    Promise.all([
      base44.entities.TimeClock.filter({ employee_email: targetEmail }),
      base44.entities.AppSettings.list(),
    ]).then(([all, s]) => {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      setRecords(all.filter(r => r.date?.startsWith(prefix)));
      if (s.length > 0) setSettings(s[0]);
      setLoading(false);
    });
  }, [targetEmail, month, year]);

  useEffect(() => { load(); }, [load]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const satRef = settings?.saturday_schedule_start;

  let totals = { worked: 0, late: 0, ot50: 0, ot100: 0, night: 0 };

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dt = new Date(dateStr + 'T12:00:00');
    const dow = dt.getDay();
    const rec = records.find(r => r.date === dateStr) || {};
    const metrics = calculateDayMetrics(rec, settings, satRef);
    totals.worked += metrics.totalWorked;
    totals.late += metrics.lateness;
    totals.ot50 += metrics.overtime50;
    totals.ot100 += metrics.overtime100;
    totals.night += metrics.nightMinutes;
    return { d, dateStr, dow, rec, metrics };
  });

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const selectedUser = users.find(u => u.email === selectedEmail);
  const displayName = isAdmin ? (selectedUser?.full_name || selectedEmail) : user?.full_name;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-[#1a2c6a]">Espelho de Ponto</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft size={16} /></Button>
            <span className="text-sm font-semibold min-w-[150px] text-center">{MONTH_NAMES[month-1]} {year}</span>
            <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight size={16} /></Button>
            {isAdmin && (
              <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-1.5 text-xs">
                <Upload size={14} /> Importar
              </Button>
            )}
            <Button
              onClick={() => exportMirrorPDF(records, month, year, displayName || '', settings, satRef)}
              className="bg-[#1a2c6a] hover:bg-[#152358] text-white text-xs"
            >
              <FileDown size={14} className="mr-1.5" /> Exportar PDF
            </Button>
          </div>
        </div>

        {/* Admin employee selector */}
        {isAdmin && (
          <div className="flex items-center gap-3 bg-[#1a2c6a]/5 border border-[#1a2c6a]/20 rounded-xl px-4 py-3">
            <User size={16} className="text-[#1a2c6a]" />
            <span className="text-sm text-slate-600 font-medium whitespace-nowrap">Colaborador:</span>
            <Select value={selectedEmail} onValueChange={setSelectedEmail}>
              <SelectTrigger className="flex-1 max-w-xs h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.email} value={u.email}>{u.full_name} ({u.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-[#1a2c6a]" /></div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#1a2c6a] text-white">
                  {['Dia', 'Sem', 'Entrada', 'Intervalo', 'Retorno', 'Saída', 'Trab.', 'Atraso', 'HE 50%', 'HE 100%', 'Not.', isAdmin ? 'Ações' : ''].filter(Boolean).map(h => (
                    <th key={h} className="px-2.5 py-2.5 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map(({ d, dateStr, dow, rec, metrics }) => {
                  const rowBg = dow === 0 || metrics.isHoliday ? 'bg-red-50' : dow === 6 ? 'bg-amber-50' : d % 2 === 0 ? 'bg-slate-50' : '';
                  const rowText = dow === 0 || metrics.isHoliday ? 'text-red-600' : '';
                  return (
                    <tr key={d} className={`border-b border-slate-100 ${rowBg} ${rowText}`}>
                      <td className="px-2.5 py-1.5 font-mono font-semibold">{String(d).padStart(2,'0')}</td>
                      <td className="px-2.5 py-1.5">{WEEK_DAYS[dow]}</td>
                      {['entry', 'break', 'return', 'exit'].map(p => (
                        <td key={p} className="px-2.5 py-1.5">
                          <div className="flex items-center gap-1">
                            <span className="font-mono">{rec[`${p}_time`] || '-'}</span>
                            {rec[`${p}_photo`] && (
                              <button
                                onClick={() => setSelfie({ open: true, punch: p, record: rec })}
                                className="text-[#92e5f7] hover:text-[#1a2c6a] transition-colors"
                                title={`Ver selfie ${PUNCH_LABELS[p]}`}
                              >
                                <Camera size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      ))}
                      <td className="px-2.5 py-1.5 font-mono font-semibold">{metrics.totalWorked ? minutesToHHMM(metrics.totalWorked) : '-'}</td>
                      <td className="px-2.5 py-1.5 font-mono text-red-500">{metrics.lateness ? minutesToHHMM(metrics.lateness) : '-'}</td>
                      <td className="px-2.5 py-1.5 font-mono text-amber-600">{metrics.overtime50 ? minutesToHHMM(metrics.overtime50) : '-'}</td>
                      <td className="px-2.5 py-1.5 font-mono text-orange-600">{metrics.overtime100 ? minutesToHHMM(metrics.overtime100) : '-'}</td>
                      <td className="px-2.5 py-1.5 font-mono text-indigo-600">{metrics.nightMinutes ? minutesToHHMM(metrics.nightMinutes) : '-'}</td>
                      {isAdmin && (
                        <td className="px-2.5 py-1.5">
                          <button
                            onClick={() => setEditDay({ open: true, record: rec.date ? rec : null, date: dateStr })}
                            className="p-1 rounded hover:bg-[#ff8b00]/10 text-slate-400 hover:text-[#ff8b00] transition-colors"
                            title="Editar ponto"
                          >
                            <Pencil size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#ff8b00] text-white font-semibold">
                  <td colSpan={6} className="px-2.5 py-2.5">TOTAIS</td>
                  <td className="px-2.5 py-2.5 font-mono">{minutesToHHMM(totals.worked)}</td>
                  <td className="px-2.5 py-2.5 font-mono">{minutesToHHMM(totals.late)}</td>
                  <td className="px-2.5 py-2.5 font-mono">{minutesToHHMM(totals.ot50)}</td>
                  <td className="px-2.5 py-2.5 font-mono">{minutesToHHMM(totals.ot100)}</td>
                  <td className="px-2.5 py-2.5 font-mono">{minutesToHHMM(totals.night)}</td>
                  {isAdmin && <td />}
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Financial section */}
          <FinancialSummary
            totals={totals}
            employeeEmail={targetEmail}
            employeeName={displayName}
            month={month}
            year={year}
            isAdmin={isAdmin}
          />
        </>
      )}

      {/* Dialogs */}
      <SelfieDialog
        punch={selfie.punch}
        record={selfie.record}
        open={selfie.open}
        onClose={() => setSelfie({ open: false, punch: null, record: null })}
      />
      <EditPunchDialog
        record={editDay.record}
        date={editDay.date}
        employeeEmail={targetEmail}
        open={editDay.open}
        onClose={() => setEditDay({ open: false, record: null, date: '' })}
        onSaved={load}
      />
      <ImportPunchDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={load}
        employeeEmail={targetEmail}
      />
    </div>
  );
}
