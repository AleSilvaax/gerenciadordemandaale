
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { Toaster } from "./components/ui/sonner";
import React from "react"; // Ensuring React is imported

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

// Providers
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Index />} />
              <Route path="demandas" element={<Demandas />} />
              <Route path="demandas/:id" element={<ServiceDetail />} />
              <Route path="demandas/:id/edit" element={<ServiceDetail editMode={true} />} />
              <Route path="nova-demanda" element={<NewService />} />
              <Route path="estatisticas" element={<Estatisticas />} />
              <Route path="equipe" element={<Equipe />} />
              <Route path="buscar" element={<Search />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
      </QueryClientProvider>
      <Toaster />
    </>
  );
}

export default App;
