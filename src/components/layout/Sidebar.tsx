// Substitua a sua lista de navegação por esta:
const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Demandas", href: "/demandas", icon: ClipboardList },
  { name: "Agenda", href: "/calendar", icon: Calendar }, // ROTA CORRIGIDA
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

  // Substitua sua lógica de filtro por esta versão mais robusta:
  const filteredNavigation = navigation.filter(item => {
    if (!user) return false; // Se não houver usuário, não mostrar nada

    const { role } = user;
    const { href } = item;

    // Itens visíveis para Administradores e Gestores
    const adminGestorRoutes = ["/equipe", "/relatorios", "/tipos-servico", "/demandas/nova"];
    if (adminGestorRoutes.includes(href)) {
      return role === 'administrador' || role === 'gestor';
    }

    // Itens que o Técnico NÃO deve ver
    const tecnicoHiddenRoutes = ["/demandas/nova"]; 
    if (tecnicoHiddenRoutes.includes(href) && role === 'tecnico') {
      return false;
    }

    // O resto é visível para todos os perfis logados (Dashboard, Demandas, Agenda, etc.)
    return true;
  });

  return (
    // O resto do seu código (a parte do return) continua igual...
    // ...
  );
};
