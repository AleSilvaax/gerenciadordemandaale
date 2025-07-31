import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrganizationManagement } from '@/components/admin/OrganizationManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { InviteManagement } from '@/components/admin/InviteManagement';
import { Users, Building2, Mail, Settings } from 'lucide-react';

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
    </div>
  );
}