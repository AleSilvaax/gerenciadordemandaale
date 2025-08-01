
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
    Home, 
    FileText, 
    Users, 
    BarChart3, 
    Plus,
    Calendar,
    Search,
    Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { name: "Início", path: "/", icon: Home, badge: null },
    { name: "Demandas", path: "/demandas", icon: FileText, badge: null },
    { name: "Agenda", path: "/calendar", icon: Calendar, badge: null },
    { name: "Análise", path: "/estatisticas", icon: BarChart3, badge: null },
    { name: "Equipe", path: "/equipe", icon: Users, badge: null },
  ];
  
  const filteredNavItems = navItems.filter(item => {
    if (!user) return false;
    const { role } = user;
    if (["/estatisticas", "/equipe"].includes(item.path)) {
      return ['super_admin', 'owner', 'administrador', 'gestor'].includes(role);
    }
    return true;
  });

  return (
    <nav className={`
      fixed bottom-0 left-0 right-0 z-50 h-16
      bg-card/95 backdrop-blur-sm border-t border-border/50
    `}>
      <div className="container mx-auto px-2 md:px-4">
        {/* Desktop Navigation */}
        {!isMobile && (
          <div className="flex items-center justify-between h-16">
            <Link 
              to="/" 
              className="flex items-center space-x-2 font-bold text-lg xl:text-xl text-primary"
            >
              <div className="w-7 h-7 xl:w-8 xl:h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground text-xs xl:text-sm font-bold">GD</span>
              </div>
              <span className="hidden sm:block text-sm xl:text-base">GerenciadorDemandas</span>
            </Link>

            <div className="flex items-center space-x-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center space-x-2 px-2 xl:px-3 py-2 rounded-lg transition-all duration-200 text-sm
                      ${isActive(item.path)
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.name}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center space-x-2">
              <Link to="/buscar">
                <Button variant="ghost" size="sm" className="p-2">
                  <Search className="w-4 h-4" />
                </Button>
              </Link>
              
              <Link to="/configurar">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span className="hidden lg:block">Configurar</span>
                </Button>
              </Link>
              
              {user && ['super_admin', 'owner', 'administrador', 'gestor'].includes(user.role) && (
                <Link to="/nova-demanda">
                  <Button size="sm" className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span className="hidden lg:block">Nova Demanda</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {isMobile && (
          <div className="flex justify-around items-center h-16">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 min-w-0 relative
                    ${isActive(item.path)
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="w-6 h-6 flex-shrink-0" />
                  {isActive(item.path) && (
                    <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
            
            {/* Buscar - Mobile */}
            <Link
              to="/buscar"
              className={`
                flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 min-w-0 relative
                ${isActive("/buscar")
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Search className="w-6 h-6 flex-shrink-0" />
              {isActive("/buscar") && (
                <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>

            {/* Configurações - Mobile */}
            <Link
              to="/configurar"
              className={`
                flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 min-w-0 relative
                ${isActive("/configurar")
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Settings className="w-6 h-6 flex-shrink-0" />
              {isActive("/configurar") && (
                <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
