// Arquivo: src/components/layout/AppLayout.tsx (VERSÃO FINAL E CORRIGIDA)

import React from "react";
import Navbar from "./Navbar";
import UserProfileMenu from "./UserProfileMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const { isLoading, user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header Unificado */}
      {user && (
        <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 p-4 sticky top-0 z-50">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2 font-bold text-xl text-primary">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">GD</span>
              </div>
              <span className={isMobile ? "hidden sm:block" : ""}>GerenciadorDemandas</span>
              {isMobile && <span className="sm:hidden">GD</span>}
            </div>

            {/* ✅ 2. Adicionamos o sino de notificações aqui, ao lado do perfil */}
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <UserProfileMenu />
            </div>

          </div>
        </header>
      )}

      <main className={`flex-1 ${isMobile ? 'pb-20' : 'pb-4'} overflow-y-auto`}>
        <div className="pt-0 min-w-full">
          {children}
        </div>
      </main>
      
      <Navbar />
    </div>
  );
};
