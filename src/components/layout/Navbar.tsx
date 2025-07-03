
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, FileText, Plus, BarChart3, Settings, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: FileText, label: "Demandas", href: "/demandas" },
  { icon: Plus, label: "Nova", href: "/nova-demanda" },
  { icon: Users, label: "Equipe", href: "/equipe" },
  { icon: BarChart3, label: "Estatísticas", href: "/estatisticas" },
  { icon: Settings, label: "Config", href: "/configuracoes" },
];

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isMobile = useIsMobile();

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      isMobile ? "pb-safe" : ""
    )}>
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link key={item.href} to={item.href}>
              <div className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}>
                <Icon className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-xs font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
