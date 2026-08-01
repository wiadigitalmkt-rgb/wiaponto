import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  Clock, CalendarDays, FileText, Receipt, Settings, LogOut, Home, Menu, X, ChevronRight, Briefcase, ShieldCheck
} from 'lucide-react';
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useUserAccess } from '@/hooks/useUserAccess';
import { hasPageAccess } from '@/lib/accessControl';

const NAV_ITEMS = [
  { path: '/', label: 'Início', icon: Home, key: 'inicio' },
  { path: '/ponto', label: 'Bate-Ponto', icon: Clock, key: 'ponto' },
  { path: '/espelho', label: 'Espelho de Ponto', icon: CalendarDays, key: 'espelho' },
  { path: '/solicitacoes', label: 'Solicitações', icon: FileText, key: 'solicitacoes' },
  { path: '/contracheque', label: 'Contra-Cheque', icon: Receipt, key: 'contracheque' },
  { path: '/prolabore', label: 'Pró-Labore', icon: Briefcase, key: 'prolabore' },
];

const ADMIN_ITEMS = [
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
  { path: '/admin', label: 'Controle de Acesso', icon: ShieldCheck },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { access } = useUserAccess();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  const visibleNavItems = NAV_ITEMS.filter(item => hasPageAccess(user, access, item.key));
  const allItems = isAdmin ? [...visibleNavItems, ...ADMIN_ITEMS] : visibleNavItems;

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#1a2c6a] text-white shadow-lg"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-[#1a2c6a] text-white z-40
        flex flex-col transition-transform duration-300
        lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#ff8b00] flex items-center justify-center">
              <Clock size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">PontoMax</h1>
              <p className="text-xs text-[#92e5f7] opacity-80">Portal do Colaborador</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#ff8b00]/20 border border-[#ff8b00]/40 flex items-center justify-center text-sm font-bold text-[#ff8b00]">
              {user?.full_name?.[0] || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name || 'Colaborador'}</p>
              <p className="text-xs text-white/50 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {allItems.map(item => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${active
                        ? 'bg-[#ff8b00] text-white shadow-lg shadow-[#ff8b00]/20'
                        : 'text-white/70 hover:text-white hover:bg-white/10'}
                    `}
                  >
                    <Icon size={18} />
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronRight size={14} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all w-full"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}