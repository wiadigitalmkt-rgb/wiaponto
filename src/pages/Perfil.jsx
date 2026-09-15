import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { User, Clock, Plane, FileText, Loader2, PenLine, X, CheckCircle2 } from 'lucide-react';

const WEEKDAYS = [
  { key: 1, label: 'Segunda-feira' },
  { key: 2, label: 'Terça-feira' },
  { key: 3, label: 'Quarta-feira' },
  { key: 4, label: 'Quinta-feira' },
  { key: 5, label: 'Sexta-feira' },
  { key: 6, label: 'Sábado' },
  { key: 0, label: 'Domingo' },
];

const formatDDMMYYYY = (isoDate) => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
};

// Mesma lógica de variáveis de contrato usada em AssinarContrato.jsx —
// duplicada aqui de propósito, pra esta página não depender de nenhum
// arquivo do painel do gestor.
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
    COLABORADOR_DADOS_BANCARIOS: [employee.bank_name, employee.bank_agency, employee.bank_account].filter(Boolean).join(' / '),
    COLABORADOR_ENDERECO_COMPLETO: [employee.street, employee.number, employee.neighborhood, employee.city, employee.state, employee.cep].filter(Boolean).join(', '),
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
    <div className="whitespace-pre-wrap leading-relaxed text-slate-700 text-xs">
      {parts.map((part, idx) => {
        if (part === '{ASSINATURA_COLABORADOR}')
          return employeeSignatureUrl ? <img key={idx} src={employeeSignatureUrl} alt="Assinatura" className="h-14 inline-block align-middle" /> : <span key={idx} className="text-amber-600">[pendente]</span>;
        if (part === '{ASSINATURA_GESTOR}')
          return managerSignatureUrl ? <img key={idx} src={managerSignatureUrl} alt="Assinatura gestor" className="h-14 inline-block align-middle" /> : <span key={idx} className="text-amber-600">[pendente]</span>;
        if (part === '{ASSINATURA_EMPREGADORA}')
          return employerSignatureUrl ? <img key={idx} src={employerSignatureUrl} alt="Assinatura empregadora" className="h-14 inline-block align-middle" /> : <span key={idx} className="text-amber-600">[pendente]</span>;
        return <span key={idx}>{part}</span>;
      })}
    </div>
  );
}

const Field = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className="text-slate-700 text-sm mt-0.5">{value || '—'}</p>
  </div>
);

function getFileKind(url, fileName) {
  const name = (fileName || url || '').toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/.test(name)) return 'image';
  if (/\.(mp4|webm|mov|ogv)(\?|$)/.test(name)) return 'video';
  if (/\.pdf(\?|$)/.test(name)) return 'pdf';
  return 'other';
}

