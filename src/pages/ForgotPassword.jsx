import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, CheckCircle, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import bgLoginImg from './bgloginponto.png';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: Identificação, Step 2: Código e Nova Senha, Step 3: Sucesso
  const [userInput, setUserInput] = useState('');
  const [employee, setEmployee] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Passo 1: Busca usuário e gera o token de verificação
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const rawInput = userInput.trim();
      const cleanCPF = rawInput.replace(/\D/g, '');

      let query = supabase.from('Employees').select('*');

      if (cleanCPF.length > 0) {
        // Formata o CPF para o formato padronizado com pontos e hífen
        const formattedCPF = cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
        // Busca aceitando CPF limpo, CPF formatado ou e-mail
        query = query.or(`cpf.eq.${cleanCPF},cpf.eq.${formattedCPF},email.eq.${rawInput}`);
      } else {
        query = query.eq('email', rawInput);
      }

      const { data: employees, error } = await query;

      if (error) throw error;

      if (!employees || employees.length === 0) {
        setErrorMsg('Usuário não encontrado. Verifique os dados informados.');
        setLoading(false);
        return;
      }

      const user = employees[0];
      setEmployee(user);

      // Gera código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedToken(code);

      // Define expiração para 15 minutos a partir de agora
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      // Salva a solicitação na tabela password_resets
      const { error: resetError } = await supabase.from('password_resets').insert([
        {
          employee_id: user.id,
          token: code,
          expires_at: expiresAt,
          used: false,
        },
      ]);

      if (resetError) throw resetError;

      setStep(2);
    } catch (err) {
      console.error('Erro ao solicitar redefinição:', err);
      setErrorMsg('Falha ao processar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Passo 2: Valida o código e atualiza a senha no Supabase
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg('A nova senha deve ter pelo menos 4 caracteres.');
      setLoading(false);
      return;
    }

    try {
      // Verifica o token no banco
      const { data: resetRecords, error: resetQueryError } = await supabase
        .from('password_resets')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('token', tokenInput.trim())
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (resetQueryError) throw resetQueryError;

      if (!resetRecords || resetRecords.length === 0) {
        setErrorMsg('Código de verificação inválido ou expirado.');
        setLoading(false);
        return;
      }

      const resetRecord = resetRecords[0];

      // Atualiza a senha no cadastro do funcionário
      const { error: updateError } = await supabase
        .from('Employees')
        .update({ password_hash: newPassword })
        .eq('id', employee.id);

      if (updateError) throw updateError;

      // Marca o token como utilizado
      await supabase
        .from('password_resets')
        .update({ used: true })
        .eq('id', resetRecord.id);

      setStep(3);
    } catch (err) {
      console.error('Erro ao redefinir senha:', err);
      setErrorMsg('Falha ao redefinir a senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex bg-white overflow-hidden font-['Inter',-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]">
      
      {/* LADO ESQUERDO - Formulários */}
      <div className="w-1/2 h-full flex flex-col justify-center items-center px-8 sm:px-12 md:px-16 lg:px-24">
        <div className="max-w-md w-full space-y-6">
          
          {/* Cabeçalho */}
          <div className="space-y-1.5">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
            >
              <ArrowLeft size={14} /> Voltar ao login
            </button>
            <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight">
              Recuperar Senha
            </h1>
            <p className="text-sm font-normal text-slate-500">
              {step === 1 && 'Informe seu CPF ou E-mail para alterar sua senha'}
              {step === 2 && 'Insira o código de verificação e digite sua nova senha'}
              {step === 3 && 'Sua senha foi redefinida com sucesso!'}
            </p>
          </div>

          {/* Mensagem de Erro */}
          {errorMsg && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* ETAPA 1: Digitar Usuário / CPF / Email */}
          {step === 1 && (
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
                  className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00a887] focus:border-transparent transition-all text-xs text-slate-700 bg-white placeholder:text-slate-400 font-normal"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-6 rounded-md bg-[#00a887] hover:bg-[#008f73] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] mt-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Buscando...' : 'Avançar'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}

          {/* ETAPA 2: Digitar Token e Nova Senha */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Box com o Token de Simulação */}
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-md text-xs text-teal-800">
                <p className="font-semibold flex items-center gap-1.5">
                  <KeyRound size={14} /> Seu código de verificação:
                </p>
                <p className="text-lg font-bold tracking-widest mt-1 text-[#00a887]">
                  {generatedToken}
                </p>
                <p className="text-[11px] text-teal-600 mt-1">
                  (Insira este código no campo abaixo para prosseguir)
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  Código de Verificação*
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="000000"
                  className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00a887] focus:border-transparent transition-all text-xs text-slate-700 bg-white placeholder:text-slate-400 font-normal tracking-widest"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  Nova Senha*
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha"
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800">
                  Confirmar Nova Senha*
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                  className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00a887] focus:border-transparent transition-all text-xs text-slate-700 bg-white placeholder:text-slate-400 font-normal"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-6 rounded-md bg-[#00a887] hover:bg-[#008f73] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] mt-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Atualizando...' : 'Redefinir Senha'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
          )}

          {/* ETAPA 3: Sucesso */}
          {step === 3 && (
            <div className="space-y-6 text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 text-[#00a887]">
                <CheckCircle size={36} />
              </div>

              <p className="text-sm text-slate-600">
                Sua senha foi alterada com sucesso! Você já pode acessar a plataforma utilizando suas novas credenciais.
              </p>

              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 px-6 rounded-md bg-[#00a887] hover:bg-[#008f73] text-white font-semibold text-sm transition-all shadow-sm"
              >
                Ir para a tela de Login
              </button>
            </div>
          )}

        </div>
      </div>

      {/* LADO DIREITO - Imagem de Fundo (Mesmo layout do Login) */}
      <div className="w-1/2 h-full relative overflow-hidden bg-black flex flex-col justify-between p-12 lg:p-16">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${bgLoginImg})` 
          }}
        />

        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 space-y-6 mt-auto">
          <div className="max-w-lg space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Facilite a sua rotina!
            </h2>

            <p className="text-slate-100 font-medium text-sm md:text-base leading-relaxed">
              Registre sua jornada de trabalho de forma rápida, segura e sem complicações!.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
