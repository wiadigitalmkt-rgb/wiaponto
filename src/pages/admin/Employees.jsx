import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  ChevronDown, 
  ChevronRight,
  X,
  Loader2,
  Mail,
  Lock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Employees() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [usersData, setUsersData] = useState([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos'); // Mantém 'Todos' por padrão
  const [itemsPerPage, setItemsPerPage] = useState('10');

  // Modais
  const [showAccessModal, setShowAccessModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    primeiroNome: '',
    sobrenome: '',
    email: '',
    senha: '',
    cpf: '',
    dataAdmissao: '',
    tipoAcesso: 'Colaborador',
    departamento: '',
    cargo: '',
    salario: '',
    tipoContrato: '',
    inicioJornada: '',
    jornada: '',
  });

  // 1. CARREGAR COLABORADORES DO SUPABASE
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapeia os dados do Banco garantindo 'Ativo' para quem não tem status definido
      const formatted = (data || []).map((emp) => {
        const nameParts = (emp.full_name || '').split(' ');
        const initials = nameParts.length > 1 
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : (emp.full_name || 'UC').substring(0, 2).toUpperCase();

        return {
          id: emp.id,
          initials,
          name: emp.full_name || 'Sem nome',
          email: emp.email || '-',
          cargo: emp.position || '(Preencher)',
          departamento: emp.department || '-',
          tipoAcesso: emp.role === 'gestor' || emp.role === 'admin' ? 'Gestor' : 'Colaborador',
          status: emp.status ? emp.status.trim() : 'Ativo',
        };
      });

      setUsersData(formatted);
    } catch (err) {
      console.error('Erro ao carregar colaboradores:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenModal = (e) => {
    e.preventDefault();
    setShowAccessModal(true);
  };

  // 2. INSERIR NOVO COLABORADOR NO SUPABASE E SUPABASE AUTH
  const handleConfirmCreate = async () => {
    const fullName = `${formData.primeiroNome} ${formData.sobrenome}`.trim();

    try {
      // Criação do usuário na tabela Employees
      const { data, error } = await supabase.from('Employees').insert([
        {
          full_name: fullName,
          first_name: formData.primeiroNome,
          last_name: formData.sobrenome,
          email: formData.email.toLowerCase().trim(),
          password_hash: formData.senha,
          cpf: formData.cpf,
          admission_date: formData.dataAdmissao || null,
          role: formData.tipoAcesso === 'Gestor' ? 'gestor' : 'colaborador',
          access_type: formData.tipoAcesso,
          department: formData.departamento || null,
          position: formData.cargo || null,
          salary: formData.salario || null,
          contract_type: formData.tipoContrato || null,
          work_schedule: formData.jornada || '08:00 - 18:00',
          status: 'Ativo'
        },
      ]).select();

      if (error) throw error;

      // Cria a conta de autenticação no Supabase Auth
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase().trim(),
        password: formData.senha,
        options: {
          data: {
            full_name: fullName,
            role: formData.tipoAcesso === 'Gestor' ? 'gestor' : 'colaborador',
          }
        }
      });

      if (authError && !authError.message.includes('already registered')) {
        console.warn('Aviso no Supabase Auth:', authError.message);
      }

      setShowAccessModal(false);
      setFormData({
        primeiroNome: '',
        sobrenome: '',
        email: '',
        senha: '',
        cpf: '',
        dataAdmissao: '',
        tipoAcesso: 'Colaborador',
        departamento: '',
        cargo: '',
        salario: '',
        tipoContrato: '',
        inicioJornada: '',
        jornada: '',
      });

      if (data && data[0]?.id) {
        navigate(`/admin/usuario?id=${data[0].id}`);
      } else {
        await fetchEmployees();
        setCurrentView('list');
      }
    } catch (err) {
      alert('Erro ao salvar colaborador: ' + err.message);
    }
  };

  const filteredUsers = usersData.filter((user) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.tipoAcesso.toLowerCase().includes(term) ||
      user.cargo.toLowerCase().includes(term);

    const userStatus = user.status.toLowerCase();
    const matchesStatus = 
      statusFilter === 'Todos' || 
      (statusFilter === 'Ativos' && (userStatus === 'ativo' || userStatus === '')) ||
      (statusFilter === 'Inativos' && userStatus === 'inativo');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#edf2f7] flex flex-col font-sans text-slate-700 relative">
      <Navbar selectedCompany="Sua Empresa" />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {currentView === 'list' && (
          <>
            <div className="text-xs text-slate-500 mb-4">
              <Link to="/admin" className="hover:text-[#ff8b00] hover:underline transition-colors font-medium">
                Painel
              </Link> 
              <ChevronRight className="w-3 h-3 inline mx-1 text-slate-400" />
              <span className="text-[#ff8b00] font-medium">Usuários</span>
            </div>

            <div className="flex justify-between items-center mb-5">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Usuários
              </h1>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="bg-[#ff8b00] hover:bg-[#e07a00] text-white font-medium px-4 py-2 rounded-md text-xs flex items-center space-x-1.5 shadow-sm transition-colors focus:outline-none cursor-pointer">
                  <span>Adicionar</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 shadow-lg rounded-md p-1 z-50">
                  <DropdownMenuItem 
                    onClick={() => setCurrentView('create')}
                    className="text-xs text-slate-700 cursor-pointer py-2 hover:bg-slate-100"
                  >
                    Novo Colaborador
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs text-slate-700 cursor-pointer py-2 hover:bg-slate-100">
                    Importar Usuários
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Digite o nome, e-mail do usuário ou tipo de acesso"
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-[#ff8b00] transition-colors"
                  />
                </div>

                <div className="w-full sm:w-auto flex justify-end">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-slate-200 rounded px-3 py-1.5 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:border-[#ff8b00] cursor-pointer min-w-[110px]"
                  >
                    <option value="Todos">Todos</option>
                    <option value="Ativos">Ativos</option>
                    <option value="Inativos">Inativos</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50/50">
                      <th className="py-3 px-6">NOME</th>
                      <th className="py-3 px-6">E-MAIL</th>
                      <th className="py-3 px-6">CARGO</th>
                      <th className="py-3 px-6">DEPARTAMENTO</th>
                      <th className="py-3 px-6">TIPO DE ACESSO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#ff8b00]" />
                          Carregando colaboradores do banco de dados...
                        </td>
                      </tr>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr 
                          key={user.id} 
                          onClick={() => navigate(`/admin/usuario?id=${user.id}`)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-slate-600 text-xs shrink-0">
                                {user.initials}
                              </div>
                              <span className="font-semibold text-slate-800 hover:text-[#ff8b00] transition-colors">
                                {user.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-slate-600">{user.email}</td>
                          <td className="py-3.5 px-6 text-slate-600">{user.cargo}</td>
                          <td className="py-3.5 px-6 text-slate-600">{user.departamento}</td>
                          <td className="py-3.5 px-6 text-slate-600">{user.tipoAcesso}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                          Nenhum usuário encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 bg-white">
                <div><span>{filteredUsers.length} Resultados</span></div>
                <div className="flex items-center space-x-2">
                  <span>Itens por página</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(e.target.value)}
                    className="border border-slate-200 rounded px-2 py-1 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:border-[#ff8b00]"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* CADASTRO */}
        {currentView === 'create' && (
          <>
            <div className="text-xs text-slate-500 mb-4">
              <Link to="/admin" className="hover:text-[#ff8b00] hover:underline transition-colors font-medium">Painel</Link> 
              <ChevronRight className="w-3 h-3 inline mx-1 text-slate-400" />
              <button onClick={() => setCurrentView('list')} className="hover:text-[#ff8b00] hover:underline transition-colors font-medium">Usuários</button>
              <ChevronRight className="w-3 h-3 inline mx-1 text-slate-400" />
              <span className="text-[#ff8b00] font-medium">Novo Cadastro</span>
            </div>

            <form onSubmit={handleOpenModal} className="bg-white rounded-lg shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-6 h-6 rounded-full bg-[#ff8b00]/10 text-[#ff8b00] font-bold text-xs flex items-center justify-center">1</div>
                  <h2 className="text-sm font-bold text-slate-800">Campos obrigatórios de Acesso</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Primeiro nome*</label>
                    <input 
                      type="text" required placeholder="João"
                      value={formData.primeiroNome}
                      onChange={(e) => handleInputChange('primeiroNome', e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sobrenome*</label>
                    <input 
                      type="text" required placeholder="Silva"
                      value={formData.sobrenome}
                      onChange={(e) => handleInputChange('sobrenome', e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">CPF*</label>
                    <input 
                      type="text" required placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail do Colaborador (Login)*</label>
                    <input 
                      type="email" required placeholder="colaborador@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Senha de Acesso Inicial*</label>
                    <input 
                      type="password" required placeholder="SuaSenhaInicial123"
                      value={formData.senha}
                      onChange={(e) => handleInputChange('senha', e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Data de admissão*</label>
                    <input 
                      type="date" required
                      value={formData.dataAdmissao}
                      onChange={(e) => handleInputChange('dataAdmissao', e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de acesso *</label>
                    <select
                      value={formData.tipoAcesso}
                      onChange={(e) => handleInputChange('tipoAcesso', e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#ff8b00]"
                    >
                      <option value="Colaborador">Colaborador</option>
                      <option value="Gestor">Gestor</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button type="submit" className="bg-[#ff8b00] hover:bg-[#e07a00] text-white font-semibold px-6 py-2 rounded text-xs transition-colors">
                  Continuar
                </button>
              </div>
            </form>
          </>
        )}
      </main>

      {/* MODAL CONFIRMAÇÃO DE DADOS */}
      {showAccessModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Confirmar e Salvar no Banco</h3>
              <button onClick={() => setShowAccessModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3 text-xs text-slate-700">
                <Mail className="w-5 h-5 text-[#ff8b00]" />
                <div><span className="font-bold">E-mail (Login): </span><span className="font-mono">{formData.email}</span></div>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-700">
                <Lock className="w-5 h-5 text-[#ff8b00]" />
                <div><span className="font-bold">Senha Inicial: </span><span className="font-mono">{formData.senha}</span></div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end space-x-2 bg-slate-50/50">
              <button onClick={() => setShowAccessModal(false)} className="border border-red-500 text-red-500 px-4 py-1.5 rounded text-xs">Cancelar</button>
              <button onClick={handleConfirmCreate} className="bg-[#ff8b00] hover:bg-[#e07a00] text-white px-5 py-1.5 rounded text-xs transition-colors">Salvar no Banco</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
