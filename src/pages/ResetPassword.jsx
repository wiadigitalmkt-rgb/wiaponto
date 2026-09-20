import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AuthSplitLayout from '@/components/AuthSplitLayout';
import { clearForcePasswordChange } from '@/components/ForcePasswordChangeModal';

// Tela aberta pelo link do e-mail "Esqueci minha senha".
// Estados: checking (validando o link) → form (digitar nova senha)
//          → success (senha trocada) | expired (link vencido ou inválido)
//
// IMPORTANTE: a senha só é trocada no Supabase Auth. Nada de gravar a senha
// (nem hash) na tabela Employees a partir do navegador.

const FORGOT_PASSWORD_PATH = '/esqueci-minha-senha';

const inputClass =
  'w-full px-3.5 py-3 lg:py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#fc9314] focus:border-transparent transition-all text-base lg:text-xs text-slate-700 pr-10 bg-white placeholder:text-slate-400 font-normal';
const primaryButtonClass =
  'w-full py-3 lg:py-2.5 px-6 rounded-md bg-[#ff8c00] hover:bg-[#ffa12e] text-white font-semibold text-base lg:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-50';
const outlineButtonClass =
  'w-full py-3 lg:py-2.5 px-6 rounded-md border border-[#ff8c00] text-[#ff8c00] hover:bg-[#ff8c00]/5 font-semibold text-base lg:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking | form | expired | success
  const [cpfDigits, setCpfDigits] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // 1) Descobre se o link do e-mail ainda vale
  useEffect(() => {
    let cancelled = false;

    // O Supabase devolve o erro na própria URL quando o link venceu
    // (ex.: #error=access_denied&error_code=otp_expired).
    const urlParams = new URLSearchParams(
      window.location.hash.replace(/^#/, '') + '&' + window.location.search.replace(/^\?/, '')
    );
    if (urlParams.get('error') || urlParams.get('error_code') || urlParams.get('error_description')) {
      setStatus('expired');
      return undefined;
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setStatus((prev) => (prev === 'checking' ? 'form' : prev));
      }
    });

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data?.session) {
        setStatus((prev) => (prev === 'checking' ? 'form' : prev));
      } else {
        // pequena espera: a sessão do link pode estar sendo criada agora
        setTimeout(() => {
          if (!cancelled) setStatus((prev) => (prev === 'checking' ? 'expired' : prev));
        }, 1500);
      }
    })();

    return () => {
      cancelled = true;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // 2) Com o link válido, busca o CPF só para impedir "senha = CPF"
  useEffect(() => {
    if (status !== 'form') return;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) return;
      const { data: emp } = await supabase
        .from('Employees')
        .select('cpf')
        .eq('auth_user_id', uid)
        .maybeSingle();
      setCpfDigits(String(emp?.cpf || '').replace(/\D/g, ''));
    })();
  }, [status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }
    if (cpfDigits && newPassword.replace(/\D/g, '') === cpfDigits) {
      setErrorMsg('Escolha uma senha diferente do seu CPF.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      // Desliga a troca obrigatória (função criada no SQL de segurança).
      try {
        await supabase.rpc('clear_must_change_password');
      } catch (_) {
        /* ignora: a coluna/função pode ainda não existir */
      }
      clearForcePasswordChange();

      // Encerra a sessão temporária do link: a pessoa entra de novo, já com a senha nova.
      await supabase.auth.signOut();
      setStatus('success');
    } catch (err) {
      console.error('Erro ao redefinir senha:', err);
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('different from the old password')) {
        setErrorMsg('A nova senha precisa ser diferente da senha atual.');
      } else if (msg.includes('weak') || msg.includes('at least')) {
        setErrorMsg('Essa senha é muito fraca. Use letras e números, com pelo menos 8 caracteres.');
      } else if (msg.includes('session') || msg.includes('expired') || msg.includes('jwt')) {
        setStatus('expired');
      } else {
        setErrorMsg('Não foi possível redefinir a senha. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  // VALIDANDO O LINK
  if (status === 'checking') {
    return (
      <AuthSplitLayout title="Validando link...">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-[#ff8b00]" />
          Aguarde um instante.
        </div>
      </AuthSplitLayout>
    );
  }

  // LINK EXPIRADO / INVÁLIDO
  if (status === 'expired') {
    return (
      <AuthSplitLayout title="Link expirado">
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm lg:text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Este link de redefinição de senha expirou ou já foi utilizado. Por segurança, cada link
              funciona uma única vez e por tempo limitado.
            </p>
          </div>

          <div className="space-y-3">
            <Link to={FORGOT_PASSWORD_PATH} className={primaryButtonClass}>
              Solicitar novo link
            </Link>
            <Link to="/login" className={outlineButtonClass}>
              <ArrowLeft size={16} /> Voltar para o login
            </Link>
          </div>
        </div>
      </AuthSplitLayout>
    );
  }

  // SENHA REDEFINIDA
  if (status === 'success') {
    return (
      <AuthSplitLayout title="Senha redefinida!">
        <div className="space-y-5">
          <div className="flex items-start gap-3 text-sm lg:text-xs text-slate-600">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
            <p className="leading-relaxed">
              Sua nova senha foi atualizada com sucesso. Agora é só entrar com ela.
            </p>
          </div>
          <button type="button" onClick={() => navigate('/login')} className={primaryButtonClass}>
            Ir para o login
          </button>
        </div>
      </AuthSplitLayout>
    );
  }

  // FORMULÁRIO DE NOVA SENHA
  return (
    <AuthSplitLayout title="Nova senha" subtitle="Digite sua nova senha para atualizar o seu acesso.">
      {errorMsg && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm lg:text-xs font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="new-password" className="text-sm lg:text-xs font-semibold text-slate-800">
            Nova senha*
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              autoFocus
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo de 8 caracteres"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className="text-sm lg:text-xs font-semibold text-slate-800">
            Confirmar nova senha*
          </label>
          <input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a nova senha"
            className={inputClass}
          />
          <p className="text-xs text-slate-400">Não use o seu CPF como senha.</p>
        </div>

        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? 'Salvando...' : 'Redefinir senha'}
        </button>
      </form>
    </AuthSplitLayout>
  );
}
