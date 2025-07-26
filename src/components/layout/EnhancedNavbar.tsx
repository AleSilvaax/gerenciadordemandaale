import React from 'react';
import {
  Home,
  Plus,
  FileText,
  Search,
  Settings,
  Users,
  BarChart3,
  Calendar
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOptimizedAuth } from '@/context/OptimizedAuthContext';
import { useMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from '@/lib/utils';

export const EnhancedNavbar: React.FC = () => {
  const { user, logout, canAccessRoute } = useOptimizedAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMobile();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: Home, 
      roles: ['tecnico', 'gestor', 'administrador'] 
    },
    { 
      name: 'Nova Demanda', 
      path: '/nova-demanda', 
      icon: Plus, 
      roles: ['gestor', 'administrador'] 
    },
    { 
      name: 'Demandas', 
      path: '/demandas', 
      icon: FileText, 
      roles: ['tecnico', 'gestor', 'administrador'] 
    },
    { 
      name: 'Buscar', 
      path: '/buscar', 
      icon: Search, 
      roles: ['tecnico', 'gestor', 'administrador'] 
    },
    { 
      name: 'Calendário', 
      path: '/calendar', 
      icon: Calendar, 
      roles: ['tecnico', 'gestor', 'administrador'] 
    },
    { 
      name: 'Estatísticas', 
      path: '/estatisticas', 
      icon: BarChart3, 
      roles: ['gestor', 'administrador'] 
    },
    { 
      name: 'Equipe', 
      path: '/equipe', 
      icon: Users, 
      roles: ['gestor', 'administrador'] 
    },
    { 
      name: 'Configurações', 
      path: '/settings', 
      icon: Settings, 
      roles: ['gestor', 'administrador'] 
    }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    return item.roles.includes(user?.role || '');
  }).filter(item => canAccessRoute ? canAccessRoute(item.path) : true);

  return (
    <nav className="bg-background/90 backdrop-blur-md border-b border-border/40 fixed top-0 left-0 w-full z-40">
      <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <span className="font-bold text-xl">
          Gerenciador<span className="text-primary">Demandas</span>
        </span>

        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="relative rounded-full h-8 w-8">
                <Avatar className="h-8 w-8">
                  {user?.avatar ? (
                    <AvatarImage src={user.avatar} alt={user?.name} />
                  ) : (
                    <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-3/4 sm:w-2/3 md:w-1/2">
              <SheetHeader className="text-left">
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>
                  Navegue pelo sistema
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                {filteredMenuItems.map(item => (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className={cn(
                      "justify-start",
                      isActive(item.path) ? "text-primary" : "text-foreground"
                    )}
                    onClick={() => navigate(item.path)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                ))}
                <Button variant="destructive" className="justify-start" onClick={handleLogout}>
                  Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {filteredMenuItems.map(item => (
                <Button
                  key={item.name}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    isActive(item.path) ? "text-primary" : "text-foreground"
                  )}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              ))}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative rounded-full h-8 w-8">
                  <Avatar className="h-8 w-8">
                    {user?.avatar ? (
                      <AvatarImage src={user.avatar} alt={user?.name} />
                    ) : (
                      <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </nav>
  );
};
