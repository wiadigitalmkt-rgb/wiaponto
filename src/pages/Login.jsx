import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, LogIn } from 'lucide-react';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Adicione sua lógica de login do Supabase aqui
    console.log({ email, password });
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      {/* LADO ESQUERDO - Formulário */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 md:p-16">
        <div className="max-w-md w-full mx-auto my-auto space-y-8">
          
          {/* Logo WiaPonto */}
          <div className="flex items-center gap-1">
            <span className="text-3xl font-extrabold text-[#00c062] tracking-tight">
              Wia<span className="text-[#00c062]">Ponto</span>
            </span>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Entrar na sua conta
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo E-mail */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-500">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                className="w-full px-4 py-3 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00c062] focus:border-transparent transition-all text-slate-700"
              />
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-500">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  className="w-full px-4 py-3 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00c062] focus:border-transparent transition-all text-slate-700 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Esqueceu a senha */}
            <div className="text-right">
              <a
                href="/recuperar-senha"
                className="text-sm font-semibold text-[#00c062] hover:underline"
              >
                Esqueci minha senha
              </a>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-full bg-[#00c062] hover:bg-[#00a855] text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <LogIn size={18} className="rotate-180" />
              Entrar
            </button>
          </form>

          {/* Links Inferiores */}
          <div className="text-center space-y-4 pt-2">
            <p className="text-sm text-slate-500 font-medium">
              Ainda não possui conta?{' '}
              <a href="/cadastrar" className="text-[#00c062] font-bold hover:underline">
                Crie uma agora.
              </a>
            </p>

            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Para saber como tratamos os dados pessoais visite nosso{' '}
              <a href="/privacidade" className="underline hover:text-slate-600">
                Aviso de privacidade
              </a>
            </p>
          </div>

        </div>
      </div>

      {/* LADO DIREITO - Banner Promocional com Imagem */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-900 overflow-hidden p-12 flex-col justify-between">
        {/* Background Image com Overlay Escuro */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000&auto=format&fit=crop')` 
          }}
        />

        {/* Ícone no Canto Superior Direito */}
        <div className="relative z-10 flex justify-end">
          <button className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
            <LogIn size={20} />
          </button>
        </div>

        {/* Conteúdo Promocional */}
        <div className="relative z-10 max-w-lg space-y-4 mb-8">
          <span className="inline-block px-3 py-1 rounded-full bg-[#00c062] text-slate-900 font-bold text-xs uppercase tracking-wider">
            NOVIDADE
          </span>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Recrutamento e Vagas
          </h2>

          <p className="text-slate-200 text-base leading-relaxed">
            Crie vagas e formulários; compartilhe, publique e centralize candidaturas no sistema de ponto.
          </p>

          <div className="pt-2">
            <a
              href="/testar"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-slate-900 font-bold hover:bg-slate-100 transition-colors"
            >
              <ArrowRight size={18} />
              Testar
            </a>
          </div>
        </div>

        {/* Indicador de Carrossel/Slide (Barrinha verde) */}
        <div className="relative z-10 flex gap-2">
          <div className="w-8 h-1.5 bg-[#00c062] rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
