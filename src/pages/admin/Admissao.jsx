import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Search, ArrowLeft, Plus, CheckCircle2, FileText, UserCheck, Loader2 } from 'lucide-react';

export default function Admissao() {
  const navigate = useNavigate();

  // Estados de Navegação e Fluxo
  const [viewState, setViewState] = useState('list'); // 'list' | 'start'
  const [activeTab, setActiveTab] = useState('andamento'); // 'andamento' | 'concluidos' | 'templates'
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estados de Dados
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  // Carregar Dados do Supabase
  useEffect(() => {
    fetchData();
  }, [viewState, activeTab]);

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      if (viewState === 'start') {
        // Busca todos os colaboradores cadastrados para selecionar na admissão
        const { data: empData, error: empError } = await supabase
          .from('Employees')
          .select('*')
          .order('full_name', { ascending: true });

        if (!empError && empData) {
          setEmployees(empData);
        }
      } else {
        // Busca a lista de admissões iniciadas
        const { data: admData, error: admError } = await supabase
          .from('employee_admissions')
          .select(`
            id,
            status,
            template_name,
            created_at,
            employee_id,
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

        if (!admError && admData) {
          setAdmissions(admData);
        }

        // Busca templates de admissão
        const { data: tmplData } = await supabase
          .from('admission_templates')
          .select('*');
        if (tmplData) setTemplates(tmplData);
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  // Seleção individual/múltipla na tela de Iniciar Admissão
  const handleSelectEmployee = (id) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEmployees(filteredEmployees.map((emp) => emp.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  // Iniciar Processo de Admissão para os selecionados
  const handleConfirmStartAdmission = async () => {
    if (!selectedEmployees.length || !supabase) return;
    setLoading(true);

    try {
      const inserts = selectedEmployees.map((empId) => ({
        employee_id: empId,
        status: 'Em andamento',
        template_name: 'Admissão Simplificada CLT'
      }));

      const { error } = await supabase.from('employee_admissions').insert(inserts);

      if (!error) {
        setSelectedEmployees([]);
        setViewState('list');
        setActiveTab('andamento');
      } else {
        alert('Erro ao iniciar admissão.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helpers de Iniciais para Avatar
  const getInitials = (fullName, firstName, lastName) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (fullName) {
      const parts = fullName.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      return parts[0].substring(0, 2).toUpperCase();
    }
    return 'WD';
  };

  // Filtros
  const filteredAdmissions = admissions.filter((adm) => {
    const emp = adm.Employees;
    const empName = emp?.full_name || `${emp?.first_name || ''} ${emp?.last_name || ''}`;
    const matchesSearch =
      empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp?.position || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp?.department || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'andamento') {
      return matchesSearch && adm.status === 'Em andamento';
    }
    if (activeTab === 'concluidos') {
      return matchesSearch && adm.status === 'Concluído';
    }
    return matchesSearch;
  });

  const filteredEmployees = employees.filter((emp) => {
    const name = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`;
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.position || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-[#f0f4f7] flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Empresa Teste 11738" />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-4">
        {/* BREADCRUMB */}
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <Link to="/admin" className="hover:text-teal-600 transition-colors">Painel</Link>
          <span>&gt;</span>
          <span className="text-slate-600 font-medium">
            {viewState === 'start' ? (
              <>
                <Link to="/admin/admissao" onClick={() => setViewState('list')} className="hover:text-teal-600">
                  Admissão
                </Link>
                <span> &gt; </span>
                <span className="text-teal-600">Iniciar admissão</span>
              </>
            ) : (
              'Admissão'
            )}
          </span>
        </div>

        {/* TÍTULO PRINCIPAL */}
        <h1 className="text-lg font-bold text-slate-800">
          {viewState === 'start' ? 'Iniciar Admissão' : 'Admissão'}
        </h1>

        {/* CARTÃO DE CONTEÚDO PRINCIPAL */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          {/* HEADER DO CARD */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
            <button
              onClick={() => {
                if (viewState === 'start') setViewState('list');
                else navigate('/admin');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            {viewState === 'list' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setViewState('start');
                }}
                className="bg-[#009688] hover:bg-[#00897b] text-white text-xs font-semibold px-4 py-2 rounded transition-colors shadow-sm"
              >
                Iniciar admissão
              </button>
            ) : (
              <button
                onClick={handleConfirmStartAdmission}
                disabled={selectedEmployees.length === 0 || loading}
                className={`text-xs font-semibold px-6 py-2 rounded transition-colors ${
                  selectedEmployees.length > 0 && !loading
                    ? 'bg-[#009688] hover:bg-[#00897b] text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Continuar'}
              </button>
            )}
          </div>

          {/* VISTA 1: LISTAGEM DE ADMISSÕES */}
          {viewState === 'list' && (
            <div>
              {/* ABAS */}
              <div className="flex border-b border-slate-200 px-4 pt-2 gap-8 text-xs font-medium bg-white">
                <button
                  onClick={() => setActiveTab('andamento')}
                  className={`pb-3 transition-colors ${
                    activeTab === 'andamento'
                      ? 'border-b-2 border-teal-500 text-teal-600 font-semibold'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Em andamento
                </button>
                <button
                  onClick={() => setActiveTab('concluidos')}
                  className={`pb-3 transition-colors ${
                    activeTab === 'concluidos'
                      ? 'border-b-2 border-teal-500 text-teal-600 font-semibold'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Concluídos
                </button>
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`pb-3 transition-colors ${
                    activeTab === 'templates'
                      ? 'border-b-2 border-teal-500 text-teal-600 font-semibold'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Templates
                </button>
              </div>

              {/* CONTEÚDO DAS ABAS "Em andamento" e "Concluídos" */}
              {activeTab !== 'templates' ? (
                <div>
                  {/* BARRA DE PESQUISA */}
                  <div className="p-4 bg-white border-b border-slate-100">
                    <div className="relative max-w-full">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Digite o nome do funcionário, cargo ou departamento"
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {/* TABELA */}
                  <div className="overflow-x-auto min-h-[220px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50/50">
                          <th className="py-3 px-6">NOME</th>
                          <th className="py-3 px-4">STATUS ADMISSÃO</th>
                          <th className="py-3 px-4">TEMPLATE</th>
                          <th className="py-3 px-4">CARGO</th>
                          <th className="py-3 px-4">DEPARTAMENTO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loading ? (
                          <tr>
                            <td colSpan="5" className="py-12 text-center text-slate-400">
                              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                              Carregando admissões...
                            </td>
                          </tr>
                        ) : filteredAdmissions.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-12 text-center text-slate-500 font-medium">
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
                                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    adm.status === 'Concluído' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {adm.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-600">{adm.template_name || 'Padrão'}</td>
                                <td className="py-3 px-4 text-slate-600">{emp.position || '-'}</td>
                                <td className="py-3 px-4 text-slate-600">{emp.department || '-'}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* RODAPÉ DE PAGINAÇÃO */}
                  <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                    <span>{filteredAdmissions.length} Resultado</span>
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
              ) : (
                /* SUB-ABA TEMPLATES */
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-slate-800 text-sm">Templates de Admissão</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((tmpl) => (
                      <div key={tmpl.id} className="p-4 border border-slate-200 rounded bg-slate-50/50 flex items-start gap-3">
                        <FileText className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-slate-800 text-xs">{tmpl.title}</strong>
                          <p className="text-slate-500 text-[11px] mt-1">{tmpl.description || 'Sem descrição.'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VISTA 2: INICIAR ADMISSÃO (SELEÇÃO DE COLABORADORES DA BASE) */}
          {viewState === 'start' && (
            <div>
              {/* BARRA DE PESQUISA */}
              <div className="p-4 bg-white border-b border-slate-100">
                <div className="relative max-w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Busque por nome, e-mail, CPF ou cargo"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* TABELA DE USUÁRIOS/COLABORADORES */}
              <div className="overflow-x-auto min-h-[220px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50/50">
                      <th className="py-3 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={
                            filteredEmployees.length > 0 &&
                            selectedEmployees.length === filteredEmployees.length
                          }
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                      </th>
                      <th className="py-3 px-4">USUÁRIO</th>
                      <th className="py-3 px-4">CARGO</th>
                      <th className="py-3 px-4">DEPARTAMENTO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                          Carregando colaboradores da base...
                        </td>
                      </tr>
                    ) : filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-12 text-center text-slate-500 font-medium">
                          Nenhum usuário cadastrado para admissão
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const isSelected = selectedEmployees.includes(emp.id);
                        const name = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Sem nome';
                        const initials = getInitials(name, emp.first_name, emp.last_name);

                        return (
                          <tr
                            key={emp.id}
                            className={`hover:bg-slate-50 transition-colors ${
                              isSelected ? 'bg-teal-50/30' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectAll}
                                onClick={() => handleSelectEmployee(emp.id)}
                                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs">
                                  {initials}
                                </div>
                                <span className="font-bold text-slate-800">{name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {emp.position || <span className="text-slate-400">(Preencher)</span>}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{emp.department || '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* RODAPÉ DE PAGINAÇÃO */}
              <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span>{filteredEmployees.length} Resultados</span>
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
        </div>
      </main>
    </div>
  );
}
