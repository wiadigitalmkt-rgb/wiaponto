import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import ExtraPaymentSection from '@/components/financial/ExtraPaymentSection';

const fmt = (v) => (isNaN(v) ? 'R$ 0,00' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
const toNum = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; };

export default function FinancialSummary({ totals, employeeEmail, employeeName, month, year, isAdmin }) {
  const [recId, setRecId] = useState(null);
  const [baseSalary, setBaseSalary] = useState('');
  const [vales, setVales] = useState([]);
  const [extraPayments, setExtraPayments] = useState([]);
  const [extraTotalOverride, setExtraTotalOverride] = useState('');
  const [newVale, setNewVale] = useState({ description: '', date: '', amount: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!employeeEmail || !month || !year) return;

    Promise.all([
      base44.entities.FinancialRecord.filter({ employee_email: employeeEmail, month, year }),
      base44.entities.User.list(),
    ]).then(([records, users]) => {
      // Auto-load salary from User entity if no financial record or salary not set
      const userRecord = users.find(u => u.email === employeeEmail);
      const userSalary = userRecord?.base_salary ?? 0;

      if (records.length > 0) {
        const rec = records[0];
        setRecId(rec.id);
        // Use stored salary if set, otherwise fall back to user's base_salary
        const storedSalary = rec.base_salary;
        setBaseSalary(storedSalary > 0 ? storedSalary.toString() : (userSalary > 0 ? userSalary.toString() : ''));
        setVales((rec.discounts_list || []).map(d => ({
          description: d.description || '',
          date: d.date || '',
          amount: String(d.amount ?? '0'),
        })));
        setExtraPayments((rec.extra_payments_list || []).map(d => ({
          description: d.description || '',
          date: d.date || '',
          amount: String(d.amount ?? '0'),
        })));
        setExtraTotalOverride(rec.extra_total_override > 0 ? String(rec.extra_total_override) : '');
      } else {
        setRecId(null);
        setBaseSalary(userSalary > 0 ? userSalary.toString() : '');
        setVales([]);
        setExtraPayments([]);
        setExtraTotalOverride('');
      }
    });
  }, [employeeEmail, month, year]);

  // Calculations — extras e atraso ficam SEPARADOS do salário (pagos em dias distintos)
  const base = toNum(baseSalary);
  // Extras sempre calculados sobre salário base fixo (não exibido na tela)
  const EXTRA_SALARY_BASE = 1621;
  const extraHourlyRate = EXTRA_SALARY_BASE / 220;
  const he50Value   = (toNum(totals?.ot50)  / 60) * extraHourlyRate * 1.5;
  const he100Value  = (toNum(totals?.ot100) / 60) * extraHourlyRate * 2;
  const nightValue  = (toNum(totals?.night) / 60) * extraHourlyRate * 0.2;
  const lateValue   = (toNum(totals?.late)  / 60) * extraHourlyRate;
  const totalVales  = vales.reduce((sum, v) => sum + toNum(v.amount), 0);
  // Líquido = somente salário base menos vales (extras e atraso não entram aqui)
  const net         = base - totalVales;
  const totalExtra  = he50Value + he100Value + nightValue;

  const addVale = () => {
    if (!newVale.description.trim() || toNum(newVale.amount) <= 0) {
      toast.error('Preencha a descrição e o valor do vale.');
      return;
    }
    setVales(prev => [...prev, { ...newVale }]);
    setNewVale({ description: '', date: '', amount: '' });
  };

  const removeVale = (idx) => setVales(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaving(true);
    const data = {
      employee_email: employeeEmail,
      month,
      year,
      base_salary: toNum(baseSalary),
      discounts_list: vales.map(v => ({
        description: v.description,
        date: v.date,
        amount: toNum(v.amount),
      })),
      extra_payments_list: extraPayments.map(v => ({
        description: v.description,
        date: v.date,
        amount: toNum(v.amount),
      })),
      extra_total_override: toNum(extraTotalOverride),
    };
    if (recId) {
      await base44.entities.FinancialRecord.update(recId, data);
    } else {
      const created = await base44.entities.FinancialRecord.create(data);
      setRecId(created.id);
    }
    setSaving(false);
    toast.success('Dados financeiros salvos!');
  };

  return (
   <div className="space-y-5">
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-800">Status de Pagamento do Salário</h3>
          {employeeName && (
            <p className="text-xs font-semibold text-[#1a2c6a] mt-0.5 uppercase tracking-wide">
              {employeeName}
            </p>
          )}
        </div>
        {isAdmin && (
          <Button onClick={handleSave} disabled={saving} size="sm" variant="outline" className="gap-1.5">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Salvar
          </Button>
        )}
      </div>

      {/* ─── Stats row ─── */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        {/* Salário Base */}
        <div className="px-6 py-4">
          <p className="text-xs text-slate-500 mb-1">Salário Base</p>
          {isAdmin ? (
            <Input
              type="number"
              step="0.01"
              min="0"
              value={baseSalary}
              onChange={e => setBaseSalary(e.target.value)}
              placeholder="0,00"
              className="text-xl font-bold text-slate-800 h-8 border-0 p-0 shadow-none focus-visible:ring-0 w-full"
            />
          ) : (
            <p className="text-xl font-bold text-slate-800">{fmt(base)}</p>
          )}
          <p className="text-xs text-slate-400 mt-0.5">Conforme cadastro do colaborador</p>
        </div>

        {/* Total de Vales */}
        <div className="px-6 py-4">
          <p className="text-xs text-slate-500 mb-1">Total de Vales</p>
          <p className="text-xl font-bold text-red-500">{fmt(totalVales)}</p>
        </div>

        {/* Líquido */}
        <div className="px-6 py-4">
          <p className="text-xs text-slate-500 mb-1">Líquido</p>
          <p className="text-xl font-bold text-green-600">{fmt(net)}</p>
        </div>
      </div>

      {/* ─── Vales table ─── */}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="px-6 py-2 text-left text-xs font-semibold text-slate-500">Descrição</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Data do Vale</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Valor</th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500">Ações</th>
          </tr>
        </thead>
        <tbody>
          {vales.map((v, i) => (
            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
              <td className="px-6 py-2.5 font-medium text-slate-700 uppercase">{v.description || '—'}</td>
              <td className="px-4 py-2.5 text-slate-500">{v.date || '—'}</td>
              <td className="px-4 py-2.5 text-right font-mono text-slate-700">{fmt(toNum(v.amount))}</td>
              <td className="px-4 py-2.5">
                <div className="flex justify-center gap-1">
                  {isAdmin && (
                    <button
                      onClick={() => removeVale(i)}
                      className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}

          {/* ─── Add new vale row (admin only) ─── */}
          {isAdmin && (
            <tr className="border-t border-slate-100 bg-slate-50/40">
              <td className="px-4 py-2">
                <Input
                  placeholder="Descrição do vale"
                  value={newVale.description}
                  onChange={e => setNewVale(p => ({ ...p, description: e.target.value }))}
                  className="h-8 text-sm"
                />
              </td>
              <td className="px-2 py-2">
                <Input
                  type="date"
                  value={newVale.date}
                  onChange={e => setNewVale(p => ({ ...p, date: e.target.value }))}
                  className="h-8 text-sm"
                />
              </td>
              <td className="px-2 py-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newVale.amount}
                    onChange={e => setNewVale(p => ({ ...p, amount: e.target.value }))}
                    className="h-8 text-sm font-mono"
                  />
                </div>
              </td>
              <td className="px-2 py-2 text-center">
                <Button
                  size="icon"
                  onClick={addVale}
                  className="h-8 w-8 bg-[#1a2c6a] hover:bg-[#152358]"
                >
                  <Plus size={14} />
                </Button>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ─── Extras e atraso (separados do salário, pagos/descontados em dias distintos) ─── */}
      {(he50Value > 0 || he100Value > 0 || nightValue > 0 || lateValue > 0) && (
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Valores separados — não compõem o líquido</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-500">
            {he50Value > 0 && <span>HE 50%: <strong className="text-amber-600">{fmt(he50Value)}</strong></span>}
            {he100Value > 0 && <span>HE 100%: <strong className="text-orange-600">{fmt(he100Value)}</strong></span>}
            {nightValue > 0 && <span>Ad. Noturno: <strong className="text-indigo-600">{fmt(nightValue)}</strong></span>}
            {lateValue > 0 && <span>Atraso: <strong className="text-red-500">-{fmt(lateValue)}</strong></span>}
          </div>
        </div>
      )}
    </div>

    {/* ─── Status de Pagamento do Extra (separado do salário) ─── */}
    <ExtraPaymentSection
      extraPayments={extraPayments}
      setExtraPayments={setExtraPayments}
      totalExtra={totalExtra}
      extraTotalOverride={extraTotalOverride}
      setExtraTotalOverride={setExtraTotalOverride}
      isAdmin={isAdmin}
      onSave={handleSave}
      saving={saving}
    />
   </div>
  );
}
