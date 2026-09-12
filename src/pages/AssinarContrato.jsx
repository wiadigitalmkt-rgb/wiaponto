import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { FileText, Loader2, CheckCircle2, PenLine } from 'lucide-react';

// ---------------------------------------------------------------------------
// Mesma lógica de variáveis usada em contratos.jsx (Gerenciar Contratos).
// Duplicada aqui de propósito — essa página fica isolada, fora do painel do
// gestor, então não depende de nenhum arquivo de lá pra funcionar.
// ---------------------------------------------------------------------------
const formatDDMMYYYY = (isoDate) => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
};

function renderContractText(content, employee) {
  const map = {
    COLABORADOR_NOME_COMPLETO: employee.full_name,
    COLABORADOR_PRIMEIRO_NOME: employee.first_name,
    COLABORADOR_SOBRENOME: employee.last_name,
    COLABORADOR_GENERO: employee.gender,
    COLABORADOR_DATA_NASCIMENTO: formatDDMMYYYY(employee.birth_date),
    COLABORADOR_CPF: employee.cpf,
    COLABORADOR_RG: employee.rg,
    COLABORADOR_PIS: employee.pis_pasep,
    COLABORADOR_ESTADO_CIVIL: employee.marital_status,
    COLABORADOR_EMAIL: employee.email,
    COLABORADOR_TELEFONE: employee.phone,
    COLABORADOR_DADOS_BANCARIOS: [employee.bank_name, employee.bank_agency, employee.bank_account]
      .filter(Boolean).join(' / '),
    COLABORADOR_ENDERECO_COMPLETO: [employee.street, employee.number, employee.neighborhood, employee.city, employee.state, employee.cep]
      .filter(Boolean).join(', '),
    COLABORADOR_CEP: employee.cep,
    COLABORADOR_RUA: employee.street,
    COLABORADOR_NUMERO: employee.number,
    COLABORADOR_COMPLEMENTO: employee.complement,
    COLABORADOR_BAIRRO: employee.neighborhood,
    COLABORADOR_CIDADE: employee.city,
    COLABORADOR_ESTADO: employee.state,
    CONTRATO_TIPO: employee.contract_type,
    CONTRATO_CARGO: employee.position,
    CONTRATO_DEPARTAMENTO: employee.department,
    CONTRATO_REMUNERACAO: employee.salary,
    CONTRATO_DATA_ADMISSAO: formatDDMMYYYY(employee.admission_date),
    CONTRATO_DATA_ATUAL: formatDDMMYYYY(new Date().toISOString().split('T')[0]),
  };
  let text = content || '';
  Object.entries(map).forEach(([token, value]) => {
    text = text.split(`{${token}}`).join(value ? String(value) : '_______________');
  });
  return text;
}

