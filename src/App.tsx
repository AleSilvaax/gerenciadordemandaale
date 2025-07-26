import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OptimizedAuthProvider, useOptimizedAuth } from '@/context/OptimizedAuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import Index from '@/pages/Index';
import NewService from '@/pages/NewService';
import Demandas from '@/pages/Demandas';
import ServiceDetail from '@/pages/ServiceDetail';
import Search from '@/pages/Search';
import Statistics from '@/pages/Statistics';
import Equipe from '@/pages/Equipe';
import Calendar from '@/pages/Calendar';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import NotFound from '@/pages/NotFound';
import { ProfilePage } from '@/components/profile/ProfilePage';
import { Navigate, useLocation } from 'react-router-dom';
import { ServiceErrorBoundary } from '@/components/common/ServiceErrorBoundary';

const queryClient = new QueryClient();

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useOptimizedAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <OptimizedAuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/*" 
                element={
                  <AuthGuard>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/nova-demanda" element={<NewService />} />
                        <Route path="/demandas" element={<Demandas />} />
                        <Route path="/demanda/:id" element={
                          <ServiceErrorBoundary>
                            <ServiceDetail />
                          </ServiceErrorBoundary>
                        } />
                        <Route path="/buscar" element={<Search />} />
                        <Route path="/estatisticas" element={<Statistics />} />
                        <Route path="/equipe" element={<Equipe />} />
                        <Route path="/calendar" element={<Calendar />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </AuthGuard>
                } 
              />
            </Routes>
          </OptimizedAuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;