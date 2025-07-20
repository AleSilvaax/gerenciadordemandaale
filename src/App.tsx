import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { EnhancedAuthProvider } from '@/context/EnhancedAuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Index } from '@/pages/Index';
import { NewService } from '@/pages/NewService';
import { Demandas } from '@/pages/Demandas';
import { ServiceDetail } from '@/pages/ServiceDetail';
import { Search } from '@/pages/Search';
import Statistics from '@/pages/Statistics';
import { Equipe } from '@/pages/Equipe';
import Calendar from '@/pages/Calendar';
import { Settings } from '@/pages/Settings';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { NotFound } from '@/pages/NotFound';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProfilePage } from '@/pages/ProfilePage';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <QueryClient>
          <EnhancedAuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/nova-demanda" element={<NewService />} />
                      <Route path="/demandas" element={<Demandas />} />
                      <Route path="/demanda/:id" element={<ServiceDetail />} />
                      <Route path="/buscar" element={<Search />} />
                      <Route path="/estatisticas" element={<Statistics />} />
                      <Route path="/equipe" element={<Equipe />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              } />
            </Routes>
          </EnhancedAuthProvider>
        </QueryClient>
      </BrowserRouter>
    </div>
  );
}

export default App;
