import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import {
  FileText, Plus, Search, Loader2, ArrowLeft, ChevronRight,
  MoreHorizontal, CheckCircle2, Clock, X
} from 'lucide-react';

// ---------------------------------------------------------------------------
// VARIÁVEIS DO CONTRATO — cada chip insere um token {ASSIM} no texto do
// template. Na hora de exibir/assinar, esses tokens são trocados pelos
// dados reais do colaborador (renderContractText). Simplificação em
// relação ao modelo de referência: aqui o editor é texto simples (sem
// negrito/tabela/etc) — dá pra evoluir pra um editor rico depois se quiser.
// ---------------------------------------------------------------------------
const COLABORADOR_TOKEN_GROUPS = [
  {
    label: 'Informações básicas',
    items: [
      ['Nome completo', 'COLABORADOR_NOME_COMPLETO'],
      ['Primeiro nome', 'COLABORADOR_PRIMEIRO_NOME'],
      ['Sobrenome', 'COLABORADOR_SOBRENOME'],
      ['Gênero', 'COLABORADOR_GENERO'],
      ['Data de nascimento', 'COLABORADOR_DATA_NASCIMENTO'],
      ['CPF', 'COLABORADOR_CPF'],
      ['RG', 'COLABORADOR_RG'],
      ['PIS/PASEP', 'COLABORADOR_PIS'],
      ['Estado civil', 'COLABORADOR_ESTADO_CIVIL'],
      ['E-mail', 'COLABORADOR_EMAIL'],
      ['Telefone', 'COLABORADOR_TELEFONE'],
      ['Dados bancários', 'COLABORADOR_DADOS_BANCARIOS'],
    ],
  },
  {
    label: 'Endereço',
    items: [
      ['Endereço completo', 'COLABORADOR_ENDERECO_COMPLETO'],
      ['CEP', 'COLABORADOR_CEP'],
      ['Rua', 'COLABORADOR_RUA'],
      ['Número', 'COLABORADOR_NUMERO'],
      ['Complemento', 'COLABORADOR_COMPLEMENTO'],
      ['Bairro', 'COLABORADOR_BAIRRO'],
      ['Cidade', 'COLABORADOR_CIDADE'],
      ['Estado', 'COLABORADOR_ESTADO'],
    ],
  },
];

const CONTRATO_TOKEN_GROUPS = [
  {
    label: 'Informações contratuais',
    items: [
      ['Tipo de contrato', 'CONTRATO_TIPO'],
      ['Cargo', 'CONTRATO_CARGO'],
      ['Departamento', 'CONTRATO_DEPARTAMENTO'],
      ['Remuneração', 'CONTRATO_REMUNERACAO'],
      ['Data de admissão', 'CONTRATO_DATA_ADMISSAO'],
      ['Data de hoje', 'CONTRATO_DATA_ATUAL'],
      ['Assinatura do colaborador', 'ASSINATURA_COLABORADOR'],
      ['Assinatura do gestor', 'ASSINATURA_GESTOR'],
    ],
  },
];

const formatDDMMYYYY = (isoDate) => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
};

// Troca os tokens de dado (tudo menos assinatura) pelo valor real do
// colaborador. Os tokens de assinatura ficam intactos de propósito — quem
// exibe o contrato (aqui ou na tela de assinatura) é quem decide desenhar
// a imagem da assinatura no lugar certo.
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

