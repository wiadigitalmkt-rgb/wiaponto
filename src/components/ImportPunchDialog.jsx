import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ImportPunchDialog({ open, onClose, onImported, employeeEmail }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const parseFile = async (file) => {
    const name = file.name.toLowerCase();
    if (name.endsWith('.pdf') || name.endsWith('.png')) return [];
    const text = await file.text();
    if (name.endsWith('.json')) return JSON.parse(text);
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z_]/g, ''));
    return lines.slice(1).map(line => {
      const vals = line.split(',');
      return headers.reduce((obj, h, i) => { obj[h] = vals[i]?.trim() || ''; return obj; }, {});
    });
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setResult(null);
    const rows = await parseFile(file);
    let created = 0, updated = 0, failed = 0;

    for (const row of rows) {
      const date = row.date || row.data;
      if (!date) { failed++; continue; }
      const existing = await base44.entities.TimeClock.filter({ date, employee_email: employeeEmail });
      const data = {
        date,
        employee_email: employeeEmail,
        entry_time: row.entry_time || row.entrada || '',
        break_time: row.break_time || row.intervalo || '',
        return_time: row.return_time || row.retorno || '',
        exit_time: row.exit_time || row.saida || row.saída || '',
        status: (row.exit_time || row.saida || row.saída) ? 'complete' : 'incomplete',
      };
      if (existing.length > 0) {
        await base44.entities.TimeClock.update(existing[0].id, data);
        updated++;
      } else {
        await base44.entities.TimeClock.create(data);
        created++;
      }
    }

    setLoading(false);
    setResult({ created, updated, failed });
    toast.success(`Importação concluída: ${created} criados, ${updated} atualizados.`);
    onImported?.();
    e.target.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#1a2c6a]">Importar Ponto em Lote</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-600 space-y-1">
            <p className="font-semibold">Formatos aceitos: CSV, JSON, PDF ou PNG</p>
            <p>Para CSV/JSON, use as colunas: <code className="bg-slate-200 px-1 rounded">date, entry_time, break_time, return_time, exit_time</code></p>
            <p>Exemplo CSV: <code className="bg-slate-200 px-1 rounded">2026-05-01,08:00,12:00,13:00,17:00</code></p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-6 gap-2">
              <Loader2 size={28} className="animate-spin text-[#1a2c6a]" />
              <p className="text-sm text-slate-500">Processando registros...</p>
            </div>
          ) : result ? (
            <div className="flex flex-col items-center py-4 gap-3">
              <CheckCircle2 size={32} className="text-green-500" />
              <div className="text-sm text-center space-y-1">
                <p><strong className="text-green-700">{result.created}</strong> registros criados</p>
                <p><strong className="text-blue-700">{result.updated}</strong> registros atualizados</p>
                {result.failed > 0 && <p><strong className="text-red-600">{result.failed}</strong> com erro</p>}
              </div>
              <Button variant="outline" onClick={() => { setResult(null); onClose(); }} className="mt-2">Fechar</Button>
            </div>
          ) : (
            <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-[#ff8b00] hover:bg-[#ff8b00]/5 transition-colors">
              <Upload size={28} className="text-slate-400" />
              <span className="text-sm text-slate-500">Clique para selecionar arquivo CSV, JSON, PDF ou PNG</span>
              <input type="file" accept=".csv,.json,.pdf,.png" className="hidden" onChange={handleFile} />
            </label>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
