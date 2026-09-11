import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function ProtectedRoute({ allowedRoles = [], unauthenticatedElement = null }) {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-100">
        <span className="text-slate-500 text-sm">Validando permissões...</span>
      </div>
    );
  }

  // Não está logado
  if (!user) {
    return unauthenticatedElement || <Navigate to="/login" replace />;
  }

  // Se nenhuma regra de role foi passada, permite o acesso (apenas checou login)
  if (!allowedRoles || allowedRoles.length === 0) {
    return <Outlet />;
  }

  // Normaliza a permissão do usuário
  const userRole = String(user.role || user.tipoAcesso || '').toLowerCase();

  // "gestor" precisa ter acesso TOTAL, idêntico ao "admin" (dono da conta) —
  // em toda página, sem exceção. Em vez de sair caçando e editando o
  // allowedRoles de cada rota (App.jsx) uma por uma — o que é frágil, já
  // que basta alguém esquecer de incluir 'gestor' numa rota nova pra essa
  // regra quebrar de novo — tratamos os dois papéis como equivalentes bem
  // aqui, no único lugar que decide autorização: se a rota libera 'admin'
  // OU 'gestor', e o usuário logado é 'admin' OU 'gestor' (qualquer um dos
  // dois), o acesso é liberado.
  const ADMIN_TIER_ROLES = ['admin', 'gestor'];
  const isAdminTierUser = ADMIN_TIER_ROLES.includes(userRole);

  const isAuthorized = allowedRoles.some((role) => {
    const normalizedRole = role.toLowerCase();
    if (isAdminTierUser && ADMIN_TIER_ROLES.includes(normalizedRole)) return true;
    return userRole.includes(normalizedRole);
  });

  // Colaborador tentando acessar rota de gestor -> Redireciona para a home/ponto
  if (!isAuthorized) {
    return <Navigate to="/ponto" replace />;
  }

  return <Outlet />;
}
