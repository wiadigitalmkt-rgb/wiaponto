
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Search, Users, Settings, Loader2 } from 'lucide-react';

export default function Banco() {
  const [activeMenu, setActiveMenu] = useState('usuarios'); // 'usuarios' | 'configuracoes'
  const [selectedDepartment, setSelectedDepartment] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('Employees')
        .select('*')
        .order('full_name', { ascending: true });

      if (!error && data) {
        setEmployees(data);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do Banco de Horas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper para iniciais no avatar
  const getInitials = (fullName, firstName, lastName) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (fullName) {
      const parts = fullName.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      return parts[0].substring(0, 2).toUpperCase();
    }
    return 'WD';
  };

  // Filtros aplicados
  const filteredEmployees = employees.filter((emp) => {
    const name = emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`;
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.cpf || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.position || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      selectedDepartment === 'Todos' || emp.department === selectedDepartment;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="min-h-screen bg-[#f0f4f7] flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Empresa Teste 11738" />

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex gap-6">
        {/* MENU LATERAL DA PÁGINA */}
        <aside className="w-56 shrink-0 space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            BANCO DE HORAS
          </h2>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveMenu('usuarios')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
                activeMenu === 'usuarios'
                  ? 'bg-white text-teal-600 shadow-sm border border-slate-200/60 font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <Users className="w-4 h-4 text-teal-600" />
              <span>Usuários</span>
            </button>

            <button
              onClick={() => setActiveMenu('configuracoes')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
                activeMenu === 'configuracoes'
                  ? 'bg-white text-teal-600 shadow-sm border border-slate-200/60 font-semibold'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Configurações do ...</span>
            </button>
          </nav>
        </aside>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex-1 space-y-3">
          {/* BREADCRUMB E SELETOR DE DEPARTAMENTO */}
          <div className="flex justify-between items-center">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Link to="/admin" className="hover:text-teal-600 transition-colors">
                Painel
              </Link>
              <span>&gt;</span>
              <span className="text-teal-600 font-medium">Banco de horas</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-600 font-medium">Departamento</span>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-teal-500 shadow-sm"
              >
                <option value="Todos">Todos</option>
                <option value="Atendimento">Atendimento</option>
                <option value="TI">TI</option>
                <option value="RH">RH</option>
              </select>
            </div>
          </div>

          {/* CARD DA TABELA */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
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

            {/* TABELA DE USUÁRIOS E SALDOS */}
            <div className="overflow-x-auto min-h-[220px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50/30">
                    <th className="py-3 px-6">USUÁRIO</th>
                    <th className="py-3 px-6">CARGO</th>
                    <th className="py-3 px-6">SALDO</th>
                    <th className="py-3 px-6 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                        Carregando banco de horas...
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-500 font-medium">
                        Nenhum funcionário encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const name =
                        emp.full_name ||
                        `${emp.first_name || ''} ${emp.last_name || ''}`.trim() ||
                        'Usuário Sem Nome';
                      const initials = getInitials(name, emp.first_name, emp.last_name);

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs">
                                {initials}
                              </div>
                              <span className="font-bold text-slate-800">{name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-slate-600 font-medium">
                            {emp.position || '(Preencher)'}
                          </td>
                          <td className="py-3.5 px-6 font-semibold text-slate-700">
                            {emp.bank_balance || '00:00h'}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <button
                              onClick={() => alert(`Editar saldo de ${name}`)}
                              className="text-teal-600 hover:text-teal-700 font-semibold hover:underline"
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* RODAPÉ E PAGINAÇÃO */}
            <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span>
                {filteredEmployees.length}{' '}
                {filteredEmployees.length === 1 ? 'Resultado' : 'Resultados'}
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
        </main>
      </div>

      {/* RODAPÉ GLOBAL */}
      <footer className="text-center py-4 text-[11px] text-slate-400 border-t border-slate-200/50 mt-auto">
        © 2026 Wiaponto - Todos os direitos reservados.
      </footer>
    </div>
  );
}
