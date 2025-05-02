
import React from "react";
import { Navbar } from "./Navbar";
import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

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
      <main className={`flex-1 ${isMobile ? 'pb-28' : 'pb-24'} overflow-y-auto overflow-x-hidden scrollbar-none`}>
        <div className="pt-2 min-w-full">
          <Outlet />
        </div>
      </main>
      <Navbar />
    </div>
  );
};
