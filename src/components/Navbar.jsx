import React from 'react';
import { 
  ChevronDown, 
  ExternalLink 
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <header className="w-full bg-[#1b2a3a] text-white h-14 px-6 flex items-center justify-between shadow-md">
      {/* Esquerda: Logo + Menus Nav */}
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-2 font-bold text-xl tracking-wide">
          <div className="w-7 h-7 rounded-full bg-[#00a884] flex items-center justify-center text-white text-xs font-black">
            C
          </div>
          <span>Coalize</span>
        </div>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-200">
          <button className="flex items-center hover:text-white transition-colors">
            Atalhos <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
          </button>
          <button className="hover:text-white transition-colors">Relatórios</button>
          <button className="flex items-center hover:text-white transition-colors">
            Configurações <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
          </button>
          <button className="hover:text-white transition-colors">Solicitações</button>
        </nav>
      </div>

      {/* Direita: Empresa + Perfil Usuário */}
      <div className="flex items-center space-x-4">
        <div className="hidden sm:flex items-center border border-slate-600 rounded-md px-3 py-1 text-xs text-slate-200 bg-slate-800/40 cursor-pointer">
          <span>Empresa Teste 11738</span>
          <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-70" />
        </div>

        <div className="flex items-center space-x-2 cursor-pointer group" onClick={signOut}>
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs border border-white/20">
            {user?.email?.substring(0, 2).toUpperCase() || 'WD'}
          </div>
          <span className="text-sm font-medium text-slate-200 group-hover:text-white">
            {user?.email?.split('@')[0] || 'WIA'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 opacity-70 text-slate-200" />
        </div>
      </div>
    </header>
  );
}
