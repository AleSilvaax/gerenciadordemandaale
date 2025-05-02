
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, FileText, BarChart2, Users, Settings, LogOut, UsersRound } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";
import { TeamMemberAvatar } from "../ui-custom/TeamMemberAvatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, logout, hasPermission } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-secondary/90 backdrop-blur-md border-t border-white/10 z-10 h-16 md:h-14">
      {isMobile ? (
        <ScrollArea className="w-full h-full">
          <div className="flex justify-between items-center py-2 px-4 w-max min-w-full h-full">
            <div className="flex items-center space-x-6">
              <Link 
                to="/" 
                className={`flex flex-col items-center space-y-1 transition-all duration-300 ${isActive("/") ? "text-primary" : "text-muted-foreground"}`}
              >
                <Home size={18} />
                <span className="text-xs">Home</span>
              </Link>
              
              <Link 
                to="/demandas" 
                className={`flex flex-col items-center space-y-1 transition-all duration-300 ${isActive("/demandas") ? "text-primary" : "text-muted-foreground"}`}
              >
                <FileText size={18} />
                <span className="text-xs">Demandas</span>
              </Link>
              
              <Link 
                to="/gerenciar-equipe" 
                className={`flex flex-col items-center space-y-1 transition-all duration-300 ${isActive("/gerenciar-equipe") ? "text-primary" : "text-muted-foreground"}`}
              >
                <UsersRound size={18} />
                <span className="text-xs">Equipe</span>
              </Link>
              
              {hasPermission('view_stats') && (
                <Link 
                  to="/estatisticas" 
                  className={`flex flex-col items-center space-y-1 transition-all duration-300 ${isActive("/estatisticas") ? "text-primary" : "text-muted-foreground"}`}
                >
                  <BarChart2 size={18} />
                  <span className="text-xs">Estatísticas</span>
                </Link>
              )}
              
              {hasPermission('add_members') && (
                <Link 
                  to="/equipe" 
                  className={`flex flex-col items-center space-y-1 transition-all duration-300 ${isActive("/equipe") ? "text-primary" : "text-muted-foreground"}`}
                >
                  <Users size={18} />
                  <span className="text-xs">Membros</span>
                </Link>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-1">
                  <TeamMemberAvatar 
                    src={user?.avatar || ""} 
                    name={user?.name || ""}
                    size="sm"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ScrollArea>
      ) : (
        <div className="flex justify-between items-center h-full py-2 px-4 max-w-7xl mx-auto">
          <div className="flex items-center space-x-8">
            <Link 
              to="/" 
              className={`flex items-center space-x-1 transition-all duration-300 ${isActive("/") ? "text-primary" : "text-muted-foreground"}`}
            >
              <Home size={20} />
              <span className="text-sm">Home</span>
            </Link>
            
            <Link 
              to="/demandas" 
              className={`flex items-center space-x-1 transition-all duration-300 ${isActive("/demandas") ? "text-primary" : "text-muted-foreground"}`}
            >
              <FileText size={20} />
              <span className="text-sm">Demandas</span>
            </Link>
            
            <Link 
              to="/gerenciar-equipe" 
              className={`flex items-center space-x-1 transition-all duration-300 ${isActive("/gerenciar-equipe") ? "text-primary" : "text-muted-foreground"}`}
            >
              <UsersRound size={20} />
              <span className="text-sm">Equipe</span>
            </Link>
            
            {hasPermission('view_stats') && (
              <Link 
                to="/estatisticas" 
                className={`flex items-center space-x-1 transition-all duration-300 ${isActive("/estatisticas") ? "text-primary" : "text-muted-foreground"}`}
              >
                <BarChart2 size={20} />
                <span className="text-sm">Estatísticas</span>
              </Link>
            )}
            
            {hasPermission('add_members') && (
              <Link 
                to="/equipe" 
                className={`flex items-center space-x-1 transition-all duration-300 ${isActive("/equipe") ? "text-primary" : "text-muted-foreground"}`}
              >
                <Users size={20} />
                <span className="text-sm">Membros</span>
              </Link>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-2 hover:bg-primary/10 rounded-full p-1 px-3 transition-colors">
                <TeamMemberAvatar 
                  src={user?.avatar || ""} 
                  name={user?.name || ""}
                  size="sm"
                />
                <span className="hidden md:inline-block">{user?.name}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </nav>
  );
};
