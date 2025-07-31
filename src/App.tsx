
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
        <AuthProvider>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Rotas protegidas */}
            <Route path="/" element={
              <AuthGuard>
                <AppLayout>
                  <Index />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/nova-demanda" element={
              <AuthGuard>
                <AppLayout>
                  <NewService />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/demandas" element={
              <AuthGuard>
                <AppLayout>
                  <Demandas />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/demanda/:id" element={
              <AuthGuard>
                <AppLayout>
                  <ServiceErrorBoundary>
                    <ServiceDetail />
                  </ServiceErrorBoundary>
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/buscar" element={
              <AuthGuard>
                <AppLayout>
                  <Search />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/estatisticas" element={
              <AuthGuard>
                <AppLayout>
                  <Statistics />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/equipe" element={
              <AuthGuard>
                <AppLayout>
                  <Equipe />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/calendar" element={
              <AuthGuard>
                <AppLayout>
                  <Calendar />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/settings" element={
              <AuthGuard>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/profile" element={
              <AuthGuard>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </AuthGuard>
            } />
            
            {/* Rota 404 */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
