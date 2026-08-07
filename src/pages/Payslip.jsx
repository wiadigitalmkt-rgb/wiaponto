import React from 'react';
import { FileText, Download, AlertCircle } from 'lucide-react';

export default function Payslip() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contracheques / Holerites</h1>
          <p className="text-sm text-slate-500">Visualize e baixe seus comprovantes de rendimento</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
        <div className="inline-flex p-3 bg-slate-100 text-slate-500 rounded-full">
          <FileText size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-800">Nenhum contracheque disponível</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Os holerites serão disponibilizados nesta seção assim que forem processados pelo RH.
          </p>
        </div>
      </div>
    </div>
  );
}
