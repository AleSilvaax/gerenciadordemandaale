
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, FileText, Users, Settings, BarChart3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();

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
    <nav className="bg-card/95 backdrop-blur-sm border-t border-border/50 navbar-mobile-fixed md:sticky md:top-0 md:bottom-auto md:border-t-0 md:border-b md:relative">
      <div className="container mx-auto px-4">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 font-bold text-xl text-primary"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">GD</span>
            </div>
            <span className="hidden sm:block">GerenciadorDemandas</span>
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
                    flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200
                    ${isActive(item.path)
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.name}</span>
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
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nova Demanda
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation - Fixed Bottom */}
        <div className="md:hidden">
          <div className="flex justify-around items-center py-2 bg-card/95 backdrop-blur-sm">
            {navItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex flex-col items-center space-y-1 px-2 py-2 rounded-lg transition-all duration-200 min-w-0
                    ${isActive(item.path)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs font-medium truncate max-w-[60px]">{item.name}</span>
                </Link>
              );
            })}
            <Link to="/nova-demanda">
              <Button size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3">
                <Plus className="w-5 h-5" />
                <span className="text-xs">Nova</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
