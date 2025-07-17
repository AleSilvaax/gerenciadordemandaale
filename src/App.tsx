
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';

// Usar contexto de autenticação real em vez do mock
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute';

// Páginas
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import NewService from '@/pages/NewService';
import Demandas from '@/pages/Demandas';
import MinhasDemandas from '@/pages/MinhasDemandas';
import ServiceDetail from '@/pages/ServiceDetail';
import Search from '@/pages/Search';
import Equipe from '@/pages/Equipe';
import Settings from '@/pages/Settings';
import Estatisticas from '@/pages/Estatisticas';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 1,
    },
  },
});

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background font-sans antialiased">
              <Routes>
                {/* Rotas públicas */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Rotas protegidas */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                
                <Route path="/nova-demanda" element={
                  <ProtectedRoute>
                    <NewService />
                  </ProtectedRoute>
                } />
                
                <Route path="/demandas" element={
                  <ProtectedRoute>
                    <Demandas />
                  </ProtectedRoute>
                } />
                
                <Route path="/minhas-demandas" element={
                  <ProtectedRoute>
                    <MinhasDemandas />
                  </ProtectedRoute>
                } />
                
                <Route path="/servico/:id" element={
                  <ProtectedRoute>
                    <ServiceDetail />
                  </ProtectedRoute>
                } />
                
                <Route path="/buscar" element={
                  <ProtectedRoute>
                    <Search />
                  </ProtectedRoute>
                } />
                
                <Route path="/equipe" element={
                  <ProtectedRoute>
                    <Equipe />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                
                <Route path="/estatisticas" element={
                  <ProtectedRoute>
                    <Estatisticas />
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
