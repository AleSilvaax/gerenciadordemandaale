// Arquivo: src/components/layout/AppLayout.tsx (VERSÃO FINAL E CORRIGIDA)

import React from "react";
import Navbar from "./Navbar";
import UserProfileMenu from "./UserProfileMenu";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Layers } from "lucide-react";
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
    <div className="flex flex-col min-h-[100dvh] bg-slate-50/80 dark:bg-slate-950 text-foreground">
      {user && (
        <header className="sticky top-0 z-50 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
          <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
              <div className="leading-tight min-w-0">
                <p className="font-bold text-slate-900 dark:text-white truncate">ServiceFlow</p>
                <p className="text-[11px] text-slate-500 truncate">Gestão de Operações</p>
              </div>
            </Link>
            <div className="flex items-center gap-1.5">
              <NotificationCenter />
              <UserProfileMenu />
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5 pb-24 md:pb-8">
        {children}
      </main>

      <Navbar />
    </div>
  );
};
