
import React from "react";
import { Routes, Route } from "react-router-dom";
import { Navbar } from "./Navbar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import EnhancedIndex from "@/pages/EnhancedIndex";
import Index from "@/pages/Index";
import NewService from "@/pages/NewService";
import ServiceDetail from "@/pages/ServiceDetail";
import Demandas from "@/pages/Demandas";
import Settings from "@/pages/Settings";
import Statistics from "@/pages/Statistics";

export const AppLayout: React.FC = () => {
  const isMobile = useIsMobile();
  const { isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      <main className={`flex-1 ${isMobile ? 'pb-20' : 'pb-16'} overflow-y-auto overflow-x-hidden scrollbar-none`}>
        <div className="pt-2 min-w-full">
          <Routes>
            <Route path="/" element={<EnhancedIndex />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/nova-demanda" element={<NewService />} />
            <Route path="/demandas" element={<Demandas />} />
            <Route path="/demandas/:id" element={<ServiceDetail />} />
            <Route path="/estatisticas" element={<Statistics />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="/equipe" element={<Settings />} />
          </Routes>
        </div>
      </main>
      <Navbar />
    </div>
  );
};
