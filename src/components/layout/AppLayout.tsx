
import React from "react";
import { Navbar } from "./Navbar";
import { Outlet } from "react-router-dom";

export const AppLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      <main className="flex-1 pb-20 overflow-y-auto scrollbar-none">
        <Outlet />
      </main>
      <Navbar />
    </div>
  );
};
