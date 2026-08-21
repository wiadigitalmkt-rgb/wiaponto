import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ allowedRoles = ['gestor', 'admin'] }) {
  const { user, loading } = useAuth();

  if (loading) {

      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <span className="text-slate-500 text-sm">Validando permissões...</span>
      </div>
    );
  }

  // Não está logado -> Redireciona para o Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Normaliza a role cadastrada no objeto do usuário
  const userRole = (user.role || user.tipoAcesso || '').toLowerCase();
  const isAuthorized = allowedRoles.some((role) => userRole.includes(role));

  // É colaborador tentando acessar página de Gestor -> Redireciona para o Painel do Colaborador
  if (!isAuthorized) {
    return <Navigate to="/colaborador/ponto" replace />;
  }

  return <Outlet />;
}
