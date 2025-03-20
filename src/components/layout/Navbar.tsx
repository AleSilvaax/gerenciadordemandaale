
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, FileText, BarChart2, Users } from "lucide-react";

export const Navbar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-secondary backdrop-blur-md border-t border-white/10 z-10">
      <div className="flex justify-around items-center py-3 px-2 max-w-md mx-auto">
        <Link 
          to="/" 
          className={`flex flex-col items-center space-y-1 transition-all duration-300 ${isActive("/") ? "text-primary" : "text-muted-foreground"}`}
        >
          <Home size={20} />
          <span className="text-xs">Home</span>
        </Link>
        
        <Link 
          to="/demandas" 
          className={`flex flex-col items-center space-y-1 transition-all duration-300 ${isActive("/demandas") ? "text-primary" : "text-muted-foreground"}`}
        >
          <FileText size={20} />
          <span className="text-xs">Demandas</span>
        </Link>
        
        <Link 
          to="/estatisticas" 
          className={`flex flex-col items-center space-y-1 transition-all duration-300 ${isActive("/estatisticas") ? "text-primary" : "text-muted-foreground"}`}
        >
          <BarChart2 size={20} />
          <span className="text-xs">Estatísticas</span>
        </Link>
        
        <Link 
          to="/equipe" 
          className={`flex flex-col items-center space-y-1 transition-all duration-300 ${isActive("/equipe") ? "text-primary" : "text-muted-foreground"}`}
        >
          <Users size={20} />
          <span className="text-xs">Equipe</span>
        </Link>
      </div>
    </nav>
  );
};
