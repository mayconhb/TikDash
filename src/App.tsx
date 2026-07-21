import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { PeriodFilterProvider } from './contexts/PeriodFilterContext';
import { ProtectedRoute } from './components/navigation/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import RecoverPassword from './pages/RecoverPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import Dashboard from './pages/Dashboard';
import Importacoes from './pages/Importacoes';
import RelatorioDiario from './pages/RelatorioDiario';
import Configuracoes from './pages/Configuracoes';
import Onboarding from './pages/Onboarding';
import Offline from './pages/Offline';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/recuperar-senha" element={<RecoverPassword />} />
          <Route path="/privacidade" element={<PrivacyPolicy />} />
          <Route path="/termos" element={<Terms />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <PeriodFilterProvider>
                <Navigate to="/dashboard" replace />
              </PeriodFilterProvider>
            </ProtectedRoute>
          } />

          <Route path="/onboarding" element={
            <ProtectedRoute>
              <PeriodFilterProvider>
                <Onboarding />
              </PeriodFilterProvider>
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <PeriodFilterProvider>
                <AppShell>
                  <Dashboard />
                </AppShell>
              </PeriodFilterProvider>
            </ProtectedRoute>
          } />

          <Route path="/relatorio-diario" element={
            <ProtectedRoute>
              <PeriodFilterProvider>
                <AppShell>
                  <RelatorioDiario />
                </AppShell>
              </PeriodFilterProvider>
            </ProtectedRoute>
          } />

          <Route path="/importacoes" element={
            <ProtectedRoute>
              <PeriodFilterProvider>
                <AppShell>
                  <Importacoes />
                </AppShell>
              </PeriodFilterProvider>
            </ProtectedRoute>
          } />

          <Route path="/configuracoes" element={
            <ProtectedRoute>
              <PeriodFilterProvider>
                <AppShell>
                  <Configuracoes />
                </AppShell>
              </PeriodFilterProvider>
            </ProtectedRoute>
          } />

          <Route path="/offline" element={<Offline />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
  );
}
