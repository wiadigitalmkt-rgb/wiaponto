import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import bgLoginImg from './bgloginponto.png';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [userInput, setUserInput] = useState(''); // Alterado para aceitar CPF ou E-mail sem validação forçada do navegador
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // Trata o texto digitado limpando pontuações caso seja digitado CPF com máscara
      const rawInput = userInput.trim();
      const cleanCPF = rawInput.replace(/\D/g, '');

      // Busca na tabela pelo CPF limpo OU pelo e-mail exatamente igual ao digitado
      let query = supabase.from('Employees').select('*');

      if (cleanCPF.length > 0) {
        query = query.or(`cpf.eq.${cleanCPF},email.eq.${rawInput}`);
      } else {
        query = query.eq('email', rawInput);
      }

      const { data: employees, error } = await query;

      if (error) {
        throw error;
      }

      if (!employees || employees.length === 0) {
        setErrorMsg('Usuário ou senha incorretos.');
        setLoading(false);
        return;
      }

      const user = employees[0];

      // Validação da Senha
      if (user.password_hash !== password) {
        setErrorMsg('Usuário ou senha incorretos.');
        setLoading(false);
        return;
      }

      // Salva a sessão localmente
      const sessionData = {
        id: user.id,
        full_name: user.full_name,
        cpf: user.cpf,
        role: user.role || 'colaborador',
      };

      if (rememberMe) {
        localStorage.setItem('userSession', JSON.stringify(sessionData));
      } else {
        sessionStorage.setItem('userSession', JSON.stringify(sessionData));
      }

      // Redirecionamento por Papel (Role)
      if (user.role === 'gestor') {
        navigate('/admin/ponto');
      } else {
        navigate('/ponto');
      }
    } catch (err) {
      console.error('Erro na autenticação:', err);
      setErrorMsg('Falha na conexão com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log('Login com Google');
  };

  return (
    <div className="h-screen w-screen flex bg-white overflow-hidden font-['Inter',-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]">
      
      {/* LADO ESQUERDO - Formulário com a Fonte do Print da Direita */}
      <div className="w-1/2 h-full flex flex-col justify-center items-center px-8 sm:px-12 md:px-16 lg:px-24">
        <div className="max-w-md w-full space-y-6">
          
          {/* Cabeçalho do Form */}
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight">
              Bem-vindo!
            </h1>
            <p className="text-sm font-normal text-slate-500">
              Informe seus dados abaixo para entrar
            </p>
          </div>

          {/* Alerta visual de erro */}
          {errorMsg && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            
            {/* Campo Usuário / CPF / E-mail */}
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
                placeholder="Login"
                className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00a887] focus:border-transparent transition-all text-xs text-slate-700 bg-white placeholder:text-slate-400 font-normal"
              />
            </div>

            {/* Campo Senha */}
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
                  className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00a887] focus:border-transparent transition-all text-xs text-slate-700 pr-10 bg-white placeholder:text-slate-400 font-normal"
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

            {/* Continuar logado e Esqueci minha senha */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-normal">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#00a887] focus:ring-[#00a887]"
                />
                Continuar logado
              </label>

              <a
                href="/recuperar-senha"
                className="font-normal text-slate-700 hover:text-slate-900"
              >
                Esqueci a minha senha
              </a>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-6 rounded-md bg-[#00a887] hover:bg-[#008f73] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] mt-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Divisor "OU" */}
          <div className="relative flex items-center justify-center py-2">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-normal text-slate-400 uppercase tracking-widest absolute">
              ou
            </span>
          </div>

          {/* Botão Google */}
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

      {/* LADO DIREITO - Mantido 100% intacto */}
      <div className="w-1/2 h-full relative overflow-hidden bg-black flex flex-col justify-between p-12 lg:p-16">
        
        {/* Imagem de Fundo de Alta Resolução */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${bgLoginImg})` 
          }}
        />

        {/* Overlay Escuro para dar contraste ao texto */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Botão superior direito */}
        <div className="relative z-10 flex justify-end">
          <button className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all">
            <LogIn size={20} />
          </button>
        </div>

        {/* Bloco inferior com o Texto e Barrinha Verde */}
        <div className="relative z-10 space-y-6 mt-auto">
          {/* Conteúdo em Destaque (Posicionado Embaixo) */}
          <div className="max-w-lg space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-[#00c062] text-slate-900 font-black text-xs uppercase tracking-wider">
              NOVIDADE
            </span>

            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Recrutamento e Vagas
            </h2>

            <p className="text-slate-100 font-medium text-sm md:text-base leading-relaxed">
              Crie vagas e formulários; compartilhe, publique e centralize candidaturas no sistema de ponto.
            </p>

            <div className="pt-2">
              <a
                href="/testar"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-slate-900 font-extrabold hover:bg-slate-100 transition-all shadow-lg"
              >
                <ArrowRight size={18} />
                Testar
              </a>
            </div>
          </div>

          {/* Traço verde inferior */}
          <div>
            <div className="w-8 h-1.5 bg-[#00c062] rounded-full"></div>
          </div>
        </div>

      </div>

    </div>
  );
}
