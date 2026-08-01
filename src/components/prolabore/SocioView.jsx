import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import SocioSummaryCard from './SocioSummaryCard';
import PaymentHistoryTable from './PaymentHistoryTable';
import MonthNavigator from './MonthNavigator';
import { exportProLaborePDF } from './ExportProLaborePDF';

export default function SocioView({ socio, payments }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  if (!socio) {
    return (
      <p className="text-sm text-slate-500 text-center mt-20">
        Sócio não encontrado. Contate o administrador.
      </p>
    );
  }

  const myPayments = payments.filter(p => p.socio_email === socio.email);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[#1a2c6a]">Pró-Labore</h2>
        <p className="text-sm text-slate-500 mt-1">Acompanhe seus pagamentos e saldos</p>
      </div>

      <div className="flex justify-center">
        <MonthNavigator month={selectedMonth} year={selectedYear} onChange={({ month, year }) => { setSelectedMonth(month); setSelectedYear(year); }} />
      </div>

      <SocioSummaryCard socio={socio} payments={payments} selectedMonth={selectedMonth} selectedYear={selectedYear} />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">Histórico de Pagamentos</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportProLaborePDF(payments, socio, selectedMonth, selectedYear, payments)}
            className="gap-1.5"
          >
            <Download size={14} /> PDF
          </Button>
        </div>
        <PaymentHistoryTable payments={myPayments} selectedMonth={selectedMonth} selectedYear={selectedYear} />
      </div>
    </div>
  );
}