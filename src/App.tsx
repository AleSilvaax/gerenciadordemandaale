import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// ✅ Garante que estamos a usar o AuthProvider da sua versão estável.
import { AuthProvider } from '@/context/AuthContext'; 
import { AuthGuard } from '@/components/guards/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';

// Pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Index from '@/pages/Index';
import NewService from '@/pages/NewService';
import Demandas from '@/pages/Demandas';
import ServiceDetail from '@/pages/ServiceDetail';
import Search from '@/pages/Search';
import Statistics from '@/pages/Statistics';
import Equipe from '@/pages/Equipe';
import Calendar from '@/pages/Calendar';
import Settings from '@/pages/Settings';
import AdminPage from '@/pages/Admin';
import DebugPage from '@/pages/Debug';
import { ProfilePage } from '@/components/profile/ProfilePage';
import NotFound from '@/pages/NotFound';
import { ServiceErrorBoundary } from '@/components/common/ServiceErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {/* ✅ Garante que o provedor correto está a "abraçar" toda a aplicação. */}
        <AuthProvider>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Rotas protegidas */}
            <Route path="/*" element={
              <AuthGuard>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/nova-demanda" element={<NewService />} />
                    <Route path="/demandas" element={<Demandas />} />
                    <Route path="/demanda/:id" element={<ServiceErrorBoundary><ServiceDetail /></ServiceErrorBoundary>} />
                    <Route path="/buscar" element={<Search />} />
                    <Route path="/estatisticas" element={<Statistics />} />
                    <Route path="/equipe" element={<Equipe />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/debug" element={<DebugPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </AuthGuard>
            } />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
