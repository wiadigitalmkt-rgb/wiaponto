import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Upload, Eye, Trash2, FileText, User } from 'lucide-react';
import { toast } from 'sonner';

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function Payslip() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [payslips, setPayslips] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewUrl, setViewUrl] = useState(null);
  const now = new Date();
  const [selEmail, setSelEmail] = useState('');
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear, setSelYear] = useState(now.getFullYear());

  useEffect(() => {
    if (isAdmin) {
      base44.entities.User.list().then(u => {
        setUsers(u);
        setSelEmail(u[0]?.email || '');
      });
    }
  }, [isAdmin]);

  const load = useCallback(async () => {
    setLoading(true);
    const filter = isAdmin ? {} : { employee_email: user.email };
    const all = await base44.entities.Payslip.filter(filter, '-created_date', 100);
    setPayslips(all);
    setLoading(false);
  }, [isAdmin, user]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selEmail) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const selectedUser = users.find(u => u.email === selEmail);
    await base44.entities.Payslip.create({
      employee_email: selEmail,
      employee_name: selectedUser?.full_name || selEmail,
      month: selMonth,
      year: selYear,
      file_url,
      file_name: file.name,
    });
    setUploading(false);
    toast.success('Contra-cheque importado com sucesso!');
    load();
    e.target.value = '';
  };

  const handleDelete = async (id) => {
    await base44.entities.Payslip.delete(id);
    toast.success('Removido!');
    load();
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#1a2c6a]">Contra-Cheque e Vales</h2>

      {isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Upload size={16} className="text-[#ff8b00]" /> Importar Holerite
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Colaborador</label>
              <Select value={selEmail} onValueChange={setSelEmail}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => <SelectItem key={u.email} value={u.email}>{u.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Mês</label>
              <Select value={String(selMonth)} onValueChange={v => setSelMonth(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((m, i) => <SelectItem key={i} value={String(i+1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Ano</label>
              <Select value={String(selYear)} onValueChange={v => setSelYear(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${selEmail ? 'border-[#ff8b00]/50 hover:bg-[#ff8b00]/5 text-[#ff8b00]' : 'border-slate-200 text-slate-300 cursor-not-allowed'}`}>
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            <span className="text-sm font-medium">{uploading ? 'Enviando...' : 'Selecionar arquivo (PDF, imagem)'}</span>
            <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleUpload} disabled={!selEmail || uploading} />
          </label>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-[#1a2c6a] px-5 py-3">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <FileText size={16} /> {isAdmin ? 'Holerites Importados' : 'Meus Contra-Cheques'}
          </h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#1a2c6a]" /></div>
        ) : payslips.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum contra-cheque disponível.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payslips.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#1a2c6a]/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-[#1a2c6a]" />
                </div>
                <div className="flex-1 min-w-0">
                  {isAdmin && <p className="text-xs text-slate-500">{p.employee_name}</p>}
                  <p className="text-sm font-medium text-slate-800">{MONTH_NAMES[(p.month || 1) - 1]} {p.year}</p>
                  <p className="text-xs text-slate-400 truncate">{p.file_name || 'holerite.pdf'}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setViewUrl(p.file_url)} title="Visualizar">
                    <Eye size={14} />
                  </Button>
                  {isAdmin && (
                    <Button size="icon" variant="outline" className="h-8 w-8 text-red-500 hover:bg-red-50 border-red-200" onClick={() => handleDelete(p.id)} title="Excluir">
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View dialog */}
      <Dialog open={!!viewUrl} onOpenChange={() => setViewUrl(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Contra-Cheque</DialogTitle>
          </DialogHeader>
          {viewUrl && (
            viewUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)
              ? <img src={viewUrl} alt="Holerite" className="w-full rounded-lg" />
              : <iframe src={viewUrl} className="w-full h-[70vh] rounded-lg border" title="Holerite" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}