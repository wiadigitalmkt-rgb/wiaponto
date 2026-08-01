import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PaymentDialog({ socios, open, onClose, onSaved, preselectedEmail, editingPayment }) {
  const [socioEmail, setSocioEmail] = useState(preselectedEmail || '');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [comprovanteFile, setComprovanteFile] = useState(null);
  const [existingComprovante, setExistingComprovante] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = !!editingPayment;

  useEffect(() => {
    if (open) {
      if (editingPayment) {
        setSocioEmail(editingPayment.socio_email || '');
        setData(editingPayment.data || new Date().toISOString().split('T')[0]);
        setValor(editingPayment.valor_pago?.toString() || '');
        setDescricao(editingPayment.descricao || '');
        setExistingComprovante(editingPayment.comprovante_url || '');
        setComprovanteFile(null);
      } else {
        setSocioEmail(preselectedEmail || '');
        setData(new Date().toISOString().split('T')[0]);
        setValor('');
        setDescricao('');
        setExistingComprovante('');
        setComprovanteFile(null);
      }
    }
  }, [open, preselectedEmail, editingPayment]);

  const handleSave = async () => {
    const socio = socios.find(s => s.email === socioEmail);
    if (!socioEmail || !data || !valor) {
      toast.error('Preencha sócio, data e valor.');
      return;
    }
    setSaving(true);
    try {
      let comprovante_url = existingComprovante || '';
      if (comprovanteFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: comprovanteFile });
        comprovante_url = file_url;
      }
      const dateObj = new Date(data + 'T00:00:00');
      const payload = {
        socio_email: socioEmail,
        socio_nome: socio?.nome || '',
        data,
        valor_pago: parseFloat(valor) || 0,
        descricao,
        comprovante_url,
        mes: dateObj.getMonth() + 1,
        ano: dateObj.getFullYear(),
      };
      const result = isEdit
        ? await base44.entities.ProLaborePayment.update(editingPayment.id, payload)
        : await base44.entities.ProLaborePayment.create(payload);
      onSaved(result, isEdit);
      onClose();
      toast.success(isEdit ? 'Pagamento atualizado!' : 'Pagamento registrado!');
    } catch (err) {
      toast.error('Erro: ' + (err.message || 'tente novamente'));
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Pagamento' : 'Registrar Pagamento'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Sócio</Label>
            <select
              value={socioEmail}
              onChange={e => setSocioEmail(e.target.value)}
              disabled={isEdit}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm disabled:opacity-50"
            >
              <option value="">Selecione...</option>
              {socios.map(s => <option key={s.id} value={s.email}>{s.nome}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-sm font-medium">Data</Label>
            <Input type="date" value={data} onChange={e => setData(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">Valor (R$)</Label>
            <Input type="number" step="0.01" min="0" value={valor} onChange={e => setValor(e.target.value)} placeholder="0.00" className="mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">Descrição</Label>
            <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Pró-labore Junho/2026" className="mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">Comprovante</Label>
            {existingComprovante && !comprovanteFile && (
              <a href={existingComprovante} target="_blank" rel="noopener noreferrer" className="block mt-1 text-xs text-[#1a2c6a] hover:underline">
                Comprovante atual — clicar para ver
              </a>
            )}
            <label className="mt-1 flex items-center gap-2 cursor-pointer border border-dashed border-slate-300 rounded-md px-3 py-2 hover:border-[#1a2c6a] transition-colors">
              <Upload size={16} className="text-slate-400" />
              <span className="text-sm text-slate-500 truncate">
                {comprovanteFile ? comprovanteFile.name : (existingComprovante ? 'Trocar comprovante' : 'Anexar comprovante')}
              </span>
              <input type="file" className="hidden" onChange={e => setComprovanteFile(e.target.files[0])} accept="image/*,application/pdf" />
            </label>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-[#1a2c6a] hover:bg-[#152358]">
            {saving && <Loader2 size={16} className="animate-spin mr-2" />}
            {isEdit ? 'Salvar Alterações' : 'Salvar Pagamento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}