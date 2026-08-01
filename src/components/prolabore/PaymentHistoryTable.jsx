import { FileText, Pencil, Trash2 } from 'lucide-react';

const fmt = (v) => (isNaN(v) || v == null) ? 'R$ 0,00' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const toNum = (v) => { const n = parseFloat(typeof v === 'string' ? v.replace(',', '.') : v); return isNaN(n) ? 0 : n; };

export default function PaymentHistoryTable({ payments, showSocio, selectedMonth, selectedYear, onEdit, onDelete, isAdmin }) {
  let filtered = payments;
  if (selectedMonth && selectedYear) {
    filtered = payments.filter(p => p.mes === selectedMonth && p.ano === selectedYear);
  }
  const sorted = [...filtered].sort((a, b) => (b.data || '').localeCompare(a.data || ''));

  if (sorted.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-slate-400">Nenhum pagamento registrado neste mês.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-100">
          {showSocio && <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Sócio</th>}
          <th className="px-5 py-2 text-left text-xs font-semibold text-slate-500">Data</th>
          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Descrição</th>
          <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Valor</th>
          <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500">Comprovante</th>
          {isAdmin && <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500">Ações</th>}
        </tr>
      </thead>
      <tbody>
        {sorted.map(p => (
          <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
            {showSocio && <td className="px-4 py-2.5 text-slate-700 font-medium">{p.socio_nome || '—'}</td>}
            <td className="px-5 py-2.5 text-slate-700">{p.data ? new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</td>
            <td className="px-4 py-2.5 text-slate-600">{p.descricao || '—'}</td>
            <td className="px-4 py-2.5 text-right font-mono text-slate-700">{fmt(toNum(p.valor_pago))}</td>
            <td className="px-4 py-2.5 text-center">
              {p.comprovante_url ? (
                <a href={p.comprovante_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#1a2c6a] hover:underline">
                  <FileText size={14} /> Ver
                </a>
              ) : <span className="text-slate-300">—</span>}
            </td>
            {isAdmin && (
              <td className="px-4 py-2.5 text-center">
                <div className="inline-flex items-center gap-3">
                  <button onClick={() => onEdit(p)} className="text-slate-400 hover:text-[#1a2c6a] transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => onDelete(p)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}