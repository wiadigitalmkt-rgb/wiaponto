import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Save, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

const fmt = (v) => (isNaN(v) ? 'R$ 0,00' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
const toNum = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; };

export default function ExtraPaymentSection({
  extraPayments,
  setExtraPayments,
  totalExtra,
  extraTotalOverride,
  setExtraTotalOverride,
  isAdmin,
  onSave,
  saving
}) {
  const [newPay, setNewPay] = useState({ description: '', date: '', amount: '' });
  const [editingTotal, setEditingTotal] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type: 'add' | 'save' | 'delete', index? }

  // Total efetivo: se houver override manual, usa-o; senão mantém o cálculo automático
  const hasOverride = extraTotalOverride !== '' && extraTotalOverride != null;
  const effectiveTotal = hasOverride ? toNum(extraTotalOverride) : totalExtra;
  const totalPaid = extraPayments.reduce((sum, v) => sum + toNum(v.amount), 0);
  const balance = effectiveTotal - totalPaid;

  const requestAdd = () => {
    if (!newPay.description.trim() || toNum(newPay.amount) <= 0) {
      toast.error('Preencha a descrição e o valor do pagamento.');
      return;
    }
    setConfirm({ type: 'add' });
  };

  const doAdd = () => {
    setExtraPayments(prev => [...prev, { ...newPay }]);
    setNewPay({ description: '', date: '', amount: '' });
    toast.success('Pagamento adicionado.');
  };

  const doDelete = (idx) => {
    setExtraPayments(prev => prev.filter((_, i) => i !== idx));
    toast.success('Pagamento removido.');
  };

  const handleConfirm = () => {
    if (!confirm) return;
    if (confirm.type === 'add') doAdd();
    else if (confirm.type === 'delete') doDelete(confirm.index);
    else if (confirm.type === 'save' && onSave) onSave();
    setConfirm(null);
  };

  const confirmConfig = {
    add: { title: 'Adicionar pagamento?', desc: 'Confirma a inclusão deste pagamento de extra.' },
    save: { title: 'Salvar alterações?', desc: 'Confirma o salvamento dos dados de extra.' },
    delete: { title: 'Tem certeza?', desc: 'Deseja realmente excluir este pagamento? Esta ação não pode ser desfeita.' },
  };
  const cfg = confirm ? confirmConfig[confirm.type] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-800">Status de Pagamento do Extra</h3>
          <p className="text-xs text-slate-400 mt-0.5">HE 50%, HE 100% e Adicional Noturno</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setConfirm({ type: 'save' })} disabled={saving} size="sm" variant="outline" className="gap-1.5">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Salvar
          </Button>
        )}
      </div>

      {/* ─── Stats row ─── */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        {/* Total de Extras — editável pelo admin, padrão = cálculo automático */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs text-slate-500">Total de Extras</p>
            {isAdmin && (
              <button
                onClick={() => setEditingTotal(v => !v)}
                className="text-slate-400 hover:text-[#1a2c6a] transition-colors"
                title="Editar total"
              >
                <Pencil size={11} />
              </button>
            )}
          </div>
          {isAdmin && editingTotal ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">R$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={hasOverride ? extraTotalOverride : (totalExtra ? totalExtra.toFixed(2) : '')}
                onChange={e => setExtraTotalOverride(e.target.value)}
                placeholder={totalExtra ? totalExtra.toFixed(2) : '0.00'}
                className="text-xl font-bold text-amber-600 h-8 border-0 p-0 shadow-none focus-visible:ring-0 w-full"
                autoFocus
              />
            </div>
          ) : (
            <p className="text-xl font-bold text-amber-600">{fmt(effectiveTotal)}</p>
          )}
          {hasOverride && <p className="text-[10px] text-slate-400 mt-0.5">Valor manual</p>}
        </div>

        {/* Total Pago */}
        <div className="px-6 py-4">
          <p className="text-xs text-slate-500 mb-1">Total Pago</p>
          <p className="text-xl font-bold text-slate-800">{fmt(totalPaid)}</p>
        </div>

        {/* Saldo */}
        <div className="px-6 py-4">
          <p className="text-xs text-slate-500 mb-1">Saldo</p>
          <p className={`text-xl font-bold ${balance > 0.005 ? 'text-orange-600' : 'text-green-600'}`}>{fmt(balance)}</p>
        </div>
      </div>

      {/* ─── Pagamentos table ─── */}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="px-6 py-2 text-left text-xs font-semibold text-slate-500">Descrição</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Data</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Valor</th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500">Ações</th>
          </tr>
        </thead>
        <tbody>
          {extraPayments.map((v, i) => (
            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
              <td className="px-6 py-2.5 font-medium text-slate-700 uppercase">{v.description || '—'}</td>
              <td className="px-4 py-2.5 text-slate-500">{v.date || '—'}</td>
              <td className="px-4 py-2.5 text-right font-mono text-slate-700">{fmt(toNum(v.amount))}</td>
              <td className="px-4 py-2.5">
                <div className="flex justify-center gap-1">
                  {isAdmin && (
                    <button
                      onClick={() => setConfirm({ type: 'delete', index: i })}
                      className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      title="Excluir pagamento"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}

          {isAdmin && (
            <tr className="border-t border-slate-100 bg-slate-50/40">
              <td className="px-4 py-2">
                <Input
                  placeholder="Descrição do pagamento"
                  value={newPay.description}
                  onChange={e => setNewPay(p => ({ ...p, description: e.target.value }))}
                  className="h-8 text-sm"
                />
              </td>
              <td className="px-2 py-2">
                <Input
                  type="date"
                  value={newPay.date}
                  onChange={e => setNewPay(p => ({ ...p, date: e.target.value }))}
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
                    value={newPay.amount}
                    onChange={e => setNewPay(p => ({ ...p, amount: e.target.value }))}
                    className="h-8 text-sm font-mono"
                  />
                </div>
              </td>
              <td className="px-2 py-2 text-center">
                <Button size="icon" onClick={requestAdd} className="h-8 w-8 bg-[#1a2c6a] hover:bg-[#152358]">
                  <Plus size={14} />
                </Button>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ─── Popup de confirmação ─── */}
      <AlertDialog open={confirm !== null} onOpenChange={(o) => { if (!o) setConfirm(null); }}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{cfg?.title}</AlertDialogTitle>
            <AlertDialogDescription>{cfg?.desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirm(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {confirm?.type === 'delete' ? 'Excluir' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}