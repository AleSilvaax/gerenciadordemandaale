
import React from "react";
import { Navbar } from "./Navbar";
import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export const AppLayout: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      <main className={`flex-1 ${isMobile ? 'pb-20' : 'pb-16'} overflow-y-auto overflow-x-hidden scrollbar-none`}>
        <div className="pt-2 min-w-full">
          <Outlet />
        </div>
      </main>
      <Navbar />
    </div>
  );
};
