import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { 
  Search, 
  ChevronDown, 
  MessageSquare, 
  ChevronRight 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Ativos');
  const [itemsPerPage, setItemsPerPage] = useState('10');

  // Dados dos usuários conforme a imagem de exemplo
  const usersData = [
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
  ];

  // Filtro de busca por nome ou tipo de acesso
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
        {/* Breadcrumb */}
        <div className="text-xs text-slate-500 mb-4">
          <a 
            href="/admin" 
            className="hover:text-[#00897b] hover:underline transition-colors font-medium"
          >
            Painel
          </a> 
          <ChevronRight className="w-3 h-3 inline mx-1 text-slate-400" />{' '}
          <span className="text-[#00897b] font-medium">Usuários</span>
        </div>

        {/* Header da Página: Título e Botão Adicionar */}
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Usuários
          </h1>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="bg-[#00897b] hover:bg-[#00796b] text-white font-medium px-4 py-2 rounded-md text-xs flex items-center space-x-1.5 shadow-sm transition-colors focus:outline-none">
              <span>Adicionar</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 shadow-lg rounded-md p-1">
              <DropdownMenuItem className="text-xs text-slate-700 cursor-pointer py-2 hover:bg-slate-100">
                Novo Colaborador
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs text-slate-700 cursor-pointer py-2 hover:bg-slate-100">
                Importar Usuários
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Card Principal de Conteúdo */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 overflow-hidden">
          {/* Barra de Filtros Interna */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Campo de Busca */}
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

            {/* Select Status */}
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

          {/* Tabela de Usuários */}
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

          {/* Paginador / Rodapé da Tabela */}
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
      </main>

      {/* Botão de Suporte Flutuante estilo Coalize (Verde Teal) */}
      <div className="fixed bottom-6 right-6">
        <button 
          className="w-10 h-10 bg-[#00897b] text-white rounded-md flex items-center justify-center shadow-lg hover:bg-[#00796b] transition-colors"
          title="Central de Ajuda"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Rodapé do Sistema */}
      <footer className="text-center py-4 text-xs text-slate-400 border-t border-slate-200 bg-white mt-auto">
        © 2026 Coalize - Todos os direitos reservados.
      </footer>
    </div>
  );
}
