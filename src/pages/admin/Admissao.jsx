import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import {
  Search,
  ArrowLeft,
  Plus,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Loader2,
  Link as LinkIcon,
  Share2
} from 'lucide-react';

export default function Admissao() {
  const navigate = useNavigate();

  // Fluxos de navegação: 'list' | 'select_employees' | 'create_template' | 'select_template' | 'view_admission'
  const [viewState, setViewState] = useState('list');
  const [activeTab, setActiveTab] = useState('andamento'); // 'andamento' | 'concluidos' | 'templates'

  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Dados do banco
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Fluxo de Seleção de Colaborador e Template
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [activeAdmission, setActiveAdmission] = useState(null);

  // Estado para a criação de Novo Template
  const [newTemplateName, setNewTemplateName] = useState('');
  const [templateSteps, setTemplateSteps] = useState([
    { id: '1', name: 'Selfie', type: 'anexo/foto', active: true },
    { id: '2', name: 'Estado civil', type: 'selecionar opção', active: true },
    { id: '3', name: 'Telefone', type: 'campo texto', active: true },
    { id: '4', name: 'E-mail', type: 'campo texto', active: true },
    { id: '5', name: 'Número do RG', type: 'campo texto', active: true },
    { id: '6', name: 'Número do PIS', type: 'campo texto', active: true },
    { id: '7', name: 'Endereço', type: 'campo texto', active: true },
    { id: '8', name: 'Dados bancários', type: 'campo texto', active: true },
    { id: '9', name: 'Data de nascimento', type: 'campo data', active: true },
  ]);
  const [customSteps, setCustomSteps] = useState([]);

  // Accordion do modo Visualização
  const [expandedField, setExpandedField] = useState(null);

  // Toast simples de feedback (copiar link, etc.)
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 2500);
  };

  useEffect(() => {
    fetchData();
  }, [viewState, activeTab]);

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      // Carregar Templates
      const { data: tmplData } = await supabase
        .from('admission_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (tmplData) setTemplates(tmplData);

      // Carregar Colaboradores
      const { data: empData, error: empError } = await supabase
        .from('Employees')
        .select('*')
        .order('full_name', { ascending: true });
      if (empError) console.error('Erro ao carregar colaboradores:', empError);
      if (empData) setEmployees(empData);

      // Carregar Admissões
      const { data: admData } = await supabase
        .from('employee_admissions')
        .select(`
          id,
          status,
          template_name,
          template_id,
          created_at,
          employee_id,
          progress_data,
          Employees (
            id,
            full_name,
            first_name,
            last_name,
            position,
            department
          )
        `)
        .order('created_at', { ascending: false });
      if (admData) setAdmissions(admData);

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS E AÇÕES ---

  const handleToggleStep = (id) => {
    setTemplateSteps(prev =>
      prev.map(step => step.id === id ? { ...step, active: !step.active } : step)
    );
  };

  const handleAddCustomStep = () => {
    const title = prompt('Digite o nome da nova etapa/campo:');
    if (title) {
      setCustomSteps(prev => [
        ...prev,
        { id: Date.now().toString(), name: title, type: 'campo personalizado', active: true }
      ]);
    }
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      alert('Por favor, informe o nome do template.');
      return;
    }

    setLoading(true);
    const allSteps = [...templateSteps, ...customSteps];

    try {
      const { error } = await supabase.from('admission_templates').insert([
        {
          title: newTemplateName,
          description: `${allSteps.filter(s => s.active).length} campos configurados`,
          steps: allSteps,
          is_active: true
        }
      ]);

      if (!error) {
        setNewTemplateName('');
        setViewState('list');
        setActiveTab('templates');
        fetchData();
      } else {
        alert('Erro ao salvar template.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Abre a listagem de colaboradores (puxados da tabela Employees do Supabase)
  const handleOpenEmployeeSelection = () => {
    setSearchQuery('');
    setSelectedEmployees([]);
    setViewState('select_employees');
  };

  const handleToggleEmployeeSelection = (empId) => {
    setSelectedEmployees(prev =>
      prev.includes(empId)
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const handleStartAdmissionFlow = () => {
    if (selectedEmployees.length === 0) {
      alert('Selecione ao menos um colaborador.');
      return;
    }
    setViewState('select_template');
  };

  const handleConfirmTemplateSelection = async () => {
    if (!selectedTemplateId) {
      alert('Selecione um template.');
      return;
    }

    setLoading(true);
    const chosenTemplate = templates.find(t => t.id === selectedTemplateId);

    try {
      const inserts = selectedEmployees.map(empId => ({
        employee_id: empId,
        template_id: chosenTemplate?.id,
        template_name: chosenTemplate?.title || 'Template Padrão',
        status: 'Em andamento',
        progress_data: {}
      }));

      const { data, error } = await supabase.from('employee_admissions').insert(inserts).select(`
        id,
        status,
        template_name,
        template_id,
        created_at,
        employee_id,
        progress_data,
        Employees (
          id,
          full_name,
          first_name,
          last_name,
          position,
          department
        )
      `);

      if (!error && data && data.length > 0) {
        setSelectedEmployees([]);
        setSelectedTemplateId(null);
        setActiveAdmission(data[0]);
        setViewState('view_admission');
        fetchData();
      } else if (error) {
        console.error(error);
        alert('Erro ao iniciar admissão.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdmissionView = (adm) => {
    setActiveAdmission(adm);
    setViewState('view_admission');
  };

  const getAdmissionLink = (adm) => `${window.location.origin}/preencher-admissao/${adm.id}`;

  const handleCopyAdmissionLink = async (adm) => {
    const link = getAdmissionLink(adm);
    try {
      await navigator.clipboard.writeText(link);
      showToast('Link copiado para a área de transferência!');
    } catch (err) {
      console.error('Erro ao copiar link:', err);
      alert('Não foi possível copiar automaticamente. Copie o link manualmente:\n' + link);
    }
  };

  const handleShareWhatsapp = (adm) => {
    const link = getAdmissionLink(adm);
    const text = `Olá! Segue o link para preenchimento dos seus dados de admissão na empresa: ${link}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Helpers de formatação
  const formatDate = (dateString) => {
    if (!dateString) return '09/08/2026';
    const d = new Date(dateString);
    return d.toLocaleDateString('pt-BR');
  };

  const getInitials = (fullName, firstName, lastName) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (fullName) {
      const parts = fullName.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      return parts[0].substring(0, 2).toUpperCase();
    }
    return 'WD';
  };

  // Filtros de busca
  const filteredAdmissions = admissions.filter(adm => {
    const emp = adm.Employees;
    const name = emp?.full_name || `${emp?.first_name || ''} ${emp?.last_name || ''}`;
    const matches = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (emp?.position || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'andamento') return matches && adm.status === 'Em andamento';
    if (activeTab === 'concluidos') return matches && adm.status === 'Concluído';
    return matches;
  });

  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEmployees = employees.filter(emp => {
    const name = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`;
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (emp.position || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
           (emp.department || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#f0f4f7] flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Empresa Teste 11738" />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-4">
        {/* BREADCRUMB */}
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <Link to="/admin" className="hover:text-[#ff8b00] transition-colors">Painel</Link>
          <span>&gt;</span>
          <span className="text-slate-600 font-medium">
            {viewState === 'select_employees' && (
              <>
                <button onClick={() => setViewState('list')} className="hover:text-[#ff8b00]">Admissão</button>
                <span> &gt; </span>
                <span className="text-[#ff8b00]">Selecionar colaboradores</span>
              </>
            )}
            {viewState === 'create_template' && (
              <>
                <button onClick={() => setViewState('list')} className="hover:text-[#ff8b00]">Admissão</button>
                <span> &gt; </span>
                <span className="text-[#ff8b00]">Novo Template</span>
              </>
            )}
            {viewState === 'select_template' && (
              <>
                <button onClick={() => setViewState('list')} className="hover:text-[#ff8b00]">Admissão</button>
                <span> &gt; </span>
                <span className="text-[#ff8b00]">Selecionar template</span>
              </>
            )}
            {viewState === 'view_admission' && (
              <>
                <button onClick={() => setViewState('list')} className="hover:text-[#ff8b00]">Admissão</button>
                <span> &gt; </span>
                <span className="text-[#ff8b00]">Visualização</span>
              </>
            )}
            {viewState === 'list' && 'Admissão'}
          </span>
        </div>

        {/* TÍTULO PRINCIPAL */}
        <h1 className="text-lg font-bold text-slate-800">Admissão</h1>

        {/* MODO 1: LISTAGEM PRINCIPAL */}
        {viewState === 'list' && (
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            {/* CABEÇALHO */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <button
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>

              {activeTab === 'templates' ? (
                <button
                  onClick={() => setViewState('create_template')}
                  className="border border-[#ff8b00] text-[#ff8b00] hover:bg-[#ff8b00]/10 text-xs font-semibold px-4 py-2 rounded transition-colors"
                >
                  Novo Template
                </button>
              ) : (
                <button
                  onClick={handleOpenEmployeeSelection}
                  className="bg-[#ff8b00] hover:bg-[#00897b] text-white text-xs font-semibold px-4 py-2 rounded transition-colors shadow-sm"
                >
                  Iniciar admissão
                </button>
              )}
            </div>

            {/* NAVEGAÇÃO POR ABAS */}
            <div className="flex border-b border-slate-200 px-4 pt-2 gap-8 text-xs font-medium bg-white">
              <button
                onClick={() => setActiveTab('andamento')}
                className={`pb-3 transition-colors ${
                  activeTab === 'andamento'
                    ? 'border-b-2 border-[#ff8b00] text-[#ff8b00] font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Em andamento
              </button>
              <button
                onClick={() => setActiveTab('concluidos')}
                className={`pb-3 transition-colors ${
                  activeTab === 'concluidos'
                    ? 'border-b-2 border-[#ff8b00] text-[#ff8b00] font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Concluídos
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`pb-3 transition-colors ${
                  activeTab === 'templates'
                    ? 'border-b-2 border-[#ff8b00] text-[#ff8b00] font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Templates
              </button>
            </div>

            {/* BARRA DE PESQUISA */}
            <div className="p-4 bg-white border-b border-slate-100">
              <div className="relative max-w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'templates'
                      ? 'Buscar template...'
                      : 'Digite o nome do funcionário, cargo ou departamento'
                  }
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-[#ff8b00]"
                />
              </div>
            </div>

            {/* TABELAS DAS ABAS */}
            {activeTab !== 'templates' ? (
              <div className="overflow-x-auto min-h-[220px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50/50">
                      <th className="py-3 px-6">NOME</th>
                      <th className="py-3 px-4">STATUS ADMISSÃO</th>
                      <th className="py-3 px-4">TEMPLATE</th>
                      <th className="py-3 px-4">CARGO</th>
                      <th className="py-3 px-4">DEPARTAMENTO</th>
                      <th className="py-3 px-4 text-center">AÇÃO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ff8b00]" />
                          Carregando...
                        </td>
                      </tr>
                    ) : filteredAdmissions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-500 font-medium">
                          Nenhum processo de admissão encontrado
                        </td>
                      </tr>
                    ) : (
                      filteredAdmissions.map((adm) => {
                        const emp = adm.Employees || {};
                        const name = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Usuário Sem Nome';
                        const initials = getInitials(name, emp.first_name, emp.last_name);

                        return (
                          <tr key={adm.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs">
                                  {initials}
                                </div>
                                <span className="font-bold text-slate-800">{name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                                  <div className="bg-[#ff8b00] h-full w-[55%]"></div>
                                </div>
                                <span className="text-[11px] font-medium text-slate-500">5/9</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">{adm.template_name || 'Admissão Matheus'}</td>
                            <td className="py-3 px-4 text-slate-600">{emp.position || 'Atendente'}</td>
                            <td className="py-3 px-4 text-slate-600">{emp.department || '-'}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1">
                                {adm.status === 'Em andamento' && (
                                  <>
                                    <button
                                      onClick={() => handleCopyAdmissionLink(adm)}
                                      title="Copiar link de preenchimento"
                                      className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-[#ff8b00] transition-colors"
                                    >
                                      <LinkIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleShareWhatsapp(adm)}
                                      title="Enviar link via WhatsApp"
                                      className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-[#25D366] transition-colors"
                                    >
                                      <Share2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleOpenAdmissionView(adm)}
                                  title="Ver detalhes"
                                  className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* TABELA DE TEMPLATES */
              <div className="overflow-x-auto min-h-[220px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50/50">
                      <th className="py-3 px-6">NOME TEMPLATE</th>
                      <th className="py-3 px-6">DATA CRIAÇÃO</th>
                      <th className="py-3 px-4 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan="3" className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ff8b00]" />
                          Carregando templates...
                        </td>
                      </tr>
                    ) : filteredTemplates.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="py-12 text-center text-slate-500 font-medium">
                          Nenhum template encontrado
                        </td>
                      </tr>
                    ) : (
                      filteredTemplates.map((tmpl) => (
                        <tr key={tmpl.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-6 font-bold text-slate-800">{tmpl.title}</td>
                          <td className="py-3.5 px-6 text-slate-600">{formatDate(tmpl.created_at)}</td>
                          <td className="py-3.5 px-4 text-center">
                            <button className="p-1 hover:bg-slate-100 rounded text-slate-500">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* RODAPÉ */}
            <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span>
                {activeTab === 'templates'
                  ? `${filteredTemplates.length} Resultado`
                  : `${filteredAdmissions.length} Resultado`}
              </span>
              <div className="flex items-center gap-2">
                <span>Itens por página</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="border border-slate-200 rounded p-1 text-xs focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* MODO 1.5: SELEÇÃO DE COLABORADORES PARA INICIAR ADMISSÃO (tabela Employees do Supabase) */}
        {viewState === 'select_employees' && (
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <button
                onClick={() => setViewState('list')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>

              <button
                onClick={handleStartAdmissionFlow}
                disabled={selectedEmployees.length === 0}
                className={`text-xs font-semibold px-6 py-2 rounded transition-colors ${
                  selectedEmployees.length > 0
                    ? 'bg-[#ff8b00] hover:bg-[#00897b] text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Avançar {selectedEmployees.length > 0 ? `(${selectedEmployees.length})` : ''}
              </button>
            </div>

            <div className="p-4 bg-white border-b border-slate-100">
              <div className="relative max-w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Digite o nome do funcionário, cargo ou departamento"
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-[#ff8b00]"
                />
              </div>
            </div>

            <div className="overflow-x-auto min-h-[220px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-6"></th>
                    <th className="py-3 px-6">NOME</th>
                    <th className="py-3 px-4">CARGO</th>
                    <th className="py-3 px-4">DEPARTAMENTO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#ff8b00]" />
                        Carregando colaboradores...
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-500 font-medium">
                        Nenhum colaborador encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const name = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Usuário Sem Nome';
                      const isSelected = selectedEmployees.includes(emp.id);

                      return (
                        <tr
                          key={emp.id}
                          onClick={() => handleToggleEmployeeSelection(emp.id)}
                          className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-[#ff8b00]/5' : ''
                          }`}
                        >
                          <td className="py-3 px-6">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleEmployeeSelection(emp.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#ff8b00] focus:ring-[#ff8b00] cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs">
                                {getInitials(name, emp.first_name, emp.last_name)}
                              </div>
                              <span className="font-bold text-slate-800">{name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{emp.position || '-'}</td>
                          <td className="py-3 px-4 text-slate-600">{emp.department || '-'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span>{filteredEmployees.length} Resultado</span>
              <div className="flex items-center gap-2">
                <span>Itens por página</span>
                <select className="border border-slate-200 rounded p-1 text-xs focus:outline-none">
                  <option value={10}>10</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* MODO 2: CRIAR NOVO TEMPLATE */}
        {viewState === 'create_template' && (
          <div className="space-y-4">
            <div className="bg-white rounded-md border border-slate-200 p-4">
              <button
                onClick={() => setViewState('list')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>

              <div className="max-w-md">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome*
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Digite o nome do template"
                  className="w-full p-2 border border-slate-200 rounded text-xs focus:outline-none focus:border-[#ff8b00]"
                />
              </div>
            </div>

            {/* CARD DAS ETAPAS PADRÃO */}
            <div className="bg-white rounded-md border border-slate-200 p-6 space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Informações de cadastro (Padrão)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Esses dados irão alterar a informação do perfil do colaborador, após ele preencher
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {templateSteps.map((step) => (
                  <div key={step.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{step.id}. {step.name}</span>
                      <span className="text-slate-500 ml-2">- {step.type}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={step.active}
                        onChange={() => handleToggleStep(step.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ff8b00]"></div>
                      <span className="ml-2 text-xs font-medium text-slate-600">Etapa ativa</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD CAMPOS ADICIONAIS */}
            <div className="bg-white rounded-md border border-slate-200 p-6 space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Campos Adicionais</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Campos adicionais alteram dados no perfil do usuário
                </p>
              </div>

              {customSteps.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 space-y-1">
                  <p>Nenhum campo customizado encontrado.</p>
                  <p className="text-slate-400">Clique em "Criar nova etapa" para adicionar campos.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {customSteps.map((cStep) => (
                    <div key={cStep.id} className="py-3 flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">{cStep.name}</span>
                      <span className="text-emerald-600 font-medium">Ativo</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handleAddCustomStep}
                className="border border-[#ff8b00] text-[#ff8b00] hover:bg-[#ff8b00]/10 text-xs font-semibold px-4 py-2 rounded transition-colors"
              >
                Criar nova etapa
              </button>

              <button
                onClick={handleSaveTemplate}
                disabled={loading}
                className="bg-[#ff8b00] hover:bg-[#00897b] text-white text-xs font-semibold px-6 py-2 rounded transition-colors shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Salvar Template'}
              </button>
            </div>
          </div>
        )}

        {/* MODO 3: SELECCIONAR TEMPLATE PARA COLABORADOR */}
        {viewState === 'select_template' && (
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <button
                onClick={() => setViewState('select_employees')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>

              <button
                onClick={handleConfirmTemplateSelection}
                disabled={!selectedTemplateId || loading}
                className={`text-xs font-semibold px-6 py-2 rounded transition-colors ${
                  selectedTemplateId && !loading
                    ? 'bg-[#ff8b00] hover:bg-[#00897b] text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Usar template'}
              </button>
            </div>

            <div className="p-4 bg-white border-b border-slate-100">
              <div className="relative max-w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar template..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-[#ff8b00]"
                />
              </div>
            </div>

            <div className="overflow-x-auto min-h-[220px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-6">NOME DO TEMPLATE</th>
                    <th className="py-3 px-6">DATA DE CRIAÇÃO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTemplates.map((tmpl) => (
                    <tr
                      key={tmpl.id}
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        selectedTemplateId === tmpl.id ? 'bg-teal-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="template_select"
                            checked={selectedTemplateId === tmpl.id}
                            onChange={() => setSelectedTemplateId(tmpl.id)}
                            className="text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                          <div>
                            <strong className="block text-slate-800 font-bold">{tmpl.title}</strong>
                            <span className="text-slate-400 text-[11px]">9 campos</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">{formatDate(tmpl.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span>{filteredTemplates.length} Resultado</span>
              <div className="flex items-center gap-2">
                <span>Itens por página</span>
                <select className="border border-slate-200 rounded p-1 text-xs focus:outline-none">
                  <option value={10}>10</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* MODO 4: VISUALIZAÇÃO DO STATUS DA ADMISSÃO */}
        {viewState === 'view_admission' && activeAdmission && (
          <div className="space-y-4">
            <div className="bg-white rounded-md border border-slate-200 p-4 flex justify-between items-center">
              <button
                onClick={() => setViewState('list')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {activeAdmission.Employees?.full_name || 'Joquebede de Oliveira'} - Template "{activeAdmission.template_name || 'Admissão Matheus'}"
              </button>

              <button
                onClick={() => setViewState('create_template')}
                className="bg-[#ff8b00] hover:bg-[#00897b] text-white text-xs font-semibold px-4 py-2 rounded transition-colors"
              >
                Editar Template
              </button>
            </div>

            {/* BARRA DE PROGRESSO */}
            <div className="bg-white rounded-md border border-slate-200 p-4 space-y-2">
              <span className="text-xs font-medium text-slate-600">
                Progresso atual 56% (5 de 9 campos preenchidos)
              </span>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#ff8b00] h-full w-[56%] transition-all"></div>
              </div>
            </div>

            {/* LISTA DE CAMPOS PREENCHIDOS E PENDENTES */}
            <div className="bg-white rounded-md border border-slate-200 p-6 space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Informações de Cadastro</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Esses dados irão alterar a informação do perfil do colaborador, após ele preencher
                </p>
              </div>

              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {[
                  { name: 'Selfie', status: 'Não enviado', sent: false },
                  { name: 'Estado civil', status: 'Enviado 06/08/2026 22:58', sent: true },
                  { name: 'Telefone', status: 'Enviado 06/08/2026 23:00', sent: true },
                  { name: 'E-mail', status: 'Enviado 06/08/2026 22:58', sent: true },
                  { name: 'Número do RG', status: 'Não enviado', sent: false, hasDetails: true },
                  { name: 'Número do PIS', status: 'Não enviado', sent: false },
                  { name: 'Endereço', status: 'Enviado 06/08/2026 23:00', sent: true },
                  { name: 'Dados bancários', status: 'Não enviado', sent: false },
                  { name: 'Data de nascimento', status: 'Enviado 06/08/2026 22:58', sent: true },
                ].map((item, idx) => (
                  <div key={idx} className="py-3">
                    <div
                      onClick={() => setExpandedField(expandedField === idx ? null : idx)}
                      className="flex justify-between items-center text-xs cursor-pointer hover:bg-slate-50/50 p-1 rounded"
                    >
                      <div className="flex items-center gap-2">
                        {expandedField === idx ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span className="font-bold text-slate-800">{item.name}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-[11px]">{item.status}</span>
                        {item.sent ? (
                          <CheckCircle2 className="w-4 h-4 text-[#ff8b00]" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-300" />
                        )}
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    {/* Sanfona Expandida de Exemplo */}
                    {expandedField === idx && (
                      <div className="mt-3 ml-6 p-4 bg-slate-50 border border-slate-100 rounded space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-600">
                          Qual o {item.name.toLowerCase()}?
                        </label>
                        <input
                          type="text"
                          disabled
                          value="(Não enviado)"
                          className="w-full p-2 bg-white border border-slate-200 rounded text-xs text-slate-400"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* TOAST DE FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-medium px-4 py-2.5 rounded-md shadow-lg z-50 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#ff8b00]" />
          {toastMessage}
        </div>
      )}

      {/* RODAPÉ GLOBAL */}
      <footer className="text-center py-4 text-[11px] text-slate-400">
        © 2026 Wiaponto - Todos os direitos reservados.
      </footer>
    </div>
  );
}
