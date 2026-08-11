import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, LogIn } from 'lucide-react';
import bgLoginImg from './bgloginponto.png';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Lógica do Supabase
    console.log({ email, password });
  };

  return (
    <div className="h-screen w-screen flex bg-white font-sans overflow-hidden">
      
      {/* LADO ESQUERDO - Formulário (50% da tela) */}
      <div className="w-1/2 h-full flex flex-col justify-center items-center px-8 sm:px-12 md:px-16 lg:px-24">
        <div className="max-w-md w-full space-y-8">
          
          {/* Logo WiaPonto */}
          <div>
            <span className="text-4xl font-black text-[#00c062] tracking-tight">
              Wia<span className="text-[#00c062]">Ponto</span>
            </span>
          </div>

          {/* Título */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Entrar na sua conta
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Campo E-mail */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00c062] focus:border-transparent transition-all text-slate-700 bg-white"
              />
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-400">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00c062] focus:border-transparent transition-all text-slate-700 pr-12 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
              className="w-full py-4 px-6 rounded-full bg-[#00c062] hover:bg-[#00a855] text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
            >
              <LogIn size={20} className="rotate-180" />
              Entrar
            </button>
          </form>

          {/* Rodapé do Form */}
          <div className="text-center space-y-4 pt-4">
            <p className="text-sm text-slate-400 font-medium">
              Ainda não possui conta?{' '}
              <a href="/cadastrar" className="text-[#00c062] font-bold hover:underline">
                Crie uma agora.
              </a>
            </p>

            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Para saber como tratamos os dados pessoais visite nosso{' '}
              <a href="/privacidade" className="underline hover:text-slate-600">
                Aviso de privacidade
              </a>
            </p>
          </div>

        </div>
      </div>

      {/* LADO DIREITO - Banner com a Imagem bgloginponto.png (50% da tela) */}
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

        {/* Texto em destaque */}
        <div className="relative z-10 max-w-lg space-y-4 mb-6">
          <span className="inline-block px-3 py-1 rounded-full bg-[#00c062] text-slate-900 font-bold text-xs uppercase tracking-wider">
            NOVIDADE
          </span>

          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Recrutamento e Vagas
          </h2>

          <p className="text-slate-200 text-sm md:text-base leading-relaxed">
            Crie vagas e formulários; compartilhe, publique e centralize candidaturas no sistema de ponto.
          </p>

          <div className="pt-2">
            <a
              href="/testar"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-slate-900 font-bold hover:bg-slate-100 transition-all shadow-lg"
            >
              <ArrowRight size={18} />
              Testar
            </a>
          </div>
        </div>

        {/* Traço verde inferior */}
        <div className="relative z-10">
          <div className="w-8 h-1.5 bg-[#00c062] rounded-full"></div>
        </div>

      </div>

    </div>
  );
}
