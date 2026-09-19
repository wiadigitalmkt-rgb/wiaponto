import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, Search, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import logoImg from '@/assets/LOGOWIANOVO.png';

export default function Navbar({ selectedCompany = 'PontoMax' }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Menu lateral (celular): fecha ao trocar de página, ao apertar Esc ou ao
  // voltar para tela grande, e trava a rolagem da página enquanto está aberto.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [mobileMenuOpen]);

  // Recupera a sessão armazenada no navegador
  const storedSession = JSON.parse(
    localStorage.getItem('userSession') || sessionStorage.getItem('userSession') || '{}'
  );
  
  // Normaliza os dados do usuário atual combinando Contexto e Storage
  const currentUser = storedSession?.user || storedSession || user || {};

  // Define o e-mail com prioridade
  const userEmail = 
    user?.email || 
    storedSession?.email || 
    storedSession?.user?.email || 
    '';

  // Ajustado para capturar 'full_name' do objeto direto ou do Supabase Metadata
  const userName = 
    currentUser?.full_name || 
    user?.full_name || 
    user?.user_metadata?.full_name || 
    currentUser?.name || 
    '';

  // Identificação do perfil do usuário
  const userRole = 
    user?.role || 
    user?.user_metadata?.role || 
    currentUser?.role || 
    currentUser?.access_type || 
    'employee';

  const isAdmin = userRole === 'admin' || userRole === 'Administrador' || userRole === 'gestor';

  const userCompanies = user?.companies || [user?.companyName || selectedCompany];

  // Itens do menu lateral no celular. Itens com path: null ainda não têm
  // destino (no PC também não fazem nada) e ficam ocultos até você definir o path.
  const mobileMenu = isAdmin
    ? [
        {
          title: null,
          items: [{ label: 'Início', path: '/admin' }],
        },
        {
          title: 'Atalhos',
          items: [
            { label: 'Ponto Eletrônico', path: '/admin/ponto' },
            { label: 'Usuários', path: '/admin/colaboradores' },
            { label: 'Admissão', path: '/admin/admissao' },
            { label: 'Contratos', path: '/admin/contratos' },
            { label: 'Avisos', path: '/avisos' },
            { label: 'Banco de Horas', path: '/espelho?section=banco' },
            { label: 'Central de ajuda', path: '/ajuda' },
          ],
        },
        {
          title: 'Relatórios',
          items: [
            { label: 'Espelho de Ponto', path: null },
            { label: 'Horas Extras', path: null },
          ],
        },
        {
          title: 'Configurações',
          items: [
            { label: 'Empresa', path: null },
            { label: 'Colaboradores', path: null },
            { label: 'Minha Assinatura', path: '/minha-assinatura' },
          ],
        },
      ]
    : [
        {
          title: null,
          items: [
            { label: 'Bater Ponto', path: '/ponto' },
            { label: 'Espelho de Ponto', path: '/espelho' },
            { label: 'Avisos', path: '/avisos' },
            { label: 'Ajuda', path: '/ajuda' },
          ],
        },
      ];

  const currentPath = location.pathname + location.search;
  const isActivePath = (path) =>
    currentPath === path || (!path.includes('?') && location.pathname === path);

  const filteredCompanies = userCompanies.filter((company) =>
    company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSignOut = async () => {
    try {
      if (signOut) await signOut();
      localStorage.removeItem('userSession');
      sessionStorage.removeItem('userSession');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  const getUserInitials = () => {
    if (userName && userName.trim() !== '') {
      const parts = userName.trim().split(' ');
      if (parts.length > 1) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return userName.substring(0, 2).toUpperCase();
    }
    if (userEmail && userEmail.includes('@')) {
      return userEmail.substring(0, 2).toUpperCase();
    }
    return 'WI';
  };

  return (
    <header className="sticky top-0 z-50 bg-[#1a2c6a] text-white h-12 shadow-md w-full shrink-0 flex items-center justify-between px-3 sm:px-4 md:px-6 border-b border-[#2a3c7e] select-none">
      <div className="flex items-center gap-1 md:gap-8">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden -ml-2 h-12 w-12 shrink-0 flex items-center justify-center rounded-md text-white hover:bg-white/10 active:bg-white/10 transition focus:outline-none touch-manipulation"
          aria-label="Abrir menu"
          aria-expanded={mobileMenuOpen}
        >
          <Menu size={24} />
        </button>

        <Link to={isAdmin ? "/admin" : "/ponto"} className="flex items-center gap-2">
          <img 
            src={logoImg} 
            alt="WiaPonto Logo" 
            className="h-10 max-h-full w-auto object-contain py-1" 
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-200">
          {isAdmin ? (
            <>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="hover:text-white flex items-center gap-1 transition focus:outline-none">
                  Atalhos <ChevronDown size={14} className="opacity-80" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-white text-slate-800">  
                  <DropdownMenuItem className="cursor-pointer hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white" onClick={() => navigate('/admin/ponto')}>
                    Ponto Eletrônico
                  </DropdownMenuItem> 
                  <DropdownMenuItem className="cursor-pointer hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white" onClick={() => navigate('/admin/colaboradores')}>
                    Usuários
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white" onClick={() => navigate('/admin/admissao')}>
                    Admissão
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white" onClick={() => navigate('/admin/contratos')}>
                    Contratos
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white" onClick={() => navigate('/avisos')}>
                    Avisos
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white" onClick={() => navigate('/espelho?section=banco')}>
                    Banco de Horas
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white" onClick={() => navigate('/ajuda')}>
                    Central de ajuda
                  </DropdownMenuItem>     
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="hover:text-white flex items-center gap-1 transition focus:outline-none">
                  Relatórios <ChevronDown size={14} className="opacity-80" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-[#ffffff] text-slate-800">
                  <DropdownMenuItem className="cursor-pointer hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white">Espelho de Ponto</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white">Horas Extras</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="hover:text-white flex items-center gap-1 transition focus:outline-none">
                  Configurações <ChevronDown size={14} className="opacity-80" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-white text-slate-800">
                  <DropdownMenuItem className="cursor-pointer hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white">Empresa</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white">Colaboradores</DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate('/minha-assinatura')}
                    className="cursor-pointer hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white"
                  >
                    Minha Assinatura
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="#" className="hover:text-white transition">
                Solicitações
              </Link>
            </>
          ) : (
            <>
              <Link to="/espelho" className="hover:text-white transition">
                Espelho de Ponto
              </Link>
              <Link to="/avisos" className="hover:text-white transition">
                Avisos
              </Link>
              
              <Link to="/ajuda" className="hover:text-white transition">
                Ajuda
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className="hidden sm:flex items-center justify-between gap-6 border border-white/40 bg-transparent px-4 py-1.5 rounded-md text-xs font-semibold text-white hover:border-white/70 transition focus:outline-none cursor-pointer">
            <span className="truncate">{selectedCompany}</span>
            <ChevronDown size={13} className="text-white/80 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white p-0 text-slate-800 w-60 rounded-md overflow-hidden shadow-lg border-none">
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

            <div className="max-h-48 overflow-y-auto">
              {filteredCompanies.map((company) => {
                const isSelected = company === selectedCompany;
                return (
                  <DropdownMenuItem
                    key={company}
                    className={`cursor-pointer text-xs font-bold px-3 py-2.5 rounded-none focus:outline-none transition ${
                      isSelected
                        ? 'bg-[#ff6a00] text-white focus:bg-[#ff7614] focus:text-white'
                        : 'text-slate-700 hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white'
                    }`}
                  >
                    {company}
                  </DropdownMenuItem>
                );
              })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className="focus:outline-none">
            <div className="w-9 h-9 rounded-full bg-[#ff8b00] flex items-center justify-center font-bold text-xs text-white border-2 border-white/20 shrink-0 shadow hover:opacity-90 transition">
              {getUserInitials()}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white text-slate-800 w-52">
            <div className="px-3 py-2 border-b border-slate-100 text-xs">
              {userName ? (
                <p className="font-bold text-slate-800 truncate">{userName}</p>
              ) : (
                <p className="font-bold text-slate-800 truncate">Usuário</p>
              )}
              <p className="text-slate-500 truncate">{userEmail || 'Usuário Sem E-mail'}</p>
            </div>
            
            <DropdownMenuItem
              onClick={() => navigate('/perfil')}
              className="cursor-pointer flex items-center hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white"
            >
              Perfil
            </DropdownMenuItem>

            {!isAdmin && (
              <DropdownMenuItem
                onClick={() => window.location.href = 'https://wiaponto.vercel.app/ponto'}
                className="cursor-pointer flex items-center hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white"
              >
                Bater Ponto
              </DropdownMenuItem>
            )}

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

      {/* MENU LATERAL — só no celular/tablet (abaixo de 768px) */}
      <div
        className={`md:hidden fixed inset-0 z-10 bg-black/50 transition-[opacity,visibility] duration-200 ${
          mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        className={`md:hidden fixed top-0 left-0 z-20 h-[100dvh] w-72 max-w-[85vw] bg-[#1a2c6a] text-white shadow-2xl flex flex-col transition-[transform,visibility] duration-200 ${
          mobileMenuOpen ? 'translate-x-0 visible' : '-translate-x-full invisible'
        }`}
      >
        <div className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-white/10">
          <img src={logoImg} alt="WiaPonto Logo" className="h-8 w-auto object-contain" />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="-mr-3 h-12 w-12 flex items-center justify-center rounded-md hover:bg-white/10 active:bg-white/10 transition focus:outline-none touch-manipulation"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Empresa</p>
          <p className="text-sm font-semibold truncate">{selectedCompany}</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {mobileMenu.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) => item.path);
            if (visibleItems.length === 0) return null;
            return (
              <div key={sIdx} className="py-1">
                {section.title && (
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-white/50">
                    {section.title}
                  </p>
                )}
                {visibleItems.map((item) => {
                  const active = isActivePath(item.path);
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-4 py-3 text-sm font-medium border-l-4 transition ${
                        active
                          ? 'border-[#ff8b00] bg-white/10 text-white'
                          : 'border-transparent text-slate-200 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 p-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              handleSignOut();
            }}
            className="w-full flex items-center gap-2 px-3 py-3 rounded-md text-sm font-medium text-red-300 hover:bg-white/10 transition focus:outline-none"
          >
            <LogOut size={16} />
            Sair da conta
          </button>
        </div>
      </aside>
    </header>
  );
}
