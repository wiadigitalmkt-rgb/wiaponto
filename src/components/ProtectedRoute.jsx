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
  const isAuthorized = allowedRoles.some((role) => userRole.includes(role.toLowerCase()));

  // Colaborador tentando acessar rota de gestor -> Redireciona para a home/ponto
  if (!isAuthorized) {
    return <Navigate to="/ponto" replace />;
  }

  return <Outlet />;
}
