
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, 
  ClipboardList, 
  Users, 
  Settings, 
  Calendar,
  Plus,
  PieChart,
  Wrench
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Demandas", href: "/demandas", icon: ClipboardList },
  { name: "Calendário", href: "/calendario", icon: Calendar }, // Added calendar navigation
  { name: "Nova Demanda", href: "/nova-demanda", icon: Plus },
  { name: "Equipe", href: "/equipe", icon: Users },
  { name: "Relatórios", href: "/relatorios", icon: PieChart },
  { name: "Tipos de Serviço", href: "/tipos-servico", icon: Wrench },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const filteredNavigation = navigation.filter(item => {
    // Show calendar for all authenticated users
    if (item.href === "/calendario") return !!user;
    
    // Show team management only for admins and managers
    if (item.href === "/equipe") {
      return user?.role === 'administrador' || user?.role === 'gestor';
    }
    
    // Show service types only for admins and managers
    if (item.href === "/tipos-servico") {
      return user?.role === 'administrador' || user?.role === 'gestor';
    }
    
    return true;
  });

  return (
    <div className="flex h-full w-64 flex-col bg-card/50 backdrop-blur-sm border-r border-border/50">
      {/* Header */}
      <div className="flex h-16 items-center px-6 border-b border-border/50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          TechService
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      {user && (
        <>
          <Separator className="mx-4" />
          <div className="p-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
