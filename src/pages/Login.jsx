import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import bgLoginImg from './bgloginponto.png';
import iconWiaPonto from './iconwiaponto.png';
import { useAuth } from '@/lib/AuthContext';
import { markForcePasswordChange } from '@/components/ForcePasswordChangeModal';

// Tela de "esqueci minha senha" (ver ForgotPassword.jsx / rota no App.jsx)
const FORGOT_PASSWORD_PATH = '/esqueci-minha-senha';
// Marca que o usuário saiu daqui rumo ao Google, pra finalizar o login na volta
const GOOGLE_FLAG = 'wiaponto_google_login';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleHandled = useRef(false);

  // Etapa final do login (por senha ou por Google): confere se o usuário
  // está ativo, marca a troca obrigatória de senha se ele ainda usa a senha
  // padrão (CPF) e manda pra tela certa.
  const finishLogin = async (authUser, { typedPassword = '', requireEmployee = false } = {}) => {
    const { data: emp } = await supabase
      .from('Employees')
      .select('status, role, cpf')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    // Google: só entra quem já foi cadastrado pelo gestor.
    if (requireEmployee && !emp) {
      await supabase.auth.signOut();
      setErrorMsg('Este e-mail do Google não está cadastrado no sistema. Fale com o gestor da sua empresa.');
      return false;
    }

    if (emp && String(emp.status || '').toLowerCase() === 'inativo') {
      await supabase.auth.signOut();
      setErrorMsg('Este usuário está inativo. Fale com o gestor da sua empresa.');
      return false;
    }

    // A senha inicial é o CPF (só dígitos). Quem entrou com ela precisa
    // trocar: o popup obrigatório aparece na primeira tela (ver
    // ForcePasswordChangeModal, que fica dentro do Navbar).
    const cpfDigits = String(emp?.cpf || '').replace(/\D/g, '');
    if (typedPassword && cpfDigits && typedPassword === cpfDigits) {
      markForcePasswordChange(authUser.id);
    }

    // "Continuar logado" — aviso importante: por padrão, o Supabase Auth
    // já mantém a sessão salva entre reaberturas do navegador,
    // independente desse checkbox (diferente do comportamento antigo,
    // onde "desmarcado" usava sessionStorage e expirava ao fechar a aba).
    // Se quiser esse controle fino de volta, me avisa — dá pra fazer com
    // um adaptador de storage customizado no cliente do Supabase.

    await refreshSession();
    navigate(emp?.role === 'gestor' || emp?.role === 'admin' ? '/admin' : '/ponto');
    return true;
  };

  // Login de verdade via Supabase Auth — substitui o /api/login.mjs (que
  // comparava password_hash na mão). Continua aceitando CPF no lugar do
  // e-mail: get_login_email() resolve isso no banco (função criada na
  // Fase A), sem expor nada além do e-mail correspondente.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const rawInput = userInput.trim();

      let loginEmail = rawInput;
      if (!rawInput.includes('@')) {
        const { data: resolvedEmail, error: resolveError } = await supabase.rpc('get_login_email', {
          p_input: rawInput,
        });
        if (resolveError) console.error('Erro ao resolver login por CPF:', resolveError);
        if (resolvedEmail) loginEmail = resolvedEmail;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (authError || !authData?.session) {
        setErrorMsg('Usuário ou senha incorretos.');
        return;
      }

      await finishLogin(authData.user, { typedPassword: password });
    } catch (err) {
      console.error('Erro na autenticação:', err);
      setErrorMsg('Falha na conexão com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Login com Google: manda o usuário pro Google e, na volta (mesma tela
  // /login), o useEffect abaixo termina o processo.
  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setGoogleLoading(true);
    try {
      try { sessionStorage.setItem(GOOGLE_FLAG, '1'); } catch (_) { /* sem storage: segue mesmo assim */ }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/login` },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao iniciar login com Google:', err);
      try { sessionStorage.removeItem(GOOGLE_FLAG); } catch (_) { /* ignora */ }
      setErrorMsg('Não foi possível entrar com o Google. Tente novamente.');
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (googleHandled.current) return;
    let comingBackFromGoogle = false;
    try { comingBackFromGoogle = sessionStorage.getItem(GOOGLE_FLAG) === '1'; } catch (_) { /* ignora */ }
    if (!comingBackFromGoogle) return;
    googleHandled.current = true;

    (async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setErrorMsg('Não foi possível concluir o login com o Google. Tente novamente.');
          return;
        }
        await finishLogin(session.user, { requireEmployee: true });
      } catch (err) {
        console.error('Erro ao concluir login com Google:', err);
        setErrorMsg('Falha ao entrar com o Google. Tente novamente.');
      } finally {
        try { sessionStorage.removeItem(GOOGLE_FLAG); } catch (_) { /* ignora */ }
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[100dvh] w-full flex bg-white lg:h-screen lg:overflow-hidden font-['Inter',-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]">
      <div className="relative w-full lg:w-1/2 min-h-[100dvh] lg:min-h-0 lg:h-full flex flex-col justify-center items-center px-6 py-10 sm:px-12 md:px-16 lg:px-24 lg:py-0">
        {/* Ícone: preso ao topo, só no celular/tablet (no PC a marca já aparece na imagem ao lado) */}
        <div className="lg:hidden absolute top-0 inset-x-0 px-6 pt-6 sm:px-12 md:px-16">
          <div className="max-w-md w-full mx-auto">
            <img src={iconWiaPonto} alt="WiaPonto" className="h-14 w-auto" />
          </div>
        </div>

        <div className="max-w-md w-full space-y-6">
          {/* Espaço que o ícone ocupava: mantém o formulário na mesma posição de antes */}
          <div className="lg:hidden h-14 mb-6" aria-hidden="true" />

          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight">
              Bem-vindo!
            </h1>
            <p className="text-base lg:text-sm font-normal text-slate-500">
              Informe seus dados abaixo para entrar
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm lg:text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label className="text-sm lg:text-xs font-semibold text-slate-800">
                Usuário*
              </label>
              <input
                type="text"
                name="username"
                id="username"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="E-mail ou CPF"
                className="w-full px-3.5 py-3 lg:py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#fc9314] focus:border-transparent transition-all text-base lg:text-xs text-slate-700 bg-white placeholder:text-slate-400 font-normal"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm lg:text-xs font-semibold text-slate-800">
                Senha*
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="w-full px-3.5 py-3 lg:py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#fc9314] focus:border-transparent transition-all text-base lg:text-xs text-slate-700 pr-10 bg-white placeholder:text-slate-400 font-normal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm lg:text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-normal whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#fc9314] focus:ring-[#fc9314]"
                />
                Continuar logado
              </label>

              <Link
                to={FORGOT_PASSWORD_PATH}
                className="font-normal text-slate-700 hover:text-slate-900 cursor-pointer whitespace-nowrap"
              >
                Esqueci a minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 lg:py-2.5 px-6 rounded-md bg-[#ff8c00] hover:bg-[#ffa12e] text-white font-semibold text-base lg:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] mt-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="flex items-center gap-3" aria-hidden="true">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">ou</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full py-3 lg:py-2.5 px-6 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base lg:text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
            Continuar com Google
          </button>
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 h-full relative overflow-hidden bg-black flex-col justify-between p-12 lg:p-16">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgLoginImg})` }}
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 space-y-6 mt-auto">
          <div className="max-w-lg space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Facilite a sua rotina!
            </h2>
            <p className="text-slate-100 font-medium text-sm md:text-base leading-relaxed">
              Registre sua jornada de trabalho de forma rápida, segura e sem complicações!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
