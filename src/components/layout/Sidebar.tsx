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
import { Separator } from "@/components/ui/separator";

// Array de navegação corrigido e completo
const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Demandas", href: "/demandas", icon: ClipboardList },
  { name: "Agenda", href: "/calendar", icon: Calendar },
  { name: "Nova Demanda", href: "/demandas/nova", icon: Plus },
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

  // Lógica de filtro corrigida
  const filteredNavigation = navigation.filter(item => {
    if (!user) return false;

    const { role } = user;
    const { href } = item;

    const adminGestorRoutes = ["/equipe", "/relatorios", "/tipos-servico", "/demandas/nova"];
    if (adminGestorRoutes.includes(href)) {
      return role === 'administrador' || role === 'gestor';
    }
    
    const tecnicoHiddenRoutes = ["/demandas/nova"]; 
    if (tecnicoHiddenRoutes.includes(href) && role === 'tecnico') {
      return false;
    }

    return true;
  });

  // PARTE VISUAL (JSX) RESTAURADA
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
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.name || 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.role || 'tecnico'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
