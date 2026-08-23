import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const rawInput = userInput.trim();
      const cleanCPF = rawInput.replace(/\D/g, '');
      let loginEmail = rawInput;

      // Se o usuário digitou CPF em vez de E-mail, busca o e-mail cadastrado na tabela Employees
      if (!rawInput.includes('@') && cleanCPF.length > 0) {
        const { data: empData } = await supabase
          .from('Employees')
          .select('email, password_hash, role, id, full_name, cpf')
          .or(`cpf.eq.${cleanCPF},cpf.eq.${rawInput}`)
          .maybeSingle();

        if (empData?.email) {
          loginEmail = empData.email;
        } else if (empData) {
          // Fallback se o colaborador não tiver e-mail cadastrado no Supabase Auth
          if (empData.password_hash === password) {
            const sessionData = {
              id: empData.id,
              full_name: empData.full_name,
              cpf: empData.cpf,
              email: empData.email || '',
              role: empData.role || 'colaborador',
            };
            if (rememberMe) localStorage.setItem('userSession', JSON.stringify(sessionData));
            else sessionStorage.setItem('userSession', JSON.stringify(sessionData));

            refreshSession();
            navigate(empData.role === 'gestor' || empData.role === 'admin' ? '/admin' : '/ponto');
            return;
          } else {
            setErrorMsg('Usuário ou senha incorretos.');
            setLoading(false);
            return;
          }
        }
      }

      // 1. Tenta autenticação nativa via Supabase Auth com o e-mail identificado
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (!authError && authData?.user) {
        // Atualiza a coluna password_hash da tabela Employees para manter sincronizado
        await supabase
          .from('Employees')
          .update({ password_hash: password })
          .eq('email', loginEmail);

        // Busca os dados de perfil
        const { data: emp } = await supabase
          .from('Employees')
          .select('*')
          .eq('email', loginEmail)
          .maybeSingle();

        const sessionData = {
          id: emp?.id || authData.user.id,
          full_name: emp?.full_name || authData.user.email,
          cpf: emp?.cpf || '',
          email: emp?.email || authData.user.email || loginEmail,
          role: emp?.role || 'colaborador',
        };

        if (rememberMe) localStorage.setItem('userSession', JSON.stringify(sessionData));
        else sessionStorage.setItem('userSession', JSON.stringify(sessionData));

        refreshSession();
        navigate(sessionData.role === 'gestor' || sessionData.role === 'admin' ? '/admin' : '/ponto');
        return;
      }

      // 2. Validação Fallback caso o Supabase Auth falhe
      let query = supabase.from('Employees').select('*');
      if (cleanCPF.length > 0) {
        query = query.or(`cpf.eq.${cleanCPF},email.eq.${rawInput}`);
      } else {
        query = query.eq('email', rawInput);
      }

      const { data: employees } = await query;
      const user = employees?.[0];

      if (user && user.password_hash === password) {
        const sessionData = {
          id: user.id,
          full_name: user.full_name,
          cpf: user.cpf,
          email: user.email || '',
          role: user.role || 'colaborador',
        };

        if (rememberMe) localStorage.setItem('userSession', JSON.stringify(sessionData));
        else sessionStorage.setItem('userSession', JSON.stringify(sessionData));

        refreshSession();
        navigate(user.role === 'gestor' || user.role === 'admin' ? '/admin' : '/ponto');
      } else {
        setErrorMsg('Usuário ou senha incorretos.');
      }
    } catch (err) {
      console.error('Erro na autenticação:', err);
      setErrorMsg('Falha na conexão com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({ provider: 'google' });
    } catch (err) {
      console.error('Erro ao conectar com Google:', err);
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

              <a
                href="/forgot-password"
                className="font-normal text-slate-700 hover:text-slate-900"
              >
                Esqueci a minha senha
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-6 rounded-md bg-[#ff8c00] hover:bg-[#ffa12e] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] mt-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="relative flex items-center justify-center py-2">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-normal text-slate-400 uppercase tracking-widest absolute">
              ou
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-6 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2.5 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continuar com Google
          </button>
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
