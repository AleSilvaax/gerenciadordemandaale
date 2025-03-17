import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { List, Home, FileText, BarChart2, Users, User, LogOut } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/providers/AuthProvider";

const menuItems = [
  { icon: Home, label: "Início", path: "/" },
  { icon: FileText, label: "Demandas", path: "/demandas" },
  { icon: BarChart2, label: "Estatísticas", path: "/estatisticas" },
  { icon: Users, label: "Equipe", path: "/equipe" },
];

export const Navbar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="fixed bottom-0 w-full md:w-auto md:static z-10">
      {isMobile ? (
        <div className="bg-background border-t border-white/10 p-1">
          <div className="flex justify-between px-6 py-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center text-xs p-2 rounded-lg transition-colors",
                  location.pathname === item.path
                    ? "text-primary"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                <item.icon className="mb-1" size={18} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="fixed left-0 top-0 h-screen w-20 bg-background border-r border-white/10 flex flex-col items-center py-6">
          <Link to="/" className="mb-6">
            <TeamMemberAvatar 
              src={user?.avatar || ""} 
              name={user?.name || "Usuário"} 
              size="md" 
            />
          </Link>

          <div className="flex-1 flex flex-col items-center space-y-4 mt-4">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-16 rounded-lg text-xs transition-colors",
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="mb-1" size={22} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="mt-auto">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center justify-center w-16 h-16 rounded-lg text-xs text-muted-foreground hover:bg-white/5 hover:text-white transition-colors">
                <div className="flex flex-col items-center">
                  <List size={22} className="mb-1" />
                  <span>Menu</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </nav>
  );
};
