import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PunchClock from './pages/PunchClock';
import TimeClockMirror from './pages/TimeClockMirror';
import Requests from './pages/Requests';

// Imports do Novo Painel Admin
import AdminDashboard from './pages/admin/Dashboard';
import Employees from './pages/admin/Employees';
import CompanySettings from './pages/admin/CompanySettings';
import Usuario from './pages/admin/Usuario';
import Admissao from './pages/admin/Admissao';

// Imports das Páginas Admin Criadas
import Contratos from './pages/admin/Contratos';
import Banco from './pages/admin/Banco';

// Import da Página de Documentos do Colaborador
import Documentos from './pages/documentos';
import Ajuda from './pages/Ajuda';

const AuthenticatedApp = () => {
  const { isLoadingAuth, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  const publicRoutes = ['/login', '/register', '/forgot-password', '/recuperar-senha', '/reset-password'];
  const isPublicRoute = publicRoutes.includes(location.pathname.toLowerCase());

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError && !isPublicRoute) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/recuperar-senha" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Rotas Protegidas (Exige Login) */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        
        {/* Rotas do Colaborador */}
        <Route path="/" element={<PunchClock />} />
        <Route path="/ponto" element={<PunchClock />} />
        <Route path="/espelho" element={<TimeClockMirror />} />
        <Route path="/documentos" element={<Documentos />} />
        <Route path="/ajuda" element={<Ajuda />} />

        {/* Rotas Legadas */}
          <Route path="/solicitacoes" element={<Requests />} />
        </Route>

        {/* Rotas Exclusivas para Gestores/Admins */}
        <Route element={<ProtectedRoute allowedRoles={['gestor', 'admin', 'administrador']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/colaboradores" element={<Employees />} />
          <Route path="/admin/empresa" element={<CompanySettings />} />
          <Route path="/admin/usuario" element={<Usuario />} />
          <Route path="/admin/admissao" element={<Admissao />} />
          <Route path="/admin/contratos" element={<Contratos />} />
          <Route path="/admin/banco-horas" element={<Banco />} />
        </Route>

      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
