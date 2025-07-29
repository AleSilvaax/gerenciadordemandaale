// src/App.tsx (Versão corrigida)

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Helmet, HelmetProvider } from 'react-helmet-async';

// Importe suas páginas e componentes
import Login from './pages/Login';
import Register from './pages/Register';
import AppLayout from './components/layout/AppLayout';
import AuthGuard from './components/guards/AuthGuard';
import EnhancedIndex from './pages/EnhancedIndex';
import Demandas from './pages/Demandas';
import NewService from './pages/NewService';
import ServiceDetail from './pages/ServiceDetail';
import Equipe from './pages/Equipe';
import Calendar from './pages/Calendar';
import Estatisticas from './pages/Estatisticas';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { OptimizedAuthContextProvider } from './context/OptimizedAuthContext';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <HelmetProvider>
        <Helmet>
          <title>Gestor de Demandas</title>
          <meta name="description" content="Sistema de gerenciamento de demandas de serviços." />
        </Helmet>
        <TooltipProvider>
          <OptimizedAuthContextProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Rotas Protegidas com o Layout */}
                <Route 
                  path="/" 
                  element={
                    <AuthGuard>
                      <AppLayout />
                    </AuthGuard>
                  }
                >
                  <Route index element={<EnhancedIndex />} />
                  <Route path="demandas" element={<Demandas />} />
                  <Route path="new-service" element={<NewService />} />
                  <Route path="services/:id" element={<ServiceDetail />} />
                  <Route path="equipe" element={<Equipe />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="estatisticas" element={<Estatisticas />} />
                  <Route path="settings" element={<Settings />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </OptimizedAuthContextProvider>
        </TooltipProvider>
      </HelmetProvider>
    </ThemeProvider>
  );
}

export default App;
