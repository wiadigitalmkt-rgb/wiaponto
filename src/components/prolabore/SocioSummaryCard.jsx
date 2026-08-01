const fmt = (v) => (isNaN(v) || v == null) ? 'R$ 0,00' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const toNum = (v) => { const n = parseFloat(typeof v === 'string' ? v.replace(',', '.') : v); return isNaN(n) ? 0 : n; };

// Soma de superávit: se o sócio recebeu mais que a meta em meses anteriores,
// o excesso é acumulado e reduz o valor a receber no mês atual.
function computeCarryover(socio, payments, targetMonth, targetYear) {
  const monthlyTarget = toNum(socio.valor_mensal);
  const myPayments = payments.filter(p => p.socio_email === socio.email);

  const monthMap = {};
  for (const p of myPayments) {
    const key = `${p.ano}-${p.mes}`;
    if (!monthMap[key]) monthMap[key] = { ano: p.ano, mes: p.mes, total: 0 };
    monthMap[key].total += toNum(p.valor_pago);
  }

  let carryover = 0;
  for (const key in monthMap) {
    const { ano, mes, total } = monthMap[key];
    if (ano < targetYear || (ano === targetYear && mes < targetMonth)) {
      const surplus = total - monthlyTarget;
      if (surplus > 0) carryover += surplus;
    }
  }
  return carryover;
}

export default function SocioSummaryCard({ socio, payments, selectedMonth, selectedYear }) {
  const month = selectedMonth || new Date().getMonth() + 1;
  const year = selectedYear || new Date().getFullYear();

  const myPayments = payments.filter(p => p.socio_email === socio.email);
  const monthPayments = myPayments.filter(p => p.mes === month && p.ano === year);
  const totalPaidMonth = monthPayments.reduce((sum, p) => sum + toNum(p.valor_pago), 0);
  const monthlyTarget = toNum(socio.valor_mensal);
  const carryover = computeCarryover(socio, payments, month, year);
  const available = monthlyTarget - carryover;
  const saldo = available - totalPaidMonth;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-800">{socio.nome}</h3>
        <p className="text-xs text-slate-400">{socio.email}</p>
      </div>
      <div className="grid grid-cols-3 divide-x divide-slate-100">
        <div className="px-4 py-3">
          <p className="text-xs text-slate-500 mb-0.5">A Receber</p>
          <p className="text-base font-bold text-slate-800">{fmt(available)}</p>
          {carryover > 0 && <p className="text-xs text-amber-500 mt-0.5">Superávit anterior: {fmt(carryover)}</p>}
        </div>
        <div className="px-4 py-3">
          <p className="text-xs text-slate-500 mb-0.5">Já Pago</p>
          <p className="text-base font-bold text-green-600">{fmt(totalPaidMonth)}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs text-slate-500 mb-0.5">Saldo</p>
          <p className={`text-base font-bold ${saldo > 0 ? 'text-amber-600' : saldo < 0 ? 'text-blue-600' : 'text-green-600'}`}>{fmt(saldo)}</p>
          {saldo < 0 && <p className="text-xs text-blue-500 mt-0.5">Superávit p/ próximo mês</p>}
        </div>
      </div>
      <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50/50 flex justify-between text-xs">
        <span className="text-slate-500">Meta mensal: <strong className="text-slate-700">{fmt(monthlyTarget)}</strong></span>
        <span className="text-slate-400">{monthPayments.length} pagto(s) no mês</span>
      </div>
    </div>
  );
}