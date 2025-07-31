// Arquivo: src/components/layout/Navbar.tsx (VERSÃO CORRIGIDA)

import React from "react";
import { NavLink } from "react-router-dom";
import { Home, ListChecks, PlusCircle, BarChart2, Users, Calendar } from "lucide-react";
// ✅ ALTERAÇÃO: Trocamos para o hook de autenticação correto
import { useOptimizedAuth } from "@/context/OptimizedAuthContext";

const Navbar: React.FC = () => {
  // ✅ ALTERAÇÃO: Usamos o hook correto
  const { user } = useOptimizedAuth();

  if (!user) {
    return null; // Não renderiza a navbar se não houver usuário
  }

  const navItems = [
    { to: "/", icon: <Home size={22} />, label: "Início" },
    { to: "/demandas", icon: <ListChecks size={22} />, label: "Demandas" },
    { to: "/nova-demanda", icon: <PlusCircle size={28} />, label: "Adicionar" },
    { to: "/estatisticas", icon: <BarChart2 size={22} />, label: "Gráficos" },
    { to: "/equipe", icon: <Users size={22} />, label: "Equipe" },
  ];

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center space-y-1 transition-colors duration-200 ${
      isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-primary"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden h-16 bg-card/80 backdrop-blur-sm border-t border-border/50 shadow-t-lg z-50">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink to={item.to} key={item.to} className={getNavLinkClass}>
            {item.icon}
            {item.to === "/nova-demanda" ? null : (
              <span className="text-xs font-medium">{item.label}</span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
