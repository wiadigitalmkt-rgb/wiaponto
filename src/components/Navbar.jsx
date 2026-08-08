import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, ChevronDown, LogOut, Search } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navbar({ selectedCompany = 'Empresa Teste 11738' }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Exemplo de lista de empresas para busca
  const companies = ['Empresa Teste 11738', 'Empresa Exemplo 2', 'Outra Empresa'];

  const filteredCompanies = companies.filter((company) =>
    company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSignOut = async () => {
    try {
      if (signOut) await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const getUserInitials = () => {
    if (!user || !user.email) return 'AD';
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-[#1a2c6a] text-white h-16 shadow-md w-full shrink-0 flex items-center justify-between px-6 border-b border-[#2a3c7e] select-none">
      {/* Lado Esquerdo */}
      <div className="flex items-center gap-8">
        <Link to="/admin" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-[#ff8b00] flex items-center justify-center text-white shrink-0 shadow-sm">
            <Clock size={20} className="stroke-[2.5]" />
          </div>
          <span className="text-white text-lg font-bold">PontoMax</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-200">
          <DropdownMenu>
            <DropdownMenuTrigger className="hover:text-white flex items-center gap-1 transition focus:outline-none">
              Atalhos <ChevronDown size={14} className="opacity-80" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white text-slate-800">
              <DropdownMenuItem onClick={() => navigate('/admin/ponto')}>
                Ponto Eletrônico
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/admin')}>
                Visão Geral
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="hover:text-white flex items-center gap-1 transition focus:outline-none">
              Relatórios <ChevronDown size={14} className="opacity-80" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white text-slate-800">
              <DropdownMenuItem>Espelho de Ponto</DropdownMenuItem>
              <DropdownMenuItem>Horas Extras</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="hover:text-white flex items-center gap-1 transition focus:outline-none">
              Configurações <ChevronDown size={14} className="opacity-80" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white text-slate-800">
              <DropdownMenuItem>Empresa</DropdownMenuItem>
              <DropdownMenuItem>Colaboradores</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link to="#" className="hover:text-white transition">
            Solicitações
          </Link>
        </nav>
      </div>

      {/* Lado Direito */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Botão de Empresa no estilo Coalize com Busca */}
        <DropdownMenu>
          <DropdownMenuTrigger className="hidden sm:flex items-center justify-between gap-6 border border-white/40 bg-transparent px-4 py-1.5 rounded-md text-xs font-semibold text-white hover:border-white/70 transition focus:outline-none cursor-pointer">
            <span className="truncate">{selectedCompany}</span>
            <ChevronDown size={13} className="text-white/80 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white p-0 text-slate-800 w-60 rounded-md overflow-hidden shadow-lg border-none">
            {/* Campo de Busca */}
            <div className="flex items-center px-3 py-2 border-b border-slate-200 bg-white">
              <Search size={16} className="text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Buscar empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs text-slate-700 bg-transparent outline-none placeholder:text-slate-400"
                onClick={(e) => e.stopPropagation()} 
              />
            </div>

            {/* Lista de Empresas */}
            <div className="max-h-48 overflow-y-auto">
              {filteredCompanies.map((company) => {
                const isSelected = company === selectedCompany;
                return (
                  <DropdownMenuItem
                    key={company}
                    className={`cursor-pointer text-xs font-bold px-3 py-2.5 rounded-none focus:outline-none transition ${
                      isSelected
                        ? 'bg-[#009688] text-white focus:bg-[#009688] focus:text-white'
                        : 'text-slate-700 hover:bg-slate-100 focus:bg-slate-100'
                    }`}
                  >
                    {company}
                  </DropdownMenuItem>
                );
              })}
              {filteredCompanies.length === 0 && (
                <div className="px-3 py-2 text-xs text-slate-400 text-center">
                  Nenhuma empresa encontrada
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <div className="w-9 h-9 rounded-full bg-[#ff8b00] flex items-center justify-center font-bold text-xs text-white border-2 border-white/20 shrink-0 shadow hover:opacity-90 transition">
              {getUserInitials()}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white text-slate-800 w-48">
            <div className="px-3 py-2 border-b border-slate-100 text-xs">
              <p className="font-semibold truncate">{user?.email || 'admin@ponto.com'}</p>
            </div>
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-600 focus:text-red-600 cursor-pointer flex items-center"
            >
              <LogOut size={16} className="mr-2" />
              Sair da conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
