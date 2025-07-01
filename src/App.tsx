
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "./components/guards/ProtectedRoute";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import Index from "./pages/Index";
import EnhancedIndex from "./pages/EnhancedIndex";
import NewService from "./pages/NewService";
import ServiceDetail from "./pages/ServiceDetail";
import Demandas from "./pages/Demandas";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <AuthProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <EnhancedIndex />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/nova-demanda"
                    element={
                      <ProtectedRoute>
                        <NewService />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/demandas"
                    element={
                      <ProtectedRoute>
                        <Demandas />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/demandas/:id"
                    element={
                      <ProtectedRoute>
                        <ServiceDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/configuracoes"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/equipe"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
