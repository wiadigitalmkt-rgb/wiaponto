import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard, Users, FileText, FileUp, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import SocioSummaryCard from './SocioSummaryCard';
import PaymentHistoryTable from './PaymentHistoryTable';
import PaymentDialog from './PaymentDialog';
import SocioFormDialog from './SocioFormDialog';
import ImportExtratoDialog from './ImportExtratoDialog';
import MonthNavigator from './MonthNavigator';
import { exportProLaborePDF } from './ExportProLaborePDF';

const fmt = (v) => (isNaN(v) || v == null) ? 'R$ 0,00' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const toNum = (v) => { const n = parseFloat(typeof v === 'string' ? v.replace(',', '.') : v); return isNaN(n) ? 0 : n; };

export default function AdminView({ socios, payments, setSocios, setPayments }) {
  const [showPayment, setShowPayment] = useState(false);
  const [showSocio, setShowSocio] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingSocio, setEditingSocio] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentSocioEmail, setPaymentSocioEmail] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const totalMonthly = socios.reduce((sum, s) => sum + toNum(s.valor_mensal), 0);
  const totalPaidMonth = payments
    .filter(p => p.mes === selectedMonth && p.ano === selectedYear)
    .reduce((sum, p) => sum + toNum(p.valor_pago), 0);

  const handleSocioSaved = (saved, isEdit) => {
    setSocios(prev => isEdit ? prev.map(s => s.id === saved.id ? saved : s) : [...prev, saved]);
  };

  const handlePaymentSaved = (saved, isEdit) => {
    setPayments(prev => isEdit ? prev.map(p => p.id === saved.id ? saved : p) : [...prev, saved]);
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setShowPayment(true);
  };

  const handleDeletePayment = async () => {
    if (!deletingPayment) return;
    setDeleting(true);
    try {
      await base44.entities.ProLaborePayment.delete(deletingPayment.id);
      setPayments(prev => prev.filter(p => p.id !== deletingPayment.id));
      setDeletingPayment(null);
      toast.success('Pagamento excluído!');
    } catch (err) {
      toast.error('Erro: ' + (err.message || 'tente novamente'));
    }
    setDeleting(false);
  };

  const handleOpenNewPayment = () => {
    setEditingPayment(null);
    setPaymentSocioEmail(null);
    setShowPayment(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#1a2c6a]">Gestão de Pró-Labore</h2>
          <p className="text-sm text-slate-500 mt-1">Gerencie pagamentos e saldos dos sócios</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEditingSocio(null); setShowSocio(true); }} className="gap-1.5">
            <Plus size={14} /> Sócio
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)} className="gap-1.5 border-[#1a2c6a] text-[#1a2c6a] hover:bg-[#1a2c6a] hover:text-white">
            <FileUp size={14} /> Importar Extrato
          </Button>
          <Button size="sm" onClick={handleOpenNewPayment} className="bg-[#ff8b00] hover:bg-[#e67a00] gap-1.5">
            <Plus size={14} /> Pagamento
          </Button>
        </div>
      </div>

      <div className="flex justify-center">
        <MonthNavigator month={selectedMonth} year={selectedYear} onChange={({ month, year }) => { setSelectedMonth(month); setSelectedYear(year); }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-[#1a2c6a]" />
            <p className="text-xs text-slate-500">Sócios Ativos</p>
          </div>
          <p className="text-xl font-bold text-slate-800">{socios.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={16} className="text-[#1a2c6a]" />
            <p className="text-xs text-slate-500">Total Mensal Devido</p>
          </div>
          <p className="text-xl font-bold text-slate-800">{fmt(totalMonthly)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={16} className="text-green-600" />
            <p className="text-xs text-slate-500">Pago no Mês</p>
          </div>
          <p className="text-xl font-bold text-green-600">{fmt(totalPaidMonth)}</p>
        </div>
      </div>

      {socios.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <Users size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Nenhum sócio cadastrado.</p>
          <Button size="sm" onClick={() => setShowSocio(true)} className="mt-4 bg-[#1a2c6a] hover:bg-[#152358]">
            Cadastrar Primeiro Sócio
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {socios.map(socio => (
            <div key={socio.id} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="flex-1">
                <SocioSummaryCard socio={socio} payments={payments} selectedMonth={selectedMonth} selectedYear={selectedYear} />
              </div>
              <div className="flex sm:flex-col gap-2">
                <Button variant="outline" size="sm" onClick={() => { setEditingSocio(socio); setShowSocio(true); }}>
                  Editar
                </Button>
                <Button size="sm" onClick={() => { setEditingPayment(null); setPaymentSocioEmail(socio.email); setShowPayment(true); }} className="bg-[#ff8b00] hover:bg-[#e67a00] gap-1.5">
                  <Plus size={14} /> Pagamento
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment report */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base font-bold text-slate-800">Relatório de Pagamentos</h3>
          <div className="flex gap-2">
            {socios.map(s => (
              <Button
                key={s.id}
                variant="outline"
                size="sm"
                onClick={() => exportProLaborePDF(payments, s, selectedMonth, selectedYear, payments)}
                className="gap-1.5 text-xs"
              >
                <Download size={13} /> {s.nome}
              </Button>
            ))}
          </div>
        </div>
        <PaymentHistoryTable
          payments={payments}
          showSocio
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onEdit={handleEditPayment}
          onDelete={setDeletingPayment}
          isAdmin
        />
      </div>

      <PaymentDialog
        socios={socios}
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSaved={handlePaymentSaved}
        preselectedEmail={paymentSocioEmail}
        editingPayment={editingPayment}
      />
      <ImportExtratoDialog
        socios={socios}
        open={showImport}
        onClose={() => setShowImport(false)}
        onImported={(newPayments) => setPayments(prev => [...prev, ...newPayments])}
      />
      <SocioFormDialog
        open={showSocio}
        onClose={() => setShowSocio(false)}
        onSaved={handleSocioSaved}
        editingSocio={editingSocio}
      />
      <AlertDialog open={!!deletingPayment} onOpenChange={(v) => !v && setDeletingPayment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o pagamento de {deletingPayment?.socio_nome} no valor de R$ {Number(deletingPayment?.valor_pago || 0).toFixed(2).replace('.', ',')}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePayment}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
