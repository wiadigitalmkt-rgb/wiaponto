import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const STATUS_MAP = {
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'Aprovado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const TYPE_MAP = { justification: 'Justificativa', correction: 'Correção' };

export default function Requests() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewItem, setReviewItem] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('TimeClockRequest').select('*').order('created_at', { ascending: false });
      if (!isAdmin && user?.email) {
        query = query.eq('employee_email', user.email);
      }
      const { data, error } = await query;
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Erro ao carregar solicitações:', err);
      toast.error('Erro ao carregar solicitações.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user]);

  useEffect(() => { load(); }, [load]);

  const handleReview = async (status) => {
    if (status === 'rejected' && !adminNotes.trim()) {
      toast.error('Nota administrativa obrigatória para rejeição.');
      return;
    }
    setProcessing(true);
    try {
      const { error: updateError } = await supabase
        .from('TimeClockRequest')
        .update({
          status,
          admin_notes: adminNotes,
        })
        .eq('id', reviewItem.id);

      if (updateError) throw updateError;

      // Se for correção aprovada, atualiza no time_records
      if (status === 'approved' && reviewItem.request_type === 'correction' && reviewItem.timeclock_id) {
        const fieldToUpdate = reviewItem.clock_type === 'saida' ? 'saida' : 'entrada';
        const { error: clockError } = await supabase
          .from('time_records')
          .update({
            [fieldToUpdate]: reviewItem.new_time,
          })
          .eq('id', reviewItem.timeclock_id);

        if (clockError) throw clockError;
      }

      toast.success(`Solicitação ${status === 'approved' ? 'aprovada' : 'rejeitada'}!`);
      setReviewItem(null);
      setAdminNotes('');
      load();
    } catch (err) {
      console.error('Erro ao processar solicitação:', err);
      toast.error('Erro ao processar solicitação.');
    } finally {
      setProcessing(false);
    }
  };

  const pendingList = requests.filter(r => r.status === 'pending');
  const historyList = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#1a2c6a]">Solicitações</h2>

      <Tabs defaultValue={isAdmin ? 'pending' : 'new'}>
        <TabsList>
          {!isAdmin && <TabsTrigger value="new">Nova Solicitação</TabsTrigger>}
          {isAdmin && (
            <TabsTrigger value="pending">
              Pendentes {pendingList.length > 0 && <span className="ml-1.5 bg-[#ff8b00] text-white text-[10px] rounded-full w-5 h-5 inline-flex items-center justify-center">{pendingList.length}</span>}
            </TabsTrigger>
          )}
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {!isAdmin && (
          <TabsContent value="new" className="mt-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <RequestForm onCreated={load} />
            </div>
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="pending" className="mt-4">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#1a2c6a]" /></div>
            ) : pendingList.length === 0 ? (
              <p className="text-center text-slate-400 py-12">Nenhuma solicitação pendente.</p>
            ) : (
              <div className="space-y-3">
                {pendingList.map(req => (
                  <RequestCard key={req.id} req={req} onReview={() => { setReviewItem(req); setAdminNotes(''); }} />
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="history" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#1a2c6a]" /></div>
          ) : historyList.length === 0 ? (
            <p className="text-center text-slate-400 py-12">Nenhuma solicitação no histórico.</p>
          ) : (
            <div className="space-y-3">
              {historyList.map(req => <RequestCard key={req.id} req={req} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Admin review dialog */}
      <Dialog open={!!reviewItem} onOpenChange={() => setReviewItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Analisar Solicitação</DialogTitle>
          </DialogHeader>
          {reviewItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Colaborador:</span> <strong>{reviewItem.employee_name}</strong></div>
                <div><span className="text-slate-500">Data:</span> <strong>{reviewItem.date}</strong></div>
                <div><span className="text-slate-500">Tipo:</span> <strong>{TYPE_MAP[reviewItem.request_type]}</strong></div>
                <div><span className="text-slate-500">Batida:</span> <strong>{PUNCH_LABELS[reviewItem.clock_type]}</strong></div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-sm"><strong>Motivo:</strong> {reviewItem.reason}</div>
              {reviewItem.request_type === 'correction' && (
                <div className="text-sm">
                  <span className="text-slate-500">Horário:</span> {reviewItem.old_time} → <strong className="text-[#ff8b00]">{reviewItem.new_time}</strong>
                </div>
              )}
              <Textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="Notas administrativas (obrigatório para rejeição)..."
                rows={2}
              />
              <div className="flex gap-3">
                <Button onClick={() => handleReview('approved')} disabled={processing} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  {processing ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />} Aprovar
                </Button>
                <Button onClick={() => handleReview('rejected')} disabled={processing} variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
                  <XCircle size={16} className="mr-2" /> Rejeitar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RequestCard({ req, onReview }) {
  const st = STATUS_MAP[req.status];
  const Icon = st.icon;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full ${st.color} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-800">{req.employee_name}</span>
          <Badge variant="outline" className="text-[10px]">{TYPE_MAP[req.request_type]}</Badge>
          <Badge variant="outline" className="text-[10px]">{PUNCH_LABELS[req.clock_type]}</Badge>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{req.reason}</p>
        <p className="text-[11px] text-slate-400">{req.date}</p>
      </div>
      <Badge className={`${st.color} text-[11px]`}>{st.label}</Badge>
      {onReview && req.status === 'pending' && (
        <Button size="sm" onClick={onReview} className="bg-[#1a2c6a] text-white hover:bg-[#152358] text-xs">Analisar</Button>
      )}
    </div>
  );
}
