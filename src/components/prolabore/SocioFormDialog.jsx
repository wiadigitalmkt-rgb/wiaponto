import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SocioFormDialog({ open, onClose, onSaved, editingSocio }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [valorMensal, setValorMensal] = useState('');
  const [saldoAcumulado, setSaldoAcumulado] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNome(editingSocio?.nome || '');
      setEmail(editingSocio?.email || '');
      setValorMensal(editingSocio?.valor_mensal?.toString() || '');
      setSaldoAcumulado(editingSocio?.saldo_acumulado?.toString() || '');
    }
  }, [open, editingSocio]);

  const handleSave = async () => {
    if (!nome || !email || !valorMensal) {
      toast.error('Preencha nome, email e valor mensal.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nome,
        email,
        valor_mensal: parseFloat(valorMensal) || 0,
        saldo_acumulado: parseFloat(saldoAcumulado) || 0,
      };
      const result = editingSocio
        ? await base44.entities.Socio.update(editingSocio.id, payload)
        : await base44.entities.Socio.create(payload);
      onSaved(result, !!editingSocio);
      onClose();
      toast.success(editingSocio ? 'Sócio atualizado!' : 'Sócio cadastrado!');
    } catch (err) {
      toast.error('Erro: ' + (err.message || 'tente novamente'));
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingSocio ? 'Editar Sócio' : 'Cadastrar Sócio'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Nome</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do sócio" className="mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@empresa.com" className="mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">Pró-Labore Mensal (R$)</Label>
            <Input type="number" step="0.01" min="0" value={valorMensal} onChange={e => setValorMensal(e.target.value)} placeholder="0.00" className="mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">Saldo Acumulado (R$)</Label>
            <Input type="number" step="0.01" value={saldoAcumulado} onChange={e => setSaldoAcumulado(e.target.value)} placeholder="0.00" className="mt-1" />
            <p className="text-xs text-slate-400 mt-1">Saldo de períodos anteriores (carryover)</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-[#1a2c6a] hover:bg-[#152358]">
            {saving && <Loader2 size={16} className="animate-spin mr-2" />}
            {editingSocio ? 'Atualizar' : 'Cadastrar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}