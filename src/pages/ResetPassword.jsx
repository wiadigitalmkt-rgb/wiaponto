import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      // Atualiza a senha no Supabase Auth
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // Atualiza também na tabela Employees se o usuário estiver na sessão
      if (data?.user?.email) {
        await supabase
          .from("Employees")
          .update({ password_hash: newPassword })
          .eq("email", data.user.email);
      }

      setSuccess(true);
    } catch (err) {
      console.error("Erro ao redefinir senha:", err);
      setError(err.message || "Falha ao redefinir a senha. O link pode ter expirado.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        icon={CheckCircle}
        title="Senha redefinida!"
        subtitle="Sua nova senha foi atualizada com sucesso."
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Você já pode acessar sua conta utilizando as novas credenciais.
          </p>
          <Button
            onClick={() => navigate("/login")}
            className="w-full h-12 font-medium bg-[#00a887] hover:bg-[#008f73]"
          >
            Ir para o Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="Nova senha"
      subtitle="Digite sua nova senha abaixo para atualizar seu acesso"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nova Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar Nova Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium bg-[#00a887] hover:bg-[#008f73]" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Atualizando...
            </>
          ) : (
            "Redefinir senha"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
