
import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import UserProfileMenu from "./UserProfileMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEnhancedAuth } from "@/context/EnhancedAuthContext";
import { Loader2 } from "lucide-react";
import EnhancedIndex from "@/pages/EnhancedIndex";
import Index from "@/pages/Index";
import NewService from "@/pages/NewService";
import ServiceDetail from "@/pages/ServiceDetail";
import Demandas from "@/pages/Demandas";
import Settings from "@/pages/Settings";
import Statistics from "@/pages/Statistics";
import Equipe from "@/pages/Equipe";
import ProfilePage from "@/components/profile/ProfilePage";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const { isLoading, user } = useEnhancedAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      {/* Header com Menu de Perfil - Apenas Desktop */}
      {!isMobile && user && (
        <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 p-4 sticky top-0 z-50">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2 font-bold text-xl text-primary">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">GD</span>
              </div>
              <span>GerenciadorDemandas</span>
            </div>
            <UserProfileMenu />
          </div>
        </header>
      )}

      {/* Header Mobile com Menu de Perfil */}
      {isMobile && user && (
        <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 p-4 sticky top-0 z-40">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 font-bold text-lg text-primary">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">GD</span>
              </div>
              <span className="hidden xs:block">GerenciadorDemandas</span>
              <span className="xs:hidden">GD</span>
            </div>
            <UserProfileMenu />
          </div>
        </header>
      )}

      <main className={`flex-1 ${isMobile ? 'pb-20' : 'pb-4'} overflow-y-auto overflow-x-hidden scrollbar-none`}>
        <div className="pt-0 min-w-full">
          {children}
        </div>
      </main>
      <Navbar />
    </div>
  );
};
