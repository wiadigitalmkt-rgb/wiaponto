import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AuthSplitLayout from '@/components/AuthSplitLayout';

// Rota da tela de "nova senha" (ResetPassword.jsx). Essa mesma URL precisa
// estar cadastrada em Supabase → Authentication → URL Configuration →
// Redirect URLs, senão o link do e-mail não funciona.
const RESET_PASSWORD_PATH = '/redefinir-senha';
const RESEND_SECONDS = 60;

const inputClass =
  'w-full px-3.5 py-3 lg:py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#fc9314] focus:border-transparent transition-all text-base lg:text-xs text-slate-700 bg-white placeholder:text-slate-400 font-normal';
const primaryButtonClass =
  'w-full py-3 lg:py-2.5 px-6 rounded-md bg-[#ff8c00] hover:bg-[#ffa12e] text-white font-semibold text-base lg:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-50';
const outlineButtonClass =
  'w-full py-3 lg:py-2.5 px-6 rounded-md border border-[#ff8c00] text-[#ff8c00] hover:bg-[#ff8c00]/5 font-semibold text-base lg:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50';

export default function ForgotPassword() {
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Contagem regressiva do botão "Reenviar" (o Supabase só aceita um novo
  // pedido para o mesmo e-mail depois de cerca de 1 minuto).
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendEmail = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const rawInput = userInput.trim();

      // Aceita e-mail ou CPF (igual ao login). CPF é convertido para o
      // e-mail do cadastro pela mesma função usada no login.
      let email = rawInput;
      if (!rawInput.includes('@')) {
        const { data: resolvedEmail } = await supabase.rpc('get_login_email', { p_input: rawInput });
        email = resolvedEmail || '';
      }

      // Se não achou cadastro, mostra a mesma tela de "enviado" — assim
      // ninguém consegue descobrir quem tem conta no sistema.
      if (email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}${RESET_PASSWORD_PATH}`,
        });
        if (error) throw error;
      }

      setSent(true);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      console.error('Erro ao pedir redefinição de senha:', err);
      const msg = String(err?.message || '').toLowerCase();
      if (err?.status === 429 || msg.includes('rate limit') || msg.includes('seconds')) {
        setErrorMsg('Você já pediu um e-mail há pouco tempo. Aguarde cerca de 1 minuto e tente de novo.');
        setCooldown(RESEND_SECONDS);
      } else {
        setErrorMsg('Não foi possível enviar o e-mail agora. Tente novamente em instantes.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    sendEmail();
  };

  const errorBox = errorMsg && (
    <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm lg:text-xs font-medium">
      {errorMsg}
    </div>
  );

  // TELA 2 — e-mail enviado
  if (sent) {
    const typedEmail = userInput.trim();
    return (
      <AuthSplitLayout title="E-mail enviado!">
        <div className="space-y-5">
          <p className="text-base lg:text-sm text-slate-600 leading-relaxed">
            {typedEmail.includes('@') ? (
              <>
                Se o e-mail <strong className="text-slate-800 break-all">{typedEmail}</strong> estiver
                cadastrado, você vai receber em instantes as instruções para redefinir sua senha.
              </>
            ) : (
              <>
                Se o CPF informado estiver cadastrado, enviamos as instruções para redefinir sua senha
                para o e-mail da conta.
              </>
            )}{' '}
            Confira também a caixa de spam.
          </p>

          {errorBox}

          <div className="space-y-3">
            <Link to="/login" className={outlineButtonClass}>
              <ArrowLeft size={16} /> Voltar para o login
            </Link>
            <button
              type="button"
              onClick={sendEmail}
              disabled={loading || cooldown > 0}
              className="w-full text-sm lg:text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 disabled:no-underline disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : cooldown > 0 ? `Reenviar e-mail (${cooldown}s)` : 'Não recebeu? Reenviar e-mail'}
            </button>
          </div>
        </div>
      </AuthSplitLayout>
    );
  }

  // TELA 1 — pedir o e-mail
  return (
    <AuthSplitLayout
      title="Redefinição de senha"
      subtitle="Informe o e-mail ou o CPF da sua conta e você receberá as instruções para redefinir sua senha."
    >
      {errorBox}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="forgot-user" className="text-sm lg:text-xs font-semibold text-slate-800">
            E-mail ou CPF*
          </label>
          <input
            id="forgot-user"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="E-mail ou CPF"
            className={inputClass}
          />
        </div>

        <button type="submit" disabled={loading || !userInput.trim()} className={primaryButtonClass}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Enviando...' : 'Redefinir'}
        </button>
      </form>

      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-sm lg:text-xs font-medium text-slate-700 hover:text-slate-900"
      >
        <ArrowLeft size={16} /> Voltar para o login
      </Link>
    </AuthSplitLayout>
  );
}
