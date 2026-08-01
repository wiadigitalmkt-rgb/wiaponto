import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PUNCH_LABELS } from '@/lib/clockUtils';
import { MapPin } from 'lucide-react';

export default function SelfieDialog({ punch, record, open, onClose }) {
  if (!punch || !record) return null;
  const photoUrl = record[`${punch}_photo`];
  const address = record[`${punch}_address`];
  const time = record[`${punch}_time`];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[#1a2c6a]">
            Selfie — {PUNCH_LABELS[punch]} · {record.date}
          </DialogTitle>
        </DialogHeader>
        {photoUrl ? (
          <div className="space-y-3">
            <img src={photoUrl} alt="Selfie" className="w-full rounded-xl object-cover" />
            {address && (
              <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                <MapPin size={14} className="text-[#ff8b00] flex-shrink-0 mt-0.5" />
                <span>{address}</span>
              </div>
            )}
            {time && <p className="text-center text-sm font-mono text-slate-600">Horário registrado: <strong>{time}</strong></p>}
          </div>
        ) : (
          <p className="text-center text-slate-400 py-8">Nenhuma foto disponível para esta marcação.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}