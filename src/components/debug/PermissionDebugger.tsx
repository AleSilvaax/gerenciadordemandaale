import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Shield, Users, Building, Settings, FileText, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function PermissionDebugger() {
  const { user } = useAuth();
  const permissions = usePermissions();
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const runPermissionTests = async () => {
    if (!user) return;
    
    setLoading(true);
    const results: Record<string, any> = {};

    try {
      // Teste 1: Verificar role efetivo
      const { data: effectiveRole } = await supabase.rpc('get_effective_user_role');
      results.effectiveRole = effectiveRole;

      // Teste 2: Verificar se é super admin
      const { data: isSuperAdmin } = await supabase.rpc('is_super_admin');
      results.isSuperAdmin = isSuperAdmin;

      // Teste 3: Verificar organização atual
      const { data: orgId } = await supabase.rpc('get_current_user_organization_id');
      results.currentOrgId = orgId;

      // Teste 4: Verificar permissões específicas
      results.canManageOrganizations = await permissions.hasPermission('manage', 'organizations', 'system');
      results.canManageUsers = await permissions.hasPermission('manage', 'users', 'organization');
      results.canViewAllServices = await permissions.hasPermission('view', 'all_services', 'organization');
      results.canEditServices = await permissions.hasPermission('manage', 'services', 'organization');

      // Teste 5: Verificar acesso a rotas
      results.canAccessAdmin = await permissions.canAccessRoute('/admin/system');
      results.canAccessSettings = await permissions.canAccessRoute('/settings/team-management');

      // Teste 6: Buscar dados de usuários (teste de filtro organizacional)
      const { data: usersTest, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, organization_id')
        .limit(5);
      
      results.usersTest = {
        count: usersTest?.length || 0,
        error: usersError?.message,
        sampleUser: usersTest?.[0]
      };

      // Teste 7: Buscar dados de serviços
      const { data: servicesTest, error: servicesError } = await supabase
        .from('services')
        .select('id, title, organization_id')
        .limit(5);
      
      results.servicesTest = {
        count: servicesTest?.length || 0,
        error: servicesError?.message,
        sampleService: servicesTest?.[0]
      };

    } catch (error) {
      console.error('Erro nos testes de permissão:', error);
      results.error = error.message;
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      runPermissionTests();
    }
  }, [user]);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Debug de Permissões</CardTitle>
          <CardDescription>Usuário não logado</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Debug de Permissões
          </CardTitle>
          <CardDescription>
            Informações detalhadas sobre o usuário atual e suas permissões
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runPermissionTests} disabled={loading}>
            {loading ? 'Testando...' : 'Executar Testes'}
          </Button>
        </CardContent>
      </Card>

      {/* Informações do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Informações do Usuário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Nome:</strong> {user.name}
            </div>
            <div>
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>Role (Context):</strong> 
              <Badge variant="outline" className="ml-2">{user.role}</Badge>
            </div>
            <div>
              <strong>Role Efetivo (DB):</strong> 
              <Badge variant="outline" className="ml-2">
                {testResults.effectiveRole || 'Carregando...'}
              </Badge>
            </div>
            <div>
              <strong>Organização:</strong> {user.organizationId || 'N/A'}
            </div>
            <div>
              <strong>Equipe:</strong> {user.teamId || 'N/A'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status de Permissões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Status de Permissões
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span>Super Admin:</span>
              <Badge variant={testResults.isSuperAdmin ? 'default' : 'secondary'}>
                {testResults.isSuperAdmin ? 'Sim' : 'Não'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Gerenciar Organizações:</span>
              <Badge variant={testResults.canManageOrganizations ? 'default' : 'secondary'}>
                {testResults.canManageOrganizations ? 'Sim' : 'Não'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Gerenciar Usuários:</span>
              <Badge variant={testResults.canManageUsers ? 'default' : 'secondary'}>
                {testResults.canManageUsers ? 'Sim' : 'Não'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Ver Todos Serviços:</span>
              <Badge variant={testResults.canViewAllServices ? 'default' : 'secondary'}>
                {testResults.canViewAllServices ? 'Sim' : 'Não'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Editar Serviços:</span>
              <Badge variant={testResults.canEditServices ? 'default' : 'secondary'}>
                {testResults.canEditServices ? 'Sim' : 'Não'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Acesso Admin:</span>
              <Badge variant={testResults.canAccessAdmin ? 'default' : 'secondary'}>
                {testResults.canAccessAdmin ? 'Sim' : 'Não'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testes de Acesso a Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Testes de Acesso a Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {testResults.usersTest && (
            <div>
              <strong>Usuários Visíveis:</strong>
              <div className="ml-4 mt-2">
                <div>Quantidade: {testResults.usersTest.count}</div>
                {testResults.usersTest.error && (
                  <div className="text-red-600">Erro: {testResults.usersTest.error}</div>
                )}
                {testResults.usersTest.sampleUser && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Exemplo: {testResults.usersTest.sampleUser.name} 
                    (Org: {testResults.usersTest.sampleUser.organization_id})
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {testResults.servicesTest && (
            <div>
              <strong>Serviços Visíveis:</strong>
              <div className="ml-4 mt-2">
                <div>Quantidade: {testResults.servicesTest.count}</div>
                {testResults.servicesTest.error && (
                  <div className="text-red-600">Erro: {testResults.servicesTest.error}</div>
                )}
                {testResults.servicesTest.sampleService && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Exemplo: {testResults.servicesTest.sampleService.title}
                    (Org: {testResults.servicesTest.sampleService.organization_id})
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {testResults.error && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Erro nos Testes</CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-sm">{testResults.error}</code>
          </CardContent>
        </Card>
      )}
    </div>
  );
}