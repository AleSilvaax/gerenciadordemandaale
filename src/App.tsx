
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { Toaster as SonnerToaster } from "./components/ui/sonner";
import { Toaster } from "./components/ui/toaster";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import React from "react";

// Pages
import Index from "./pages/Index";
import Demandas from "./pages/Demandas";
import ServiceDetail from "./pages/ServiceDetail";
import NewService from "./pages/NewService";
import Estatisticas from "./pages/Estatisticas";
import Equipe from "./pages/Equipe";
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Providers
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/guards/ProtectedRoute";

// Create a client with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<Index />} />
                  <Route path="demandas" element={<Demandas />} />
                  <Route path="demandas/:id" element={<ServiceDetail />} />
                  <Route path="demandas/:id/edit" element={<ServiceDetail editMode={true} />} />
                  <Route path="buscar" element={<Search />} />
                  <Route path="settings" element={<Settings />} />
                  
                  {/* Routes with role-based access */}
                  <Route path="nova-demanda" element={<ProtectedRoute requiredRole="gestor"><NewService /></ProtectedRoute>} />
                  <Route path="estatisticas" element={<ProtectedRoute requiredRole="gestor"><Estatisticas /></ProtectedRoute>} />
                  <Route path="equipe" element={<ProtectedRoute requiredRole="gestor"><Equipe /></ProtectedRoute>} />
                  
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>
            </Routes>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
      <SonnerToaster />
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
