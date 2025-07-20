
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, FileText, Users, Settings, BarChart3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEnhancedAuth } from "@/context/EnhancedAuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const Navbar = () => {
  const location = useLocation();
  const { user } = useEnhancedAuth();
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      name: "Início",
      path: "/",
      icon: Home,
      badge: null
    },
    {
      name: "Demandas",
      path: "/demandas",
      icon: FileText,
      badge: null
    },
    {
      name: "Estatísticas",
      path: "/estatisticas",
      icon: BarChart3,
      badge: null
    },
    {
      name: "Equipe",
      path: "/equipe",
      icon: Users,
      badge: null
    },
    {
      name: "Configurações",
      path: "/settings",
      icon: Settings,
      badge: null
    }
  ];

  return (
    <nav className={`
      bg-card/95 backdrop-blur-sm border-t border-border/50
      ${isMobile 
        ? 'fixed bottom-0 left-0 right-0 z-50 h-16' 
        : 'sticky top-0 border-t-0 border-b relative'
      }
    `}>
      <div className="container mx-auto px-2 md:px-4">
        {/* Desktop Navigation */}
        {!isMobile && (
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 font-bold text-lg xl:text-xl text-primary"
            >
              <div className="w-7 h-7 xl:w-8 xl:h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground text-xs xl:text-sm font-bold">GD</span>
              </div>
              <span className="hidden sm:block text-sm xl:text-base">GerenciadorDemandas</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-1">
              {navItems.map((item) => {
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

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Link to="/nova-demanda">
                <Button size="sm" className="flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4" />
                  Nova Demanda
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Mobile Navigation - Fixed Bottom */}
        {isMobile && (
          <div className="flex justify-around items-center py-2 h-16">
            {navItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex flex-col items-center justify-center space-y-1 px-2 py-1 rounded-lg transition-all duration-200 min-w-0 flex-1
                    ${isActive(item.path)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs font-medium truncate max-w-full">
                    {item.name}
                  </span>
                </Link>
              );
            })}
            <Link to="/nova-demanda" className="flex-1 max-w-[60px]">
              <Button 
                size="sm" 
                className="flex flex-col items-center gap-1 h-auto py-2 px-2 text-xs w-full"
              >
                <Plus className="w-4 h-4" />
                <span className="text-xs leading-none">Nova</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
