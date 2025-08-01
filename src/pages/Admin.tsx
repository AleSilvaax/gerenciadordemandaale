import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrganizationManagement } from '@/components/admin/OrganizationManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { InviteManagement } from '@/components/admin/InviteManagement';
import { Users, Building2, Mail, Settings, FileText, Search } from 'lucide-react';

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('organizations');

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  // Verificar se o usuário tem permissão (super_admin, administrador ou gestor)
  if (!user || !['super_admin', 'administrador', 'gestor'].includes(user.role)) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p>Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Administração</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="organizations" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Organizações</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="invites" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Convites</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Organizações</CardTitle>
              <CardDescription>
                Criar, editar e gerenciar organizações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Usuários</CardTitle>
              <CardDescription>
                Visualizar e gerenciar usuários e suas permissões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Convites</CardTitle>
              <CardDescription>
                Enviar convites e gerenciar convites pendentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Acesso Rápido</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            to="/relatorios"
            className="flex flex-col items-center p-4 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors border border-blue-500/20"
          >
            <FileText className="w-6 h-6 text-blue-500 mb-2" />
            <span className="text-sm font-medium">Relatórios</span>
          </Link>
          
          <Link 
            to="/tipos-servico"
            className="flex flex-col items-center p-4 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors border border-green-500/20"
          >
            <Settings className="w-6 h-6 text-green-500 mb-2" />
            <span className="text-sm font-medium">Tipos de Serviço</span>
          </Link>
          
          <Link 
            to="/buscar"
            className="flex flex-col items-center p-4 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors border border-purple-500/20"
          >
            <Search className="w-6 h-6 text-purple-500 mb-2" />
            <span className="text-sm font-medium">Buscar</span>
          </Link>
          
          <Link 
            to="/equipe"
            className="flex flex-col items-center p-4 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 transition-colors border border-orange-500/20"
          >
            <Users className="w-6 h-6 text-orange-500 mb-2" />
            <span className="text-sm font-medium">Equipe</span>
          </Link>
        </div>
      </div>
    </div>
  );
}