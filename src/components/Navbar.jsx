import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  // Pega as iniciais do e-mail do usuário (ex: admin@teste.com -> AD)
  const getUserInitials = () => {
    if (!user || !user.email) return 'AD';
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="w-full bg-[#1b2b65] text-white h-16 px-6 flex items-center justify-between shadow-md select-none">
      {/* Esquerda: Logo PontoMax + Links Navegação */}
      <div className="flex items-center space-x-8">
        {/* Logo PontoMax */}
        <Link to="/admin" className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#ff8b00] flex items-center justify-center text-white shadow-sm">
            <Clock className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">
            PontoMax
          </span>
        </Link>

        {/* Menus do Topo */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-100">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center hover:text-orange-400 transition-colors focus:outline-none">
              Atalhos <ChevronDown className="w-4 h-4 ml-1 opacity-80" />
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
            <DropdownMenuTrigger className="flex items-center hover:text-orange-400 transition-colors focus:outline-none">
              Relatórios <ChevronDown className="w-4 h-4 ml-1 opacity-80" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white text-slate-800">
              <DropdownMenuItem>Espelho de Ponto</DropdownMenuItem>
              <DropdownMenuItem>Horas Extras</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center hover:text-orange-400 transition-colors focus:outline-none">
              Configurações <ChevronDown className="w-4 h-4 ml-1 opacity-80" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-white text-slate-800">
              <DropdownMenuItem>Empresa</DropdownMenuItem>
              <DropdownMenuItem>Colaboradores</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            to="#"
            className="hover:text-orange-400 transition-colors text-slate-100 font-medium"
          >
            Solicitações
          </Link>
        </nav>
      </div>

      {/* Direita: Botão de Empresa + Avatar de Usuário */}
      <div className="flex items-center space-x-4">
        {/* Seletor Empresa */}
        <div className="hidden sm:flex items-center border border-[#2c3d80] rounded-lg px-4 py-1.5 text-xs bg-[#13204d] text-slate-200">
          <span className="text-slate-300 mr-1.5 font-normal">Empresa:</span>
          <span className="font-semibold text-[#ff8b00]">Sua Empresa</span>
        </div>

        {/* Avatar Usuário com Dropdown para Sair */}
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <div className="w-9 h-9 rounded-full bg-[#ff8b00] text-white flex items-center justify-center font-bold text-xs tracking-wider shadow hover:opacity-90 transition-opacity">
              {getUserInitials()}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white text-slate-800 w-48">
            <div className="px-3 py-2 border-b border-slate-100 text-xs">
              <p className="font-semibold truncate">{user?.email}</p>
            </div>
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-600 focus:text-red-600 cursor-pointer flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
