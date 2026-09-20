import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

// ---------------------------------------------------------------------------
// TROCA OBRIGATÓRIA DE SENHA (primeiro acesso)
//
// O colaborador começa com a senha padrão (o próprio CPF). Este popup aparece
// por cima de qualquer tela que tenha o Navbar e só some depois que ele
// define uma senha nova. Não tem botão de fechar de propósito.
//
// Quando ele aparece:
//  1) o Login percebeu que a pessoa entrou com a senha padrão (CPF) e chamou
//     markForcePasswordChange(); ou
//  2) a coluna Employees.must_change_password está true (colaborador novo ou
//     senha resetada pelo gestor) — só funciona depois de rodar o SQL da
//     etapa de segurança; se a coluna ainda não existe, o popup usa só (1).
// ---------------------------------------------------------------------------

export const FORCE_PASSWORD_FLAG = 'wiaponto_force_password_change';

export const markForcePasswordChange = (authUserId) => {
  try {
    localStorage.setItem(FORCE_PASSWORD_FLAG, authUserId);
  } catch (_) {
    /* sem storage: segue só pela coluna do banco */
  }
};

export const clearForcePasswordChange = () => {
  try {
    localStorage.removeItem(FORCE_PASSWORD_FLAG);
  } catch (_) {
    /* ignora */
  }
};

export default function ForcePasswordChangeModal() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [open, setOpen] = useState(false);
  const [cpfDigits, setCpfDigits] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);

  // Decide se o popup deve aparecer
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid || cancelled) return;

      let mustChange = false;
      try {
        mustChange = localStorage.getItem(FORCE_PASSWORD_FLAG) === uid;
      } catch (_) {
        /* ignora */
      }

      let cpf = '';
      const full = await supabase
        .from('Employees')
        .select('must_change_password, cpf')
        .eq('auth_user_id', uid)
        .maybeSingle();

      if (!full.error) {
        mustChange = mustChange || full.data?.must_change_password === true;
        cpf = full.data?.cpf || '';
      } else {
        // A coluna must_change_password ainda não existe: só pega o CPF.
        const basic = await supabase
          .from('Employees')
          .select('cpf')
          .eq('auth_user_id', uid)
          .maybeSingle();
        cpf = basic.data?.cpf || '';
      }

      if (cancelled) return;
      setCpfDigits(String(cpf).replace(/\D/g, ''));
      if (mustChange) setOpen(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Trava a rolagem da página enquanto o popup está aberto
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

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

      // Desliga a exigência no banco (função criada no SQL da etapa de
      // segurança). Se ela ainda não existe, não faz mal: o aviso local
      // já foi limpo logo abaixo.
      try {
        await supabase.rpc('clear_must_change_password');
      } catch (_) {
        /* ignora */
      }
      clearForcePasswordChange();

      setDone(true);
      setTimeout(() => setOpen(false), 1800);
    } catch (err) {
      console.error('Erro ao trocar a senha:', err);
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('different from the old password')) {
        setErrorMsg('A nova senha precisa ser diferente da senha atual.');
      } else if (msg.includes('weak') || msg.includes('at least')) {
        setErrorMsg('Essa senha é muito fraca. Use letras e números, com pelo menos 8 caracteres.');
      } else {
        setErrorMsg('Não foi possível salvar a nova senha. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (signOut) await signOut();
      else await supabase.auth.signOut();
      localStorage.removeItem('userSession');
      sessionStorage.removeItem('userSession');
    } catch (err) {
      console.error('Erro ao sair:', err);
    } finally {
      navigate('/login');
    }
  };

  if (!open) return null;

  const inputClass =
    'w-full px-3.5 py-3 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#fc9314] focus:border-transparent transition-all text-base sm:text-sm text-slate-700 bg-white placeholder:text-slate-400 pr-10';

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4 select-text text-slate-800"
      role="dialog"
      aria-modal="true"
      aria-labelledby="force-password-title"
    >
      <div className="w-full max-w-sm bg-white rounded-lg shadow-2xl border border-slate-200 max-h-[92dvh] overflow-y-auto">
        {done ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
            <h2 id="force-password-title" className="text-lg font-bold text-slate-800">
              Senha alterada!
            </h2>
            <p className="text-sm text-slate-500">Sua nova senha já está valendo.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4" noValidate>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#ff8b00]/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#ff8b00]" />
              </div>
              <h2 id="force-password-title" className="text-lg font-bold text-slate-800">
                Crie sua nova senha
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Por segurança, no primeiro acesso você precisa trocar a senha padrão por uma senha só sua.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="force-new-password" className="text-sm font-semibold text-slate-800">
                Nova senha*
              </label>
              <div className="relative">
                <input
                  id="force-new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  className={inputClass}
                  required
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
              <label htmlFor="force-confirm-password" className="text-sm font-semibold text-slate-800">
                Confirmar nova senha*
              </label>
              <input
                id="force-confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className={inputClass}
                required
              />
              <p className="text-xs text-slate-400">Não use o seu CPF como senha.</p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-6 rounded-md bg-[#ff8c00] hover:bg-[#ffa12e] text-white font-semibold text-base sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Salvando...' : 'Salvar nova senha'}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={saving}
              className="w-full text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2 disabled:opacity-50"
            >
              Sair da conta
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