// Renderiza o texto já processado, trocando {ASSINATURA_COLABORADOR} e
// {ASSINATURA_GESTOR} por uma imagem de verdade (ou um aviso de pendente).
function ContractBody({ text, employeeSignatureUrl, managerSignatureUrl }) {
  const parts = text.split(/(\{ASSINATURA_COLABORADOR\}|\{ASSINATURA_GESTOR\})/g);
  return (
    <div className="whitespace-pre-wrap leading-relaxed text-slate-700">
      {parts.map((part, idx) => {
        if (part === '{ASSINATURA_COLABORADOR}') {
          return employeeSignatureUrl ? (
            <img key={idx} src={employeeSignatureUrl} alt="Assinatura do colaborador" className="h-16 inline-block align-middle" />
          ) : (
            <span key={idx} className="text-amber-600 font-medium">[assinatura do colaborador pendente]</span>
          );
        }
        if (part === '{ASSINATURA_GESTOR}') {
          return managerSignatureUrl ? (
            <img key={idx} src={managerSignatureUrl} alt="Assinatura do gestor" className="h-16 inline-block align-middle" />
          ) : (
            <span key={idx} className="text-amber-600 font-medium">[assinatura do gestor pendente]</span>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </div>
  );
}

export default function Contratos() {
  const { user: loggedInUser } = useAuth();

  const [section, setSection] = useState('contratos'); // 'contratos' | 'assinaturas'
  const [subView, setSubView] = useState('list'); // 'list' | 'detalhe' | 'editor' | 'vinculos'

  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [searchTemplates, setSearchTemplates] = useState('');

  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [editorName, setEditorName] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [tokenTab, setTokenTab] = useState('colaborador');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const contentRef = useRef(null);

  const [allEmployees, setAllEmployees] = useState([]);
  const [linkedIds, setLinkedIds] = useState(new Set());
  const [linkedStatusMap, setLinkedStatusMap] = useState({}); // { employeeId: 'pendente' | 'assinado' }
  const [duplicateWarning, setDuplicateWarning] = useState(null); // { names: string[] } | null
  const [selectedToLink, setSelectedToLink] = useState(new Set());
  const [linkTab, setLinkTab] = useState('todos'); // 'todos' | 'vinculados' | 'nao_vinculados'
  const [linkSearch, setLinkSearch] = useState('');
  const [savingLink, setSavingLink] = useState(false);
  const [confirmUnlinkOpen, setConfirmUnlinkOpen] = useState(false);

  const [assinaturasTab, setAssinaturasTab] = useState('pendentes'); // 'pendentes' | 'assinados'
  const [contractsList, setContractsList] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);

  const [viewingContract, setViewingContract] = useState(null); // pra pré-visualizar um contrato assinado/pendente

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    if (!supabase) return;
    setLoadingTemplates(true);
    const { data, error } = await supabase
      .from('contract_templates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('Erro ao buscar templates de contrato:', error);
    setTemplates(data || []);
    setLoadingTemplates(false);
  };

  const filteredTemplates = templates.filter((t) =>
    (t.name || '').toLowerCase().includes(searchTemplates.toLowerCase())
  );

  // ---------------------------------------------------------------------
  // EDITOR DE TEMPLATE
  // ---------------------------------------------------------------------
  function openNewTemplate() {
    setCurrentTemplate(null);
    setEditorName('');
    setEditorContent('');
    setSubView('editor');
  }

  // "Abrir" na lista leva pra cá — mostra o contrato (nome + texto), com
  // botão pra editar e outro pra ir direto vincular colaboradores.
  function openTemplateDetail(template) {
    setCurrentTemplate(template);
    setSubView('detalhe');
  }

  // Botão "Editar" dentro do detalhe — pré-preenche o editor com o que já
  // existe (antes só dava pra criar um novo, nunca editar um salvo).
  function openEditTemplate(template) {
    setCurrentTemplate(template);
    setEditorName(template.name || '');
    setEditorContent(template.content || '');
    setSubView('editor');
  }

  function insertToken(token) {
    const el = contentRef.current;
    if (!el) {
      setEditorContent((prev) => `${prev}{${token}}`);
      return;
    }
    const start = el.selectionStart ?? editorContent.length;
    const end = el.selectionEnd ?? editorContent.length;
    const insertion = `{${token}}`;
    const newValue = editorContent.slice(0, start) + insertion + editorContent.slice(end);
    setEditorContent(newValue);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + insertion.length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function handleSaveTemplate() {
    if (!editorName.trim()) {
      alert('Dê um nome para o contrato.');
      return;
    }
    setSavingTemplate(true);
    try {
      let savedTemplate = currentTemplate;
      if (currentTemplate) {
        const { data, error } = await supabase
          .from('contract_templates')
          .update({ name: editorName.trim(), content: editorContent })
          .eq('id', currentTemplate.id)
          .select()
          .single();
        if (error) throw error;
        savedTemplate = data;
      } else {
        const { data, error } = await supabase.from('contract_templates').insert([{
          name: editorName.trim(),
          content: editorContent,
          created_by: loggedInUser?.id || null,
        }]).select().single();
        if (error) throw error;
        savedTemplate = data;
      }
      await fetchTemplates();
      // Volta pra tela de detalhe do próprio contrato (recém-criado ou
      // recém-editado) em vez de voltar pra lista — assim o gestor já vê
      // o resultado e pode ir direto vincular colaboradores.
      setCurrentTemplate(savedTemplate);
      setSubView('detalhe');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar o contrato: ' + err.message);
    } finally {
      setSavingTemplate(false);
    }
  }

  // ---------------------------------------------------------------------
  // VÍNCULOS DO CONTRATO
  // ---------------------------------------------------------------------
  async function openLinks(template) {
    setCurrentTemplate(template);
    setLinkTab('todos');
    setSelectedToLink(new Set());
    setSubView('vinculos');

    const { data: emps } = await supabase
      .from('Employees')
      .select('id, full_name, position, status')
      .order('full_name', { ascending: true });
    setAllEmployees(emps || []);

    const { data: links } = await supabase
      .from('employee_contracts')
      .select('employee_id, status')
      .eq('template_id', template.id);
    setLinkedIds(new Set((links || []).map((l) => l.employee_id)));
    setLinkedStatusMap(Object.fromEntries((links || []).map((l) => [l.employee_id, l.status])));
  }

  const linkSearchLower = linkSearch.toLowerCase();
  const visibleEmployeesForLink = allEmployees
    .filter((e) => (e.full_name || '').toLowerCase().includes(linkSearchLower))
    .filter((e) => {
      if (linkTab === 'vinculados') return linkedIds.has(e.id);
      if (linkTab === 'nao_vinculados') return !linkedIds.has(e.id);
      return true;
    });

  function toggleSelectToLink(id) {
    setSelectedToLink((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConfirmLink() {
    if (!currentTemplate || selectedToLink.size === 0) return;

    // Quem já tem ESTE template assinado não pode ser vinculado de novo —
    // pra reemitir, o gestor precisa desvincular o contrato atual dele
    // primeiro (ou usar outro template). Colaboradores com vínculo ainda
    // "pendente" (não assinado) não entram nesse bloqueio, só os assinados.
    const alreadySigned = Array.from(selectedToLink).filter((id) => linkedStatusMap[id] === 'assinado');
    if (alreadySigned.length > 0) {
      const names = allEmployees
        .filter((e) => alreadySigned.includes(e.id))
        .map((e) => e.full_name);
      setDuplicateWarning({ names });
    }

    const idsToLink = Array.from(selectedToLink).filter(
      (id) => !linkedIds.has(id) && !alreadySigned.includes(id)
    );
    if (idsToLink.length === 0) return;

    setSavingLink(true);
    try {
      const rows = idsToLink.map((employee_id) => ({
        template_id: currentTemplate.id,
        employee_id,
        status: 'pendente',
      }));
      const { error } = await supabase.from('employee_contracts').insert(rows);
      if (error) throw error;

      setLinkedIds((prev) => new Set([...prev, ...idsToLink]));
      setLinkedStatusMap((prev) => ({
        ...prev,
        ...Object.fromEntries(idsToLink.map((id) => [id, 'pendente'])),
      }));
      setSelectedToLink(new Set());
    } catch (err) {
      console.error(err);
      alert('Erro ao vincular colaboradores: ' + err.message);
    } finally {
      setSavingLink(false);
    }
  }

  async function handleConfirmUnlink() {
    if (!currentTemplate || selectedToLink.size === 0) return;
    setSavingLink(true);
    try {
      const { error } = await supabase
        .from('employee_contracts')
        .delete()
        .eq('template_id', currentTemplate.id)
        .in('employee_id', Array.from(selectedToLink));
      if (error) throw error;

      setLinkedIds((prev) => {
        const next = new Set(prev);
        selectedToLink.forEach((id) => next.delete(id));
        return next;
      });
      setLinkedStatusMap((prev) => {
        const next = { ...prev };
        selectedToLink.forEach((id) => delete next[id]);
        return next;
      });
      setSelectedToLink(new Set());
      setConfirmUnlinkOpen(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao desvincular colaboradores: ' + err.message);
    } finally {
      setSavingLink(false);
    }
  }

  // ---------------------------------------------------------------------
  // GERENCIAR ASSINATURAS
  // ---------------------------------------------------------------------
  async function fetchContractsOverview() {
    setLoadingContracts(true);
    const { data, error } = await supabase
      .from('employee_contracts')
      .select('*, contract_templates(name, content), Employees(full_name, position, department, signature_path)')
      .order('created_at', { ascending: false });
    if (error) console.error('Erro ao buscar contratos:', error);
    setContractsList(data || []);
    setLoadingContracts(false);
  }

  useEffect(() => {
    if (section === 'assinaturas') fetchContractsOverview();
  }, [section]);

  const pendingContracts = contractsList.filter((c) => c.status === 'pendente');
  const signedContracts = contractsList.filter((c) => c.status === 'assinado');

  return (
    <div className="min-h-screen bg-[#f0f4f7] flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Sua Empresa" />

      <div className="flex flex-1">
        {/* SIDEBAR */}
        <aside className="w-56 min-w-[200px] p-5 space-y-4 shrink-0">
          <h1 className="text-xs font-bold uppercase tracking-wider text-slate-500">Contratos</h1>
          <nav className="space-y-1">
            <button
              onClick={() => { setSection('contratos'); setSubView('list'); }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                section === 'contratos'
                  ? 'bg-white text-slate-700 border-l-4 border-[#ff8b00] shadow-sm font-semibold'
                  : 'text-slate-500 hover:bg-[#1a2c6a] hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              Gerenciar Contratos
            </button>
            <button
              onClick={() => setSection('assinaturas')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                section === 'assinaturas'
                  ? 'bg-white text-slate-700 border-l-4 border-[#ff8b00] shadow-sm font-semibold'
                  : 'text-slate-500 hover:bg-[#1a2c6a] hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Gerenciar Assinaturas
            </button>
          </nav>
        </aside>

        {/* CONTEÚDO */}
        <main className="flex-1 p-6 pl-0">
          <div className="text-xs text-slate-500 mb-3">
            Painel <ChevronRight className="w-3 h-3 inline mx-1" />
            <span className="text-[#ff8b00] font-medium">
              {section === 'contratos'
                ? (subView === 'editor' ? (currentTemplate ? 'Editar contrato' : 'Novo contrato')
                   : subView === 'vinculos' ? 'Vínculos do contrato'
                   : subView === 'detalhe' ? (currentTemplate?.name || 'Contrato')
                   : 'Contratos')
                : 'Assinatura de contratos'}
            </span>
          </div>

          {/* ===================== GERENCIAR CONTRATOS — LISTA ===================== */}
          {section === 'contratos' && subView === 'list' && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900">
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  onClick={openNewTemplate}
                  className="bg-[#ff8b00] hover:bg-[#fc9314] text-white text-xs font-bold px-4 py-2 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Criar novo
                </button>
              </div>
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchTemplates}
                    onChange={(e) => setSearchTemplates(e.target.value)}
                    placeholder="Buscar"
                    className="w-full text-xs bg-transparent focus:outline-none"
                  />
                </div>
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-100">
                    <th className="py-2.5 px-4">Nome</th>
                    <th className="py-2.5 px-4">Criado em</th>
                    <th className="py-2.5 px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingTemplates ? (
                    <tr><td colSpan={3} className="py-10 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
                  ) : filteredTemplates.length === 0 ? (
                    <tr><td colSpan={3} className="py-10 text-center text-slate-400">Nenhum contrato encontrado</td></tr>
                  ) : (
                    filteredTemplates.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-700">{t.name}</td>
                        <td className="py-3 px-4 text-slate-500">{new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openTemplateDetail(t)}
                            className="bg-[#ff8b00] hover:bg-[#fc9314] text-white text-[11px] font-semibold px-3 py-1.5 rounded transition-colors"
                          >
                            Abrir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ===================== DETALHE DO CONTRATO (botão "Abrir") ===================== */}
          {section === 'contratos' && subView === 'detalhe' && currentTemplate && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <button onClick={() => setSubView('list')} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900">
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditTemplate(currentTemplate)}
                    className="border border-[#ff8b00] text-[#ff8b00] hover:bg-[#ff8b00]/10 text-xs font-bold px-4 py-2 rounded-md transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => openLinks(currentTemplate)}
                    className="bg-[#ff8b00] hover:bg-[#fc9314] text-white text-xs font-bold px-4 py-2 rounded-md transition-colors"
                  >
                    Vincular ao colaborador
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h2 className="font-bold text-slate-800 text-lg">{currentTemplate.name}</h2>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Criado em {new Date(currentTemplate.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-700 text-xs">
                    {currentTemplate.content || <span className="text-slate-400 italic">Este contrato ainda não tem conteúdo. Clique em "Editar" pra escrever.</span>}
                  </p>
                </div>
                <p className="text-slate-400 text-[11px]">
                  As variáveis (como {'{COLABORADOR_NOME_COMPLETO}'}) aparecem aqui como texto — elas só são trocadas pelos dados reais quando o contrato é visualizado ou assinado por um colaborador específico, em "Vincular ao colaborador" ou em "Gerenciar Assinaturas".
                </p>
              </div>
            </div>
          )}

          {/* ===================== EDITOR DE TEMPLATE ===================== */}
          {section === 'contratos' && subView === 'editor' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
                <button
                  onClick={() => setSubView(currentTemplate ? 'detalhe' : 'list')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome*</label>
                  <input
                    type="text"
                    value={editorName}
                    onChange={(e) => setEditorName(e.target.value)}
                    placeholder="Nome do contrato"
                    className="w-full border rounded p-2.5 text-xs focus:outline-none focus:border-[#ff8b00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Conteúdo</label>
                  <textarea
                    ref={contentRef}
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    rows={18}
                    placeholder="Escreva o contrato aqui. Clique nas variáveis ao lado pra inserir os dados do colaborador."
                    className="w-full border rounded p-3 text-xs font-mono focus:outline-none focus:border-[#ff8b00] resize-y"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveTemplate}
                    disabled={savingTemplate}
                    className="bg-[#ff8b00] hover:bg-[#fc9314] text-white text-xs font-bold px-5 py-2.5 rounded-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {savingTemplate && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Salvar contrato
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-3">
                <h3 className="font-bold text-slate-800 text-sm">Variáveis do usuário</h3>
                <div className="flex gap-4 text-xs font-semibold border-b border-slate-100">
                  <button
                    onClick={() => setTokenTab('colaborador')}
                    className={`pb-2 ${tokenTab === 'colaborador' ? 'text-[#ff8b00] border-b-2 border-[#ff8b00]' : 'text-slate-400'}`}
                  >
                    Colaborador
                  </button>
                  <button
                    onClick={() => setTokenTab('contrato')}
                    className={`pb-2 ${tokenTab === 'contrato' ? 'text-[#ff8b00] border-b-2 border-[#ff8b00]' : 'text-slate-400'}`}
                  >
                    Contrato
                  </button>
                </div>
                <div className="space-y-3 max-h-[480px] overflow-y-auto">
                  {(tokenTab === 'colaborador' ? COLABORADOR_TOKEN_GROUPS : CONTRATO_TOKEN_GROUPS).map((group) => (
                    <div key={group.label}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{group.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map(([label, token]) => (
                          <button
                            key={token}
                            type="button"
                            onClick={() => insertToken(token)}
                            className="bg-[#ff8b00]/10 text-[#ff8b00] hover:bg-[#ff8b00] hover:text-white px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================== VÍNCULOS DO CONTRATO ===================== */}
          {section === 'contratos' && subView === 'vinculos' && currentTemplate && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <button onClick={() => setSubView('detalhe')} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900">
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmUnlinkOpen(true)}
                    disabled={selectedToLink.size === 0 || savingLink}
                    className="border border-slate-300 text-slate-500 px-4 py-2 rounded-md text-xs font-bold disabled:opacity-40"
                  >
                    Desvincular
                  </button>
                  <button
                    onClick={handleConfirmLink}
                    disabled={selectedToLink.size === 0 || savingLink}
                    className="bg-[#ff8b00] hover:bg-[#fc9314] text-white px-4 py-2 rounded-md text-xs font-bold transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {savingLink && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Vincular{selectedToLink.size > 0 ? ` (${selectedToLink.size})` : ''}
                  </button>
                </div>
              </div>

              <div className="flex gap-6 px-4 border-b border-slate-100 text-xs font-semibold">
                {[
                  ['todos', `${allEmployees.length} usuários`],
                  ['vinculados', `${linkedIds.size} vinculados`],
                  ['nao_vinculados', `${allEmployees.length - linkedIds.size} não vinculados`],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setLinkTab(key)}
                    className={`py-3 ${linkTab === key ? 'text-[#ff8b00] border-b-2 border-[#ff8b00]' : 'text-slate-400'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {selectedToLink.size > 0 && (
                <div className="flex items-center justify-between px-4 py-2 bg-[#ff8b00]/10 text-xs">
                  <span className="text-[#ff8b00] font-medium">{selectedToLink.size} item(ns) selecionado(s) desta página.</span>
                  <button onClick={() => setSelectedToLink(new Set())} className="text-slate-500 hover:text-slate-700 flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Limpar seleção
                  </button>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 mb-3">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={linkSearch}
                    onChange={(e) => setLinkSearch(e.target.value)}
                    placeholder="Buscar usuários"
                    className="w-full text-xs bg-transparent focus:outline-none"
                  />
                </div>

                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-100">
                      <th className="py-2 px-2 w-8">
                        <input
                          type="checkbox"
                          checked={visibleEmployeesForLink.length > 0 && visibleEmployeesForLink.every((e) => selectedToLink.has(e.id))}
                          onChange={(e) =>
                            setSelectedToLink(new Set(e.target.checked ? visibleEmployeesForLink.map((emp) => emp.id) : []))
                          }
                          className="accent-[#ff8b00]"
                        />
                      </th>
                      <th className="py-2 px-2">Usuário</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 px-2">Cargo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleEmployeesForLink.length === 0 ? (
                      <tr><td colSpan={4} className="py-8 text-center text-slate-400">Nenhum resultado</td></tr>
                    ) : (
                      visibleEmployeesForLink.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-2">
                            <input
                              type="checkbox"
                              checked={selectedToLink.has(emp.id)}
                              onChange={() => toggleSelectToLink(emp.id)}
                              className="accent-[#ff8b00]"
                            />
                          </td>
                          <td className="py-2.5 px-2 font-medium text-slate-700 flex items-center gap-2">
                            {emp.full_name}
                            {linkedStatusMap[emp.id] === 'assinado' && (
                              <span className="bg-[#ff8b00]/10 text-[#ff8b00] px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                Já assinado
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-slate-500">{emp.status || 'Ativo'}</td>
                          <td className="py-2.5 px-2 text-slate-500">{emp.position || '(Preencher)'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================== GERENCIAR ASSINATURAS ===================== */}
          {section === 'assinaturas' && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="flex gap-6 px-4 border-b border-slate-100 text-xs font-semibold pt-2">
                {[['pendentes', `Pendentes (${pendingContracts.length})`], ['assinados', `Assinados (${signedContracts.length})`]].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setAssinaturasTab(key)}
                    className={`py-3 ${assinaturasTab === key ? 'text-[#ff8b00] border-b-2 border-[#ff8b00]' : 'text-slate-400'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-100">
                    <th className="py-2.5 px-4">Colaborador</th>
                    <th className="py-2.5 px-4">Contrato</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingContracts ? (
                    <tr><td colSpan={4} className="py-10 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
                  ) : (assinaturasTab === 'pendentes' ? pendingContracts : signedContracts).length === 0 ? (
                    <tr><td colSpan={4} className="py-10 text-center text-slate-400">Nenhum resultado</td></tr>
                  ) : (
                    (assinaturasTab === 'pendentes' ? pendingContracts : signedContracts).map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-medium text-slate-700">{c.Employees?.full_name}</td>
                        <td className="py-3 px-4 text-slate-500">{c.contract_templates?.name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            c.status === 'assinado' ? 'bg-[#ff8b00]/10 text-[#ff8b00]' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {c.status === 'assinado' ? 'Assinado' : 'Aguardando'}
                          </span>
                          {c.signed_at && (
                            <span className="text-slate-400 ml-2">{new Date(c.signed_at).toLocaleString('pt-BR')}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setViewingContract(c)}
                            className="text-[#ff8b00] hover:underline font-medium"
                          >
                            Ver contrato
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: CONFIRMAR DESVINCULAR */}
      {confirmUnlinkOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 space-y-4 text-center">
            <h3 className="font-bold text-slate-800 text-sm">Atenção!</h3>
            <p className="text-xs text-slate-500">
              Deseja realmente desvincular {selectedToLink.size} usuário(s) deste contrato?
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={() => setConfirmUnlinkOpen(false)} className="px-4 py-2 border border-red-300 text-red-500 rounded text-xs font-medium hover:bg-red-50">
                Cancelar
              </button>
              <button onClick={handleConfirmUnlink} className="px-4 py-2 bg-[#ff8b00] hover:bg-[#fc9314] text-white rounded text-xs font-medium transition-colors">
                Sim, desvincular
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONTRATO JÁ ASSINADO (bloqueia vínculo duplicado) */}
      {duplicateWarning && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 space-y-4 text-center">
            <h3 className="font-bold text-slate-800 text-sm">Contrato já assinado</h3>
            <p className="text-xs text-slate-500">
              {duplicateWarning.names.length === 1 ? (
                <>
                  <strong>{duplicateWarning.names[0]}</strong> já tem este contrato ativo e assinado —
                  não é possível vincular de novo o mesmo template.
                </>
              ) : (
                <>
                  Os colaboradores abaixo já têm este contrato ativo e assinado — não é possível
                  vincular de novo o mesmo template pra eles:
                  <br /><strong>{duplicateWarning.names.join(', ')}</strong>
                </>
              )}
            </p>
            <p className="text-[11px] text-slate-400">
              Pra reemitir, use outro contrato ou desvincule o atual dele(s) primeiro (aba "Vinculados" → selecionar → "Desvincular").
            </p>
            <div className="flex justify-center pt-2">
              <button onClick={() => setDuplicateWarning(null)} className="px-5 py-2 bg-[#ff8b00] hover:bg-[#fc9314] text-white rounded text-xs font-medium transition-colors">
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZAR CONTRATO */}
      {viewingContract && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">
                {viewingContract.contract_templates?.name} — {viewingContract.Employees?.full_name}
              </h3>
              <button onClick={() => setViewingContract(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-xs">
              <ContractBody
                text={renderContractText(viewingContract.contract_templates?.content, viewingContract.Employees || {})}
                employeeSignatureUrl={viewingContract.status === 'assinado' ? viewingContract.Employees?.signature_path : null}
                managerSignatureUrl={null}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
