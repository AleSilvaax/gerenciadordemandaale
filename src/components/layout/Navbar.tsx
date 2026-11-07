import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Users, BarChart3, Plus, Calendar, Settings, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import pactoLogo from '@/assets/pacto-logo.png';

const items = [
  { name: 'Início', path: '/', icon: Home },
  { name: 'Demandas', path: '/demandas', icon: FileText },
  { name: 'Agenda', path: '/calendar', icon: Calendar },
  { name: 'Estoque', path: '/estoque', icon: Package },
  { name: 'Análise', path: '/estatisticas', icon: BarChart3 },
  { name: 'Equipe', path: '/equipe', icon: Users },
];

const Navbar = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  if (!user) return null;
  const manager = ['super_admin', 'owner', 'administrador', 'gestor'].includes(user.role);
  const allowed = items.filter(i => manager || ['/', '/demandas', '/calendar'].includes(i.path));
  const active = (path: string) => path === '/' ? pathname === '/' : pathname.startsWith(path);
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="hidden md:flex max-w-7xl mx-auto h-16 items-center gap-3 px-4">
        <Link to="/" className="hidden xl:flex items-center gap-2 mr-4 font-bold text-foreground">
          <img src={pactoLogo} alt="" width={28} height={28} className="rounded-md" />Pacto
        </Link>
        <div className="flex flex-1 min-w-0 items-center gap-1 overflow-x-auto">
          {allowed.map(({ name, path, icon: Icon }) => (
            <Button key={path} asChild variant={active(path) ? 'secondary' : 'ghost'} size="sm" className={active(path) ? 'text-primary' : 'text-muted-foreground'}>
              <Link to={path} aria-current={active(path) ? 'page' : undefined}><Icon />{name}</Link>
            </Button>
          ))}
        </div>
        <Button asChild variant="outline" size="icon" title="Configurações"><Link to="/settings" aria-label="Configurações"><Settings /></Link></Button>
        {(manager || user.role === 'requisitor') && <Button asChild size="sm"><Link to="/nova-demanda"><Plus /><span className="hidden lg:inline">Nova demanda</span></Link></Button>}
      </div>
      <div className="flex md:hidden h-16">
        {allowed.filter(i => i.path !== '/equipe').map(({ name, path, icon: Icon }) => (
          <Button key={path} asChild variant="ghost" className={`relative flex-1 min-w-0 h-full flex-col gap-1 rounded-none px-1 ${active(path) ? 'text-primary' : 'text-muted-foreground'}`}>
            <Link to={path} aria-current={active(path) ? 'page' : undefined}>
              {active(path) && <span className="absolute top-0 h-0.5 w-8 bg-primary" />}
              <Icon className="!h-5 !w-5" /><span className="text-xs">{name}</span>
            </Link>
          </Button>
        ))}
      </div>
    </nav>
  );
};
export default Navbar;