function ContractBody({ text, employeeSignatureUrl, managerSignatureUrl, employerSignatureUrl }) {
  const parts = text.split(/(\{ASSINATURA_COLABORADOR\}|\{ASSINATURA_GESTOR\}|\{ASSINATURA_EMPREGADORA\})/g);
  return (
    <div className="whitespace-pre-wrap leading-relaxed text-slate-700 text-sm">
      {parts.map((part, idx) => {
        if (part === '{ASSINATURA_COLABORADOR}') {
          return employeeSignatureUrl ? (
            <img key={idx} src={employeeSignatureUrl} alt="Assinatura do colaborador" className="h-16 inline-block align-middle" />
          ) : (
            <span key={idx} className="text-amber-600 font-medium">[assinatura pendente]</span>
          );
        }
        if (part === '{ASSINATURA_GESTOR}') {
          return managerSignatureUrl ? (
            <img key={idx} src={managerSignatureUrl} alt="Assinatura do gestor" className="h-16 inline-block align-middle" />
          ) : (
            <span key={idx} className="text-amber-600 font-medium">[assinatura do gestor pendente]</span>
          );
        }
        if (part === '{ASSINATURA_EMPREGADORA}') {
          return employerSignatureUrl ? (
            <img key={idx} src={employerSignatureUrl} alt="Assinatura da empregadora" className="h-16 inline-block align-middle" />
          ) : (
            <span key={idx} className="text-amber-600 font-medium">[assinatura da empregadora pendente]</span>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </div>
  );
}

export default function AssinarContrato() {
  // Exige login: esta página deve ficar atrás de <ProtectedRoute> no
  // App.jsx (sem allowedRoles — só precisa estar autenticado, gestor ou
  // colaborador). Além disso, aqui dentro checamos de novo que o contrato
  // realmente pertence ao usuário logado, antes de permitir assinar.
  const { user: loggedInUser, isLoadingAuth } = useAuth();

  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [signing, setSigning] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!loggedInUser?.id) {
      setLoading(false);
      return;
    }
    fetchMyContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingAuth, loggedInUser]);

  async function fetchMyContracts() {
    setLoading(true);
    const { data: emp } = await supabase
      .from('Employees')
      .select('*')
      .eq('id', loggedInUser.id)
      .maybeSingle();
    setEmployee(emp || null);

    const { data, error } = await supabase
      .from('employee_contracts')
      .select('*, contract_templates(name, content)')
      .eq('employee_id', loggedInUser.id)
      .order('created_at', { ascending: false });
    if (error) console.error('Erro ao buscar contratos:', error);
    setContracts(data || []);
    setLoading(false);
  }

  async function handleSign() {
    if (!selectedContract || !loggedInUser?.id) return;
    // Segunda checagem, além do <ProtectedRoute>: o contrato tem que ser
    // deste usuário — nunca confia só no que está na tela.
    if (selectedContract.employee_id !== loggedInUser.id) {
      alert('Este contrato não pertence a este usuário.');
      return;
    }
    if (!employee?.signature_path) {
      alert('Você ainda não tem uma assinatura cadastrada. Ela é criada durante o processo de admissão — fale com o seu gestor.');
      return;
    }
    setSigning(true);
    try {
      const { error } = await supabase
        .from('employee_contracts')
        .update({ status: 'assinado', signed_at: new Date().toISOString() })
        .eq('id', selectedContract.id)
        .eq('employee_id', loggedInUser.id);
      if (error) throw error;

      setConfirmOpen(false);
      setSelectedContract(null);
      fetchMyContracts();
    } catch (err) {
      console.error(err);
      alert('Erro ao assinar o contrato: ' + err.message);
    } finally {
      setSigning(false);
    }
  }

  if (isLoadingAuth || loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f7] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#ff8b00]" />
      </div>
    );
  }

  if (!loggedInUser?.id) {
    return (
      <div className="min-h-screen bg-[#f0f4f7] flex items-center justify-center text-slate-500 text-sm">
        Você precisa estar logado para ver e assinar seus contratos.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f7] flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Sua Empresa" />

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Meus contratos</h1>
          <p className="text-xs text-slate-500">Visualize e assine os contratos vinculados a você.</p>
        </div>

        {contracts.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-12 text-center text-slate-400">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            Nenhum contrato vinculado a você ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((c) => (
              <div key={c.id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{c.contract_templates?.name}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    c.status === 'assinado' ? 'bg-[#ff8b00]/10 text-[#ff8b00]' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {c.status === 'assinado'
                      ? `Assinado em ${new Date(c.signed_at).toLocaleDateString('pt-BR')}`
                      : 'Aguardando sua assinatura'}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedContract(c)}
                  className="border border-[#ff8b00] text-[#ff8b00] hover:bg-[#ff8b00]/10 font-medium text-xs px-4 py-2 rounded-md transition-colors"
                >
                  {c.status === 'assinado' ? 'Ver contrato' : 'Ver e assinar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL: LER E ASSINAR CONTRATO */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">{selectedContract.contract_templates?.name}</h3>
            </div>
            <div className="p-6 overflow-y-auto">
              <ContractBody
                text={renderContractText(selectedContract.contract_templates?.content, employee || {})}
                employeeSignatureUrl={selectedContract.status === 'assinado' ? employee?.signature_path : null}
                managerSignatureUrl={selectedContract.manager_signature_url}
                employerSignatureUrl={selectedContract.employer_signature_url}
              />
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedContract(null)}
                className="px-4 py-2 border rounded text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Fechar
              </button>
              {selectedContract.status !== 'assinado' && (
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="bg-[#ff8b00] hover:bg-[#fc9314] text-white text-xs font-bold px-5 py-2 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <PenLine className="w-3.5 h-3.5" /> Assinar contrato
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ASSINATURA */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 space-y-4 text-center">
            <CheckCircle2 className="w-10 h-10 text-[#ff8b00] mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">Confirmar assinatura</h3>
            <p className="text-xs text-slate-500">
              Ao confirmar, sua assinatura cadastrada na admissão será aplicada a este contrato. Essa ação não pode ser desfeita.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={signing}
                className="px-4 py-2 border rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSign}
                disabled={signing}
                className="px-4 py-2 bg-[#ff8b00] hover:bg-[#fc9314] text-white rounded text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {signing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Sim, assinar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
