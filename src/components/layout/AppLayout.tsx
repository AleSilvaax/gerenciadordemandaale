// Arquivo: src/components/layout/AppLayout.tsx (VERSÃO FINAL E CORRIGIDA)

import React from "react";
import Navbar from "./Navbar";
import UserProfileMenu from "./UserProfileMenu";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import pactoLogo from '@/assets/pacto-logo.png';
import { Link } from "react-router-dom";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isLoading, user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground">
      {user && (
        <header className="sticky top-0 z-40 h-14 md:h-16 bg-card/95 backdrop-blur-md border-b border-border">
          <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 min-w-0">
              <img src={pactoLogo} alt="Pacto" width={36} height={36} className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="leading-tight min-w-0">
                <p className="font-bold text-foreground truncate">Pacto</p>
                <p className="text-xs text-muted-foreground truncate">Gestão de Operações</p>
              </div>
            </Link>
            <div className="flex items-center gap-1.5">
              <NotificationCenter />
              <UserProfileMenu />
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 min-w-0 max-w-7xl mx-auto w-full px-3 md:px-6 py-4 md:py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-24">
        {children}
      </main>

      <Navbar />
    </div>
  );
};
