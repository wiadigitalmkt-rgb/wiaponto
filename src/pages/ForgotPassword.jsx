import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import bgLoginImg from './bgloginponto.png';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const rawInput = userInput.trim();
      const cleanCPF = rawInput.replace(/\D/g, '');
      let targetEmail = '';

      // 1. Identifica se foi passado E-mail ou CPF e obtém o e-mail do colaborador
      if (rawInput.includes('@')) {
        targetEmail = rawInput;
      } else if (cleanCPF.length > 0) {
        const formattedCPF = cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        
        const { data: employees, error: searchError } = await supabase
          .from('Employees')
          .select('email')
          .or(`cpf.eq.${cleanCPF},cpf.eq.${formattedCPF}`)
          .maybeSingle();

        if (searchError) throw searchError;

        if (!employees || !employees.email) {
          setErrorMsg('CPF não encontrado ou sem e-mail cadastrado.');
          setLoading(false);
          return;
        }

        targetEmail = employees.email;
      } else {
        setErrorMsg('Informe um CPF ou e-mail válido.');
        setLoading(false);
        return;
      }

      // 2. Dispara o e-mail de redefinição de senha nativo do Supabase Auth
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setEmailSent(true);
    } catch (err) {
      console.error('Erro ao solicitar redefinição por e-mail:', err);
      setErrorMsg(err.message || 'Falha ao enviar e-mail de redefinição. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex bg-white overflow-hidden font-['Inter',-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]">
      <div className="w-1/2 h-full flex flex-col justify-center items-center px-8 sm:px-12 md:px-16 lg:px-24">
        <div className="max-w-md w-full space-y-6">
          <div className="space-y-1.5">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft size={14} /> Voltar ao login
            </button>
            <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight">
              Recuperar Senha
            </h1>
            <p className="text-sm font-normal text-slate-500">
              {emailSent
                ? 'Link de recuperação enviado com sucesso!'
                : 'Informe seu CPF ou E-mail para receber o link de redefinição'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {emailSent ? (
            <div className="space-y-6 text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 text-[#00a887]">
                <CheckCircle size={36} />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Enviamos um link para redefinição de senha. Por favor, verifique sua caixa de entrada e a pasta de spam.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 px-6 rounded-md bg-[#fc9314] hover:bg-[#ff8b00] text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
              >
                Ir para o Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  CPF ou E-mail*
                </label>
                <input
                  type="text"
                  required
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Digite seu CPF ou E-mail"
                  className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00a887] transition-all text-xs text-slate-700 bg-white placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-6 rounded-md bg-[#fc9314] hover:bg-[#ff8b00] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Enviando e-mail...' : 'Enviar Link de Recuperação'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}
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
