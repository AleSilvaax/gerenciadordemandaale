
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Demandas from "./pages/Demandas";
import ServiceDetail from "./pages/ServiceDetail";
import NewService from "./pages/NewService";
import Estatisticas from "./pages/Estatisticas";
import Equipe from "./pages/Equipe";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

// Helper component to handle tab selection in Demandas and other navigation
const NavigationHelper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Handle Demandas tab selection
    if (location.pathname === "/demandas") {
      const selectedTab = localStorage.getItem("demandasTab");
      if (selectedTab) {
        localStorage.removeItem("demandasTab");
      }
    }
    
    // Scroll to top on navigation
    window.scrollTo(0, 0);
  }, [location, navigate]);
  
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <NavigationHelper />
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/demandas" element={<Demandas />} />
            <Route path="/demandas/new" element={<NewService />} />
            <Route path="/demandas/:id" element={<ServiceDetail />} />
            <Route path="/estatisticas" element={<Estatisticas />} />
            <Route path="/equipe" element={<Equipe />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
