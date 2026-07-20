import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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
import Analises from './pages/Analises';
import RelatorioDiario from './pages/RelatorioDiario';
import Configuracoes from './pages/Configuracoes';
import Onboarding from './pages/Onboarding';
import Offline from './pages/Offline';

export default function App() {
  return (
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
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          } />

          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppShell>
                <Dashboard />
              </AppShell>
            </ProtectedRoute>
          } />

          <Route path="/analises" element={
            <ProtectedRoute>
              <AppShell>
                <Analises />
              </AppShell>
            </ProtectedRoute>
          } />

          <Route path="/relatorio-diario" element={
            <ProtectedRoute>
              <AppShell>
                <RelatorioDiario />
              </AppShell>
            </ProtectedRoute>
          } />

          <Route path="/importacoes" element={
            <ProtectedRoute>
              <AppShell>
                <Importacoes />
              </AppShell>
            </ProtectedRoute>
          } />

          <Route path="/configuracoes" element={
            <ProtectedRoute>
              <AppShell>
                <Configuracoes />
              </AppShell>
            </ProtectedRoute>
          } />

          <Route path="/offline" element={<Offline />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
