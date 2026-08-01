import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function EditPunchDialog({ record, date, employeeEmail, open, onClose, onSaved }) {
  const [times, setTimes] = useState({ entry_time: '', break_time: '', return_time: '', exit_time: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTimes({
      entry_time: record?.entry_time || '',
      break_time: record?.break_time || '',
      return_time: record?.return_time || '',
      exit_time: record?.exit_time || '',
    });
  }, [record, open]);

  const handleSave = async () => {
    setSaving(true);
    const data = { ...times, date, employee_email: employeeEmail };
    if (record?.id) {
      await base44.entities.TimeClock.update(record.id, times);
    } else {
      await base44.entities.TimeClock.create({ ...data, status: times.exit_time ? 'complete' : 'incomplete' });
    }
    setSaving(false);
    toast.success('Ponto atualizado com sucesso!');
    onSaved?.();
    onClose();
  };

  const fields = [
    { key: 'entry_time', label: 'Entrada' },
    { key: 'break_time', label: 'Intervalo' },
    { key: 'return_time', label: 'Retorno' },
    { key: 'exit_time', label: 'Saída' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[#1a2c6a]">Editar Ponto — {date}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {fields.map(f => (
            <div key={f.key}>
              <label className="text-xs font-medium text-slate-600 mb-1 block">{f.label}</label>
              <Input
                type="time"
                value={times[f.key]}
                onChange={e => setTimes({ ...times, [f.key]: e.target.value })}
              />
            </div>
          ))}
          <Button onClick={handleSave} disabled={saving} className="w-full bg-[#ff8b00] hover:bg-[#e67a00] text-white">
            {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}