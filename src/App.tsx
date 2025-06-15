
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { Toaster as SonnerToaster } from "./components/ui/sonner";
import { Toaster } from "./components/ui/toaster";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import React from "react";

// Lazy loaded pages
import {
  LazyIndex,
  LazyDemandas,
  LazyServiceDetail,
  LazyNewService,
  LazyEstatisticas,
  LazyEquipe,
  LazySearch,
  LazySettings,
  LazyLogin,
  LazyRegister,
  LazyNotFound
} from "./components/lazy/LazyRoutes";

// Providers
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/guards/ProtectedRoute";

// Create a client with better defaults for performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router basename="/">
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LazyLogin />} />
              <Route path="/register" element={<LazyRegister />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<LazyIndex />} />
                  <Route path="demandas" element={<LazyDemandas />} />
                  <Route path="demandas/:id" element={<LazyServiceDetail />} />
                  <Route path="demandas/:id/edit" element={<LazyServiceDetail editMode={true} />} />
                  <Route path="buscar" element={<LazySearch />} />
                  <Route path="settings" element={<LazySettings />} />
                  
                  {/* Routes with role-based access */}
                  <Route path="nova-demanda" element={<ProtectedRoute requiredRole="gestor"><LazyNewService /></ProtectedRoute>} />
                  <Route path="estatisticas" element={<ProtectedRoute requiredRole="gestor"><LazyEstatisticas /></ProtectedRoute>} />
                  <Route path="equipe" element={<ProtectedRoute requiredRole="gestor"><LazyEquipe /></ProtectedRoute>} />
                </Route>
              </Route>
              
              {/* Catch all route - must be last */}
              <Route path="*" element={<LazyNotFound />} />
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
