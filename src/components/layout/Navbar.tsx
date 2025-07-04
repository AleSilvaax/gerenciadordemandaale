
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
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
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
                <Button size="sm" className="hidden sm:flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nova Demanda
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Fixed Bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border/50">
        <div className="px-2 py-2">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex flex-col items-center justify-center space-y-1 px-2 py-2 rounded-lg transition-all duration-200 flex-1 min-w-0
                    ${isActive(item.path)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs font-medium truncate w-full text-center leading-tight">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile FAB for New Demand */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <Link to="/nova-demanda">
          <Button size="sm" className="rounded-full shadow-lg h-12 w-12 p-0">
            <Plus className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </>
  );
};

export default Navbar;
