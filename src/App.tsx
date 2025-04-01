
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
import Search from "./pages/Search";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

// Configure React Query with better caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes (renamed from cacheTime)
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchOnMount: true,      // Refetch when component mounts
      retry: 2,                  // Retry failed requests twice
    },
  },
});

// Helper component to handle tab selection and page refreshes
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
    
    // Force refresh data if coming from a form submission
    const needsRefresh = sessionStorage.getItem("needsRefresh");
    if (needsRefresh) {
      queryClient.invalidateQueries();
      sessionStorage.removeItem("needsRefresh");
    }
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
            <Route path="/search" element={<Search />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
