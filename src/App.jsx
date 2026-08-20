import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import PunchClock from './pages/PunchClock';
import TimeClockMirror from './pages/TimeClockMirror';
import Requests from './pages/Requests';
import Payslip from './pages/Payslip';
import Settings from './pages/Settings';
import ProLabore from './pages/ProLabore';
import Admin from './pages/Admin';

// Imports do Novo Painel Admin
import AdminDashboard from './pages/admin/Dashboard';
import Employees from './pages/admin/Employees';
import CompanySettings from './pages/admin/CompanySettings';
import PontoEletronico from './pages/admin/Ponto';
import Usuario from './pages/admin/Usuario';
import Admissao from './pages/admin/Admissao';

// Imports das Páginas Admin Criadas
import Contratos from './pages/admin/Contratos';
import Banco from './pages/admin/Banco';
import AdminDocumentos from './pages/admin/Documentos';
import Ajuda from './pages/admin/Ajuda';

// Import da Página de Documentos do Colaborador (caminho em minúsculo para bater com a estrutura de pastas)
import Documentos from './pages/documentos';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  // Lista de rotas públicas que não devem ser redirecionadas pelo AuthContext
  const publicRoutes = ['/login', '/register', '/forgot-password', '/recuperar-senha', '/reset-password'];
  const isPublicRoute = publicRoutes.includes(location.pathname.toLowerCase());

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Só redireciona se houver erro de auth E a pessoa NÃO estiver em uma rota pública
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

      {/* Rotas Protegidas */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        
        {/* Rotas Diretas do Colaborador (Livre do Layout legado Base44) */}
        <Route path="/" element={<PunchClock />} />
        <Route path="/ponto" element={<PunchClock />} />
        <Route path="/espelho" element={<TimeClockMirror />} />
        <Route path="/documentos" element={<Documentos />} />

        {/* Rotas Legadas (que usavam Layout antigo) */}
        <Route element={<Layout />}>
          <Route path="/home-old" element={<Home />} />
          <Route path="/solicitacoes" element={<Requests />} />
          <Route path="/contracheque" element={<Payslip />} />
          <Route path="/configuracoes" element={<Settings />} />
          <Route path="/prolabore" element={<ProLabore />} />
          <Route path="/admin-old" element={<Admin />} />
        </Route>

        {/* Rotas do Painel Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/ponto" element={<PontoEletronico />} />
        <Route path="/admin/colaboradores" element={<Employees />} />
        <Route path="/admin/empresa" element={<CompanySettings />} />
        <Route path="/admin/usuario" element={<Usuario />} />
        <Route path="/admin/admissao" element={<Admissao />} />
        <Route path="/admin/contratos" element={<Contratos />} />
        <Route path="/admin/banco-horas" element={<Banco />} />
        <Route path="/admin/documentos" element={<AdminDocumentos />} />
        <Route path="/admin/ajuda" element={<Ajuda />} />

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
