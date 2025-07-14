
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Home, FileText, Plus, BarChart3, Settings, Users, Calendar } from 'lucide-react';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  roles: string[];
}

const Navbar: React.FC = () => {
  const isMobile = useIsMobile();
  const location = useLocation();

  const navItems: NavItem[] = [
    { to: '/', icon: Home, label: 'Início', roles: ['administrador', 'gestor', 'tecnico'] },
    { to: '/demandas', icon: FileText, label: 'Demandas', roles: ['administrador', 'gestor', 'tecnico'] },
    { to: '/minhas-demandas', icon: Calendar, label: 'Minhas', roles: ['tecnico'] },
    { to: '/nova-demanda', icon: Plus, label: 'Nova', roles: ['administrador', 'gestor'] },
    { to: '/estatisticas', icon: BarChart3, label: 'Stats', roles: ['administrador', 'gestor'] },
    { to: '/equipe', icon: Users, label: 'Equipe', roles: ['administrador', 'gestor'] },
    { to: '/settings', icon: Settings, label: 'Config', roles: ['administrador', 'gestor', 'tecnico'] },
  ];

  if (!isMobile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border/50 z-50">
      <div className="flex justify-around items-center py-2 px-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || 
            (to !== '/' && location.pathname.startsWith(to));
          
          return (
            <Link
              key={to}
              to={to}
              className={`
                flex flex-col items-center justify-center py-2 px-1 min-w-0 flex-1
                transition-colors duration-200 rounded-lg mx-0.5
                ${isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
              `}
            >
              <Icon size={20} className="mb-1 flex-shrink-0" />
              <span className="text-xs font-medium truncate max-w-full">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
