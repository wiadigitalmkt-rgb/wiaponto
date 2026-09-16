import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import bgLoginImg from './bgloginponto.png';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotHint, setShowForgotHint] = useState(false);

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
        setLoading(false);
        return;
      }

      const { data: emp } = await supabase
        .from('Employees')
        .select('status, role')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle();

      if (emp && String(emp.status || '').toLowerCase() === 'inativo') {
        await supabase.auth.signOut();
        setErrorMsg('Este usuário está inativo. Fale com o gestor da sua empresa.');
        setLoading(false);
        return;
      }

      // "Continuar logado" — aviso importante: por padrão, o Supabase Auth
      // já mantém a sessão salva entre reaberturas do navegador,
      // independente desse checkbox (diferente do comportamento antigo,
      // onde "desmarcado" usava sessionStorage e expirava ao fechar a aba).
      // Se quiser esse controle fino de volta, me avisa — dá pra fazer com
      // um adaptador de storage customizado no cliente do Supabase.

      await refreshSession();
      navigate(emp?.role === 'gestor' || emp?.role === 'admin' ? '/admin' : '/ponto');
    } catch (err) {
      console.error('Erro na autenticação:', err);
      setErrorMsg('Falha na conexão com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex bg-white overflow-hidden font-['Inter',-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]">
      <div className="w-1/2 h-full flex flex-col justify-center items-center px-8 sm:px-12 md:px-16 lg:px-24">
        <div className="max-w-md w-full space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight">
              Bem-vindo!
            </h1>
            <p className="text-sm font-normal text-slate-500">
              Informe seus dados abaixo para entrar
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800">
                Usuário*
              </label>
              <input
                type="text"
                name="username"
                id="username"
                autoComplete="off"
                required
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="E-mail ou CPF"
                className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#fc9314] focus:border-transparent transition-all text-xs text-slate-700 bg-white placeholder:text-slate-400 font-normal"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800">
                Senha*
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#fc9314] focus:border-transparent transition-all text-xs text-slate-700 pr-10 bg-white placeholder:text-slate-400 font-normal"
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

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-normal">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#fc9314] focus:ring-[#fc9314]"
                />
                Continuar logado
              </label>

              <button
                type="button"
                onClick={() => setShowForgotHint((v) => !v)}
                className="font-normal text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                Esqueci a minha senha
              </button>
            </div>

            {showForgotHint && (
              <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md p-2.5 -mt-1">
                Fale com o gestor da sua empresa para redefinir sua senha.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-6 rounded-md bg-[#ff8c00] hover:bg-[#ffa12e] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] mt-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>

      <div className="w-1/2 h-full relative overflow-hidden bg-black flex flex-col justify-between p-12 lg:p-16">
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
