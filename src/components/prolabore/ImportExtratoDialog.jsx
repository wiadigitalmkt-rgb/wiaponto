import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Convert DD/MM/YYYY to YYYY-MM-DD
function parseBrDate(str) {
  if (!str) return '';
  const [d, m, y] = str.trim().split('/');
  if (!d || !m || !y) return '';
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// Parse Brazilian number: -1.000,00 → 1000.00 (absolute value)
function parseBrNumber(str) {
  if (!str) return 0;
  const clean = String(str).replace(/\./g, '').replace(',', '.').replace('-', '').trim();
  return parseFloat(clean) || 0;
}

export default function ImportExtratoDialog({ socios, open, onClose, onImported }) {
  const [step, setStep] = useState('upload'); // upload | preview | importing | done
  const [socioEmail, setSocioEmail] = useState('');
  const [file, setFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [rows, setRows] = useState([]);
  const [importCount, setImportCount] = useState(0);

  const reset = () => {
    setStep('upload');
    setSocioEmail('');
    setFile(null);
    setRows([]);
    setImportCount(0);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleExtract = async () => {
    if (!socioEmail) { toast.error('Selecione o sócio.'); return; }
    if (!file) { toast.error('Anexe um PDF.'); return; }
    setExtracting(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            lancamentos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  data: { type: 'string', description: 'Data no formato DD/MM/YYYY' },
                  descricao: { type: 'string', description: 'Descrição da transação' },
                  protocolo: { type: 'string', description: 'Número do protocolo' },
                  valor: { type: 'string', description: 'Valor como string, ex: -280,00' },
                },
              },
            },
          },
        },
      });
      const items = result?.output?.lancamentos || result?.output || [];
      if (!Array.isArray(items) || items.length === 0) {
        toast.error('Nenhum lançamento encontrado no PDF.');
        setExtracting(false);
        return;
      }
      setRows(items.map(r => ({
        data: parseBrDate(r.data),
        data_original: r.data,
        descricao: r.descricao || '',
        protocolo: r.protocolo || '',
        valor: parseBrNumber(r.valor),
      })));
      setStep('preview');
    } catch (err) {
      toast.error('Erro ao processar PDF: ' + (err.message || 'tente novamente'));
    }
    setExtracting(false);
  };

  const handleImport = async () => {
    setStep('importing');
    const socio = socios.find(s => s.email === socioEmail);
    let count = 0;
    const created = [];
    for (const row of rows) {
      const dateObj = new Date(row.data + 'T00:00:00');
      const record = await base44.entities.ProLaborePayment.create({
        socio_email: socioEmail,
        socio_nome: socio?.nome || '',
        data: row.data,
        valor_pago: row.valor,
        descricao: row.descricao + (row.protocolo ? ` • Protocolo: ${row.protocolo}` : ''),
        comprovante_url: '',
        mes: dateObj.getMonth() + 1,
        ano: dateObj.getFullYear(),
      });
      created.push(record);
      count++;
    }
    setImportCount(count);
    setStep('done');
    onImported(created);
    toast.success(`${count} pagamento(s) importado(s)!`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={18} className="text-[#1a2c6a]" />
            Importar Extrato Bancário
          </DialogTitle>
        </DialogHeader>

        {/* STEP: upload */}
        {step === 'upload' && (
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Sócio</label>
              <select
                value={socioEmail}
                onChange={e => setSocioEmail(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">Selecione o sócio...</option>
                {socios.map(s => <option key={s.id} value={s.email}>{s.nome}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">PDF do Extrato (Efi Bank)</label>
              <label className="mt-1 flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-slate-300 rounded-xl px-6 py-8 hover:border-[#1a2c6a] transition-colors bg-slate-50">
                <Upload size={28} className="text-slate-400" />
                <span className="text-sm text-slate-500 font-medium">
                  {file ? file.name : 'Clique para selecionar o PDF'}
                </span>
                {file && <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>}
                <input
                  type="file"
                  className="hidden"
                  accept="application/pdf"
                  onChange={e => setFile(e.target.files[0])}
                />
              </label>
            </div>

            <Button
              onClick={handleExtract}
              disabled={extracting || !file || !socioEmail}
              className="w-full bg-[#1a2c6a] hover:bg-[#152358]"
            >
              {extracting
                ? <><Loader2 size={16} className="animate-spin mr-2" /> Processando PDF...</>
                : 'Extrair Lançamentos'}
            </Button>
          </div>
        )}

        {/* STEP: preview */}
        {step === 'preview' && (
          <div className="flex flex-col gap-4 min-h-0">
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
              <AlertCircle size={16} className="text-amber-500 shrink-0" />
              Revise os lançamentos abaixo antes de confirmar a importação.
            </div>

            <div className="overflow-auto rounded-xl border border-slate-200 flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0">
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Data</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Descrição</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Protocolo</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                        {r.data ? new Date(r.data + 'T00:00:00').toLocaleDateString('pt-BR') : r.data_original}
                      </td>
                      <td className="px-3 py-2 text-slate-600 max-w-[260px] truncate">{r.descricao}</td>
                      <td className="px-3 py-2 text-slate-500 font-mono text-xs">{r.protocolo}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-green-700">{fmt(r.valor)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td colSpan={3} className="px-3 py-2 text-xs font-semibold text-slate-600">{rows.length} lançamento(s) — Total</td>
                    <td className="px-3 py-2 text-right font-bold text-slate-800 font-mono">
                      {fmt(rows.reduce((s, r) => s + r.valor, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">Voltar</Button>
              <Button onClick={handleImport} className="flex-1 bg-[#1a2c6a] hover:bg-[#152358]">
                Confirmar e Importar
              </Button>
            </div>
          </div>
        )}

        {/* STEP: importing */}
        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 size={36} className="animate-spin text-[#1a2c6a]" />
            <p className="text-sm text-slate-600">Importando lançamentos...</p>
          </div>
        )}

        {/* STEP: done */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <CheckCircle size={40} className="text-green-500" />
            <p className="text-base font-semibold text-slate-800">{importCount} pagamento(s) importado(s)!</p>
            <Button onClick={handleClose} className="mt-2 bg-[#1a2c6a] hover:bg-[#152358]">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
