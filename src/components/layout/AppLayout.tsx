
import React from "react";
import { Navbar } from "./Navbar";
import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export const AppLayout: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      <main className={`flex-1 ${isMobile ? 'pb-24' : 'pb-20'} overflow-y-auto scrollbar-none`}>
        <div className="pt-2">
          <Outlet />
        </div>
      </main>
      <Navbar />
    </div>
  );
};
