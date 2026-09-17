import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext({});

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/recuperar-senha', '/reset-password'];
// Rotas com ID dinâmico na URL (ex: /preencher-admissao/<uuid>) — checadas
// por prefixo, não por igualdade exata. O formulário de admissão roda sem
// login (protegido só pelo código de acesso de 6 dígitos), então precisa
// ficar de fora da exigência de sessão.
const PUBLIC_PATH_PREFIXES = ['/preencher-admissao/'];

function checkIsPublicRoute(pathname) {
  const lower = pathname.toLowerCase();
  if (PUBLIC_PATHS.includes(lower)) return true;
  return PUBLIC_PATH_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // A partir de uma sessão REAL do Supabase Auth (com token/JWT válido),
  // busca a linha correspondente na Employees (via auth_user_id, ligado na
  // Fase A/B) e monta o objeto "user" no mesmo formato que o resto do app
  // já espera — id, full_name, cpf, email, role — pra não precisar mudar
  // as outras telas.
  const loadEmployeeForSession = async (authSession) => {
    if (!authSession?.user || !supabase) {
      setUser(null);
      setSession(null);
      localStorage.removeItem('userSession');
      sessionStorage.removeItem('userSession');
      return;
    }

    const { data: emp } = await supabase
      .from('Employees')
      .select('id, full_name, cpf, email, role')
      .eq('auth_user_id', authSession.user.id)
      .maybeSingle();

    const sessionUser = {
      id: emp?.id || authSession.user.id,
      full_name: emp?.full_name || authSession.user.email,
      cpf: emp?.cpf || '',
      email: emp?.email || authSession.user.email || '',
      role: emp?.role || 'colaborador',
    };

    setUser(sessionUser);
    setSession(authSession);

    // Mantém o espelho em localStorage só por compatibilidade com qualquer
    // tela que ainda leia 'userSession' diretamente — a sessão de verdade
    // (o que garante acesso) passa a ser sempre a do Supabase Auth, que por
    // padrão já persiste entre sessões do navegador independente de
    // qualquer checkbox de "continuar logado" na tela de login.
    localStorage.setItem('userSession', JSON.stringify(sessionUser));
    sessionStorage.removeItem('userSession');
  };

  const refreshSession = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data: { session: authSession } } = await supabase.auth.getSession();
    await loadEmployeeForSession(authSession);
    setLoading(false);
  };

  useEffect(() => {
    refreshSession();

    if (!supabase) return;

    // Mantém tudo sincronizado automaticamente quando o token expira/renova,
    // ou quando o login/logout acontece em outra aba.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, authSession) => {
      loadEmployeeForSession(authSession);
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setSession(null);
    window.location.href = '/login';
  };

  const navigateToLogin = () => {
    if (!checkIsPublicRoute(window.location.pathname)) {
      window.location.href = '/login';
    }
  };

  const isPublicRoute = checkIsPublicRoute(window.location.pathname);
  const authError = (!user && !loading && !isPublicRoute) ? { type: 'auth_required' } : null;

  const value = {
    user,
    session,
    isLoadingAuth: loading,
    isLoadingPublicSettings: false,
    authError,
    signOut,
    navigateToLogin,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
