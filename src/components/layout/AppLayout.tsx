
import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import { EnhancedNavbar } from "./EnhancedNavbar";
import { RealtimeNotifications } from "@/components/notifications/RealtimeNotifications";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import EnhancedIndex from "@/pages/EnhancedIndex";
import Index from "@/pages/Index";
import NewService from "@/pages/NewService";
import ServiceDetail from "@/pages/ServiceDetail";
import Demandas from "@/pages/Demandas";
import MinhasDemandas from "@/pages/MinhasDemandas";
import Agendamento from "@/pages/Agendamento";
import Settings from "@/pages/Settings";
import Statistics from "@/pages/Statistics";
import Equipe from "@/pages/Equipe";
import ProfilePage from "@/components/profile/ProfilePage";
import Auth from "@/pages/Auth";

export const AppLayout: React.FC = () => {
  const isMobile = useIsMobile();
  const { isAuthenticated } = useAuth();
  
  // Se não está autenticado, mostra apenas as páginas de auth
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/*" element={<Auth />} />
        </Routes>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      {/* Real-time notifications */}
      <RealtimeNotifications />
      
      {/* Header Desktop com Menu de Perfil */}
      {!isMobile && <EnhancedNavbar isAuthenticated={isAuthenticated} />} {/* Passando a prop isAuthenticated */}

      {/* Header Mobile */}
      {isMobile && (
        <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 p-4 sticky top-0 z-40">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 font-bold text-lg text-primary">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">GD</span>
              </div>
              <span className="hidden xs:block">GerenciadorDemandas</span>
              <span className="xs:hidden">GD</span>
            </div>
          </div>
        </header>
      )}

      <main className={`flex-1 ${isMobile ? 'pb-20' : 'pb-4'} overflow-y-auto overflow-x-hidden scrollbar-none`}>
        <div className="pt-0 min-w-full">
          <Routes>
            <Route path="/" element={<EnhancedIndex />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/nova-demanda" element={<NewService />} />
            <Route path="/demandas" element={<Demandas />} />
            <Route path="/minhas-demandas" element={<MinhasDemandas />} />
            <Route path="/agendamento" element={<Agendamento />} />
            <Route path="/servico/:id" element={<ServiceDetail />} />
            <Route path="/estatisticas" element={<Statistics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/equipe" element={<Equipe />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </div>
      </main>
      
      {/* Mobile Navigation */}
      <Navbar />
    </div>
  );
};