function FilePreviewModal({ file, onClose }) {
  if (!file) return null;
  const kind = getFileKind(file.url, file.name);
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-700 truncate pr-4">{file.name || 'Arquivo'}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center p-2">
          {kind === 'image' && <img src={file.url} alt={file.name || 'Arquivo'} className="max-w-full max-h-[75vh] object-contain" />}
          {kind === 'video' && <video src={file.url} controls className="max-w-full max-h-[75vh]" />}
          {kind === 'pdf' && <iframe src={file.url} title={file.name || 'Arquivo'} className="w-full h-[75vh] border-0" />}
          {kind === 'other' && (
            <div className="text-center p-10 text-slate-500 text-xs space-y-3">
              <p>Não é possível pré-visualizar este tipo de arquivo.</p>
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-[#ff8b00] hover:underline font-medium">
                Baixar arquivo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Perfil() {
  const { user: loggedInUser, isLoadingAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('section') || 'informacoes');
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);

  const [schedule, setSchedule] = useState(null);
  const [vacations, setVacations] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [openContractId, setOpenContractId] = useState(null);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [savingRequest, setSavingRequest] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    if (isLoadingAuth || !loggedInUser?.id) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingAuth, loggedInUser]);

  async function fetchAll() {
    setLoading(true);
    const [{ data: emp }, { data: sched }, { data: vacs }, { data: contractsData }, { data: reqs }, { data: docs }] = await Promise.all([
      supabase.from('Employees').select('*').eq('id', loggedInUser.id).maybeSingle(),
      supabase.from('employee_work_schedules').select('*').eq('employee_id', loggedInUser.id).maybeSingle(),
      supabase.from('employee_vacations').select('*').eq('employee_id', loggedInUser.id).order('start_date', { ascending: false }),
      supabase.from('employee_contracts').select('*, contract_templates(name, content)').eq('employee_id', loggedInUser.id).eq('status', 'assinado').order('signed_at', { ascending: false }),
      supabase.from('profile_change_requests').select('*').eq('employee_id', loggedInUser.id).order('created_at', { ascending: false }),
      supabase.from('employee_attachments').select('*').eq('employee_id', loggedInUser.id).order('created_at', { ascending: false }),
    ]);
    setEmployee(emp || null);
    setSchedule(sched || null);
    setVacations(vacs || []);
    setContracts(contractsData || []);
    setMyRequests(reqs || []);
    setDocuments(docs || []);
    setLoading(false);
  }

  async function handleSubmitRequest() {
    if (!requestText.trim() || !loggedInUser?.id) return;
    setSavingRequest(true);
    try {
      const { error } = await supabase.from('profile_change_requests').insert([{
        employee_id: loggedInUser.id,
        description: requestText.trim(),
        status: 'pendente',
      }]);
      if (error) throw error;
      setRequestText('');
      setShowRequestModal(false);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar solicitação: ' + err.message);
    } finally {
      setSavingRequest(false);
    }
  }

  if (isLoadingAuth || loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f7] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#ff8b00]" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-[#f0f4f7] flex items-center justify-center text-slate-500 text-sm">
        Não foi possível carregar seu perfil.
      </div>
    );
  }

  const menuItems = [
    { id: 'informacoes', label: 'Informações', icon: User },
    { id: 'documentos', label: 'Documentos', icon: FileText },
    { id: 'jornada', label: 'Jornada de trabalho', icon: Clock },
    { id: 'ferias', label: 'Férias', icon: Plane },
    { id: 'contrato', label: 'Contrato', icon: PenLine },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4f7] flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Sua Empresa" />

      <div className="flex-1 max-w-5xl w-full mx-auto p-6 flex gap-6">
        <aside className="w-56 shrink-0 space-y-1">
          <div className="mb-3">
            <p className="font-bold text-slate-800 text-sm">{employee.full_name}</p>
            <p className="text-slate-400 text-xs">{employee.position || 'Meu perfil'}</p>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-xs transition-colors ${
                  activeTab === item.id
                    ? 'bg-white text-[#ff8b00] shadow-sm border border-slate-200/60 font-semibold'
                    : 'text-slate-600 hover:bg-slate-200/50 font-medium'
                }`}
              >
                <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-[#ff8b00]' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm">
          {/* INFORMAÇÕES */}
          {activeTab === 'informacoes' && (
            <div className="p-6 space-y-6 text-xs">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-800 text-sm">Meus dados</h2>
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="border border-[#ff8b00] text-[#ff8b00] hover:bg-[#ff8b00]/10 px-3 py-1.5 rounded font-medium transition-colors"
                >
                  Solicitar alteração de dados
                </button>
              </div>

              {myRequests.some((r) => r.status === 'pendente') && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-700">
                  Você tem {myRequests.filter((r) => r.status === 'pendente').length} solicitação(ões) de alteração
                  aguardando análise do gestor.
                </div>
              )}

              <div>
                <h3 className="font-semibold text-slate-700 mb-3">Informações básicas</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="Primeiro nome" value={employee.first_name} />
                  <Field label="Sobrenome" value={employee.last_name} />
                  <Field label="Gênero" value={employee.gender} />
                  <Field label="Data de nascimento" value={formatDDMMYYYY(employee.birth_date)} />
                  <Field label="Estado civil" value={employee.marital_status} />
                  <Field label="CPF" value={employee.cpf} />
                  <Field label="RG" value={employee.rg} />
                  <Field label="PIS/PASEP" value={employee.pis_pasep} />
                  <Field label="E-mail" value={employee.email} />
                  <Field label="Telefone" value={employee.phone} />
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-700 mb-3">Contratação</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="Cargo" value={employee.position} />
                  <Field label="Departamento" value={employee.department} />
                  <Field label="Tipo de contrato" value={employee.contract_type} />
                  <Field label="Data de admissão" value={formatDDMMYYYY(employee.admission_date)} />
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-700 mb-3">Endereço</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="CEP" value={employee.cep} />
                  <Field label="Rua" value={employee.street} />
                  <Field label="Número" value={employee.number} />
                  <Field label="Complemento" value={employee.complement} />
                  <Field label="Bairro" value={employee.neighborhood} />
                  <Field label="Cidade" value={employee.city} />
                  <Field label="Estado" value={employee.state} />
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-700 mb-3">Dados bancários</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="Banco" value={employee.bank_name} />
                  <Field label="Agência" value={employee.bank_agency} />
                  <Field label="Conta" value={employee.bank_account} />
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENTOS — só visualização; quem anexa é o gestor, em
              Usuários → editar → Documentos */}
          {activeTab === 'documentos' && (
            <div className="p-6 text-xs">
              <h2 className="font-bold text-slate-800 text-sm mb-4">Meus documentos</h2>
              {documents.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center text-slate-400">
                  Nenhum documento disponível ainda.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border rounded-lg overflow-hidden">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <button
                          onClick={() => setPreviewFile({ url: doc.file_url, name: doc.file_name })}
                          className="font-medium text-slate-700 hover:text-[#ff8b00] hover:underline text-left"
                        >
                          {doc.file_name}
                        </button>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          {doc.category} — {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* JORNADA DE TRABALHO (estática — só leitura) */}
          {activeTab === 'jornada' && (
            <div className="p-6 text-xs">
              <h2 className="font-bold text-slate-800 text-sm mb-4">Minha jornada de trabalho</h2>
              {!schedule ? (
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center text-slate-400">
                  Nenhuma jornada cadastrada ainda.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border rounded-lg overflow-hidden">
                  {WEEKDAYS.map((wd) => {
                    const day = (schedule.week_days || []).find((d) => d.weekday === wd.key);
                    return (
                      <div key={wd.key} className="flex items-center justify-between px-4 py-3">
                        <span className="font-medium text-slate-700 w-32">{wd.label}</span>
                        {day?.active ? (
                          <span className="text-slate-600">
                            {day.entry} — {day.exit}
                            {day.has_break && day.lunch_start && day.lunch_end && (
                              <span className="text-slate-400"> (intervalo {day.lunch_start}–{day.lunch_end})</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">Folga</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* FÉRIAS */}
          {activeTab === 'ferias' && (
            <div className="p-6 text-xs">
              <h2 className="font-bold text-slate-800 text-sm mb-4">Minhas férias</h2>
              {vacations.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center text-slate-400">
                  Nenhum período de férias registrado ainda.
                </div>
              ) : (
                <div className="space-y-2">
                  {vacations.map((v) => (
                    <div key={v.id} className="border rounded-lg p-3 flex justify-between items-center">
                      <span className="font-medium text-slate-700">
                        {formatDDMMYYYY(v.start_date)} até {formatDDMMYYYY(v.end_date)}
                      </span>
                      {v.status && (
                        <span className="bg-[#ff8b00]/10 text-[#ff8b00] px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          {v.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONTRATO */}
          {activeTab === 'contrato' && (
            <div className="p-6 text-xs space-y-3">
              <h2 className="font-bold text-slate-800 text-sm mb-1">Meu contrato</h2>
              {contracts.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center text-slate-400">
                  Nenhum contrato assinado ainda.
                </div>
              ) : (
                contracts.map((c) => (
                  <div key={c.id} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setOpenContractId(openContractId === c.id ? null : c.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{c.contract_templates?.name}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">Assinado em {new Date(c.signed_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </button>
                    {openContractId === c.id && (
                      <div className="p-4 border-t border-slate-100">
                        <ContractBody
                          text={renderContractText(c.contract_templates?.content, employee)}
                          employeeSignatureUrl={employee.signature_path}
                          managerSignatureUrl={c.manager_signature_url}
                          employerSignatureUrl={c.employer_signature_url}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODAL: SOLICITAR ALTERAÇÃO DE DADOS */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Solicitar alteração de dados</h3>
              <button onClick={() => setShowRequestModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-500">
              Descreva o que você precisa corrigir ou atualizar. Seu gestor vai analisar e fazer a alteração.
            </p>
            <textarea
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              rows={4}
              placeholder="Ex: Meu telefone mudou para (11) 99999-0000"
              className="w-full border rounded p-2.5 text-xs focus:outline-none focus:border-[#ff8b00] resize-y"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowRequestModal(false)} className="px-4 py-2 border rounded text-xs font-medium text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={savingRequest || !requestText.trim()}
                className="bg-[#ff8b00] hover:bg-[#fc9314] text-white text-xs font-semibold px-5 py-2 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {savingRequest && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Enviar solicitação
              </button>
            </div>
          </div>
        </div>
      )}

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
