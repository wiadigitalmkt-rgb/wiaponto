import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { 
  Search, 
  ChevronDown, 
  ChevronUp,
  MessageSquare, 
  ChevronRight,
  UserCheck,
  KeyRound,
  X,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Employees() {
  // Controle de Tela: 'list' (Tabela de Usuários) | 'create' (Formulário de Cadastro)
  const [currentView, setCurrentView] = useState('list');

  // Filtros da Tabela
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Ativos');
  const [itemsPerPage, setItemsPerPage] = useState('10');

  // Estado Modal de Credenciais
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [isOptionalExpanded, setIsOptionalExpanded] = useState(true);

  // Lista de Usuários Inicial
  const [usersData, setUsersData] = useState([
    {
      id: 1,
      initials: 'JD',
      name: 'Joquebede de Oliveira',
      cargo: 'Atendente',
      departamento: '-',
      tipoAcesso: 'Colaborador',
    },
    {
      id: 2,
      initials: 'WD',
      name: 'WIA DIGITAL',
      cargo: '(Preencher)',
      departamento: '-',
      tipoAcesso: 'Dono da Conta',
    },
  ]);

  // Form State para Novo Colaborador
  const [formData, setFormData] = useState({
    primeiroNome: '',
    sobrenome: '',
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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Processo ao Clicar em "Continuar" no Formulário
  const handleOpenModal = (e) => {
    e.preventDefault();
    setShowAccessModal(true);
  };

  // Confirmação de Criação do Usuário no Modal
  const handleConfirmCreate = () => {
    const fullName = `${formData.primeiroNome} ${formData.sobrenome}`.trim() || 'Novo Colaborador';
    
    // Gerar iniciais do nome
    const nameParts = fullName.split(' ');
    const initials = nameParts.length > 1 
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : fullName.substring(0, 2).toUpperCase();

    const newUser = {
      id: Date.now(),
      initials: initials,
      name: fullName,
      cargo: formData.cargo || '(Preencher)',
      departamento: formData.departamento || '-',
      tipoAcesso: formData.tipoAcesso || 'Colaborador',
    };

    // Adiciona o novo usuário na lista
    setUsersData([newUser, ...usersData]);

    // Reseta o Formulário e Modais
    setShowAccessModal(false);
    setCurrentView('list');
    setFormData({
      primeiroNome: '',
      sobrenome: '',
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
  };

  // Limpa apenas o CPF para gerar o login/senha amigável no modal
  const cleanCpf = formData.cpf.replace(/\D/g, '') || '60062246070';

  // Filtro de Busca
  const filteredUsers = usersData.filter((user) => {
    const term = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(term) ||
      user.tipoAcesso.toLowerCase().includes(term) ||
      user.cargo.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-[#edf2f7] flex flex-col font-sans text-slate-700 relative">
      {/* Navbar Padrão */}
      <Navbar selectedCompany="Sua Empresa" />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        
        {/* ==================== VISTA 1: LISTA DE USUÁRIOS ==================== */}
        {currentView === 'list' && (
          <>
            {/* Breadcrumb */}
            <div className="text-xs text-slate-500 mb-4">
              <a href="/admin" className="hover:text-[#00897b] hover:underline transition-colors font-medium">
                Painel
              </a> 
              <ChevronRight className="w-3 h-3 inline mx-1 text-slate-400" />{' '}
              <span className="text-[#00897b] font-medium">Usuários</span>
            </div>

            {/* Header da Página */}
            <div className="flex justify-between items-center mb-5">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Usuários
              </h1>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="bg-[#00897b] hover:bg-[#00796b] text-white font-medium px-4 py-2 rounded-md text-xs flex items-center space-x-1.5 shadow-sm transition-colors focus:outline-none cursor-pointer">
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

            {/* Card Tabela */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Digite o nome do usuário ou tipo de acesso (ex: Júlia, administrador)"
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-[#00897b] transition-colors placeholder:text-slate-400"
                  />
                </div>

                <div className="w-full sm:w-auto flex justify-end">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-slate-200 rounded px-3 py-1.5 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:border-[#00897b] cursor-pointer min-w-[110px]"
                  >
                    <option value="Ativos">Ativos</option>
                    <option value="Inativos">Inativos</option>
                    <option value="Todos">Todos</option>
                  </select>
                </div>
              </div>

              {/* Tabela */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50/50">
                      <th className="py-3 px-6">NOME</th>
                      <th className="py-3 px-6">CARGO</th>
                      <th className="py-3 px-6">DEPARTAMENTO</th>
                      <th className="py-3 px-6">TIPO DE ACESSO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-slate-600 text-xs shrink-0">
                                {user.initials}
                              </div>
                              <span className="font-semibold text-slate-800">
                                {user.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-slate-600">{user.cargo}</td>
                          <td className="py-3.5 px-6 text-slate-600">{user.departamento}</td>
                          <td className="py-3.5 px-6 text-slate-600">{user.tipoAcesso}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                          Nenhum usuário encontrado com os termos pesquisados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Rodapé Tabela */}
              <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 bg-white">
                <div>
                  <span>{filteredUsers.length} Resultados</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span>Itens por página</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(e.target.value)}
                    className="border border-slate-200 rounded px-2 py-1 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:border-[#00897b] cursor-pointer"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ==================== VISTA 2: FORMULÁRIO DE CADASTRO ==================== */}
        {currentView === 'create' && (
          <>
            {/* Breadcrumb */}
            <div className="text-xs text-slate-500 mb-4">
              <a href="/admin" className="hover:text-[#00897b] hover:underline transition-colors font-medium">
                Painel
              </a> 
              <ChevronRight className="w-3 h-3 inline mx-1 text-slate-400" />
              <button onClick={() => setCurrentView('list')} className="hover:text-[#00897b] hover:underline transition-colors font-medium">
                Usuários
              </button>
              <ChevronRight className="w-3 h-3 inline mx-1 text-slate-400" />
              <span className="text-[#00897b] font-medium">Cadastro - Empresa Teste 11738</span>
            </div>

            <form onSubmit={handleOpenModal} className="bg-white rounded-lg shadow-sm border border-slate-200/80 overflow-hidden">
              {/* SEÇÃO 1: CAMPOS OBRIGATÓRIOS */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-6 h-6 rounded-full bg-[#00897b]/10 text-[#00897b] font-bold text-xs flex items-center justify-center">
                    1
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">Campos obrigatórios</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Primeiro nome*</label>
                    <input 
                      type="text"
                      required
                      placeholder="João"
                      value={formData.primeiroNome}
                      onChange={(e) => handleInputChange('primeiroNome', e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#00897b]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sobrenome*</label>
                    <input 
                      type="text"
                      required
                      placeholder="Silva"
                      value={formData.sobrenome}
                      onChange={(e) => handleInputChange('sobrenome', e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#00897b]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">CPF*</label>
                    <input 
                      type="text"
                      required
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#00897b]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Data de admissão*</label>
                    <div className="relative">
                      <input 
                        type="text"
                        required
                        placeholder="dd/mm/aaaa"
                        value={formData.dataAdmissao}
                        onChange={(e) => handleInputChange('dataAdmissao', e.target.value)}
                        className="w-full border border-slate-200 rounded pl-8 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#00897b]"
                      />
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de acesso *</label>
                    <select
                      value={formData.tipoAcesso}
                      onChange={(e) => handleInputChange('tipoAcesso', e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#00897b] cursor-pointer"
                    >
                      <option value="Colaborador">Colaborador</option>
                      <option value="Administrador">Administrador</option>
                      <option value="Gestor">Gestor</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: CAMPOS OPCIONAIS */}
              <div className="p-6">
                <div 
                  onClick={() => setIsOptionalExpanded(!isOptionalExpanded)}
                  className="flex items-center justify-between cursor-pointer select-none mb-4"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-[#00897b]/10 text-[#00897b] font-bold text-xs flex items-center justify-center">
                      2
                    </div>
                    <h2 className="text-sm font-bold text-slate-800">Campos opcionais</h2>
                  </div>
                  {isOptionalExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                {isOptionalExpanded && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Departamento</label>
                        <select 
                          value={formData.departamento}
                          onChange={(e) => handleInputChange('departamento', e.target.value)}
                          className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#00897b] cursor-pointer"
                        >
                          <option value="">Selecione o departamento</option>
                          <option value="Atendimento">Atendimento</option>
                          <option value="Financeiro">Financeiro</option>
                          <option value="TI">TI</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo</label>
                        <input 
                          type="text"
                          placeholder="Ex: Analista de Sistemas"
                          value={formData.cargo}
                          onChange={(e) => handleInputChange('cargo', e.target.value)}
                          className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#00897b]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Salário bruto</label>
                        <input 
                          type="text"
                          placeholder="R$ 0,00"
                          value={formData.salario}
                          onChange={(e) => handleInputChange('salario', e.target.value)}
                          className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#00897b]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de contrato</label>
                        <select 
                          value={formData.tipoContrato}
                          onChange={(e) => handleInputChange('tipoContrato', e.target.value)}
                          className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#00897b] cursor-pointer"
                        >
                          <option value="">Selecione</option>
                          <option value="CLT">CLT</option>
                          <option value="PJ">PJ</option>
                          <option value="Estágio">Estágio</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Início da jornada</label>
                        <div className="relative">
                          <input 
                            type="text"
                            placeholder="dd/mm/aaaa"
                            value={formData.inicioJornada}
                            onChange={(e) => handleInputChange('inicioJornada', e.target.value)}
                            className="w-full border border-slate-200 rounded pl-8 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#00897b]"
                          />
                          <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Jornada</label>
                        <select 
                          value={formData.jornada}
                          onChange={(e) => handleInputChange('jornada', e.target.value)}
                          className="w-full border border-slate-200 rounded px-3 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#00897b] cursor-pointer"
                        >
                          <option value="">Selecione</option>
                          <option value="Padrão">SEG A SEX 8H AS 12H DAS 14H AS 18H SAB 08H AS 12H</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* BOTÃO SUBMIT */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="bg-[#00897b] hover:bg-[#00796b] text-white font-semibold px-6 py-2 rounded text-xs transition-colors shadow-sm cursor-pointer"
                >
                  Continuar
                </button>
              </div>
            </form>
          </>
        )}
      </main>

      {/* ==================== MODAL ACESSO AO SISTEMA ==================== */}
      {showAccessModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Acesso ao sistema</h3>
              <button 
                onClick={() => setShowAccessModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo Modal */}
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3 text-xs text-slate-700">
                <UserCheck className="w-5 h-5 text-[#00897b] shrink-0" />
                <div>
                  <span className="font-bold">Login: </span>
                  <span className="font-mono text-slate-800 font-semibold">{cleanCpf}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs text-slate-700">
                <KeyRound className="w-5 h-5 text-[#00897b] shrink-0" />
                <div>
                  <span className="font-bold">Senha: </span>
                  <span className="font-mono text-slate-800 font-semibold">{cleanCpf}</span>
                </div>
              </div>
            </div>

            {/* Rodapé Modal */}
            <div className="p-4 border-t border-slate-100 flex justify-end space-x-2 bg-slate-50/50">
              <button
                onClick={() => setShowAccessModal(false)}
                className="border border-red-500 text-red-500 hover:bg-red-50 font-medium px-4 py-1.5 rounded text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmCreate}
                className="bg-[#00897b] hover:bg-[#00796b] text-white font-medium px-5 py-1.5 rounded text-xs transition-colors cursor-pointer shadow-sm"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botão de Suporte Flutuante (Verde Teal) */}
      <div className="fixed bottom-6 right-6">
        <button 
          className="w-10 h-10 bg-[#00897b] text-white rounded-md flex items-center justify-center shadow-lg hover:bg-[#00796b] transition-colors"
          title="Central de Ajuda"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Rodapé */}
      <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-200 bg-white mt-auto">
        © 2026 Coalize - Todos os direitos reservados.
      </footer>
    </div>
  );
}
