
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { Toaster } from "./components/ui/sonner";
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

// Providers
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/guards/ProtectedRoute";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<Index />} />
                  <Route path="demandas" element={<Demandas />} />
                  <Route path="demandas/:id" element={<ServiceDetail />} />
                  <Route path="demandas/:id/edit" element={<ServiceDetail editMode={true} />} />
                  <Route path="nova-demanda" element={<NewService />} />
                  <Route path="buscar" element={<Search />} />
                  <Route path="settings" element={<Settings />} />
                  
                  {/* Routes with specific permissions */}
                  <Route path="estatisticas" element={<ProtectedRoute requiredPermission="view_stats"><Estatisticas /></ProtectedRoute>} />
                  <Route path="equipe" element={<ProtectedRoute requiredPermission="add_members"><Equipe /></ProtectedRoute>} />
                  
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
      <Toaster />
    </>
  );
}

export default App;
