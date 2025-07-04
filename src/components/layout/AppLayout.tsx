
import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
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
import Equipe from "@/pages/Equipe";

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
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      <main className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-none ${isMobile ? 'pb-20' : 'pb-4'}`}>
        <div className="min-w-full">
          <Routes>
            <Route path="/" element={<EnhancedIndex />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/nova-demanda" element={<NewService />} />
            <Route path="/demandas" element={<Demandas />} />
            <Route path="/demandas/:id" element={<ServiceDetail />} />
            <Route path="/estatisticas" element={<Statistics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/equipe" element={<Equipe />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};
