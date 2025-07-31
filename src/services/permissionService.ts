import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'super_admin' | 'owner' | 'administrador' | 'gestor' | 'tecnico' | 'requisitor';

export interface Permission {
  action: string;
  resource: string;
  scope: 'system' | 'organization' | 'team' | 'self';
}

// Definição da hierarquia de roles e suas permissões
const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  'super_admin': ['super_admin', 'owner', 'administrador', 'gestor', 'tecnico', 'requisitor'],
  'owner': ['owner', 'administrador', 'gestor', 'tecnico', 'requisitor'],
  'administrador': ['administrador', 'gestor', 'tecnico', 'requisitor'],
  'gestor': ['gestor', 'tecnico', 'requisitor'],
  'tecnico': ['tecnico'],
  'requisitor': ['requisitor']
};

// Permissões específicas por role
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  'super_admin': [
    { action: 'manage', resource: 'organizations', scope: 'system' },
    { action: 'manage', resource: 'users', scope: 'system' },
    { action: 'view', resource: 'all_data', scope: 'system' },
    { action: 'manage', resource: 'system_settings', scope: 'system' }
  ],
  'owner': [
    { action: 'manage', resource: 'organization', scope: 'organization' },
    { action: 'manage', resource: 'teams', scope: 'organization' },
    { action: 'manage', resource: 'users', scope: 'organization' },
    { action: 'view', resource: 'all_services', scope: 'organization' },
    { action: 'manage', resource: 'invites', scope: 'organization' }
  ],
  'administrador': [
    { action: 'manage', resource: 'teams', scope: 'organization' },
    { action: 'manage', resource: 'users', scope: 'organization' },
    { action: 'view', resource: 'all_services', scope: 'organization' },
    { action: 'manage', resource: 'services', scope: 'organization' },
    { action: 'manage', resource: 'invites', scope: 'organization' }
  ],
  'gestor': [
    { action: 'manage', resource: 'team', scope: 'team' },
    { action: 'view', resource: 'team_services', scope: 'team' },
    { action: 'manage', resource: 'team_services', scope: 'team' },
    { action: 'invite', resource: 'users', scope: 'team' }
  ],
  'tecnico': [
    { action: 'view', resource: 'assigned_services', scope: 'self' },
    { action: 'update', resource: 'assigned_services', scope: 'self' },
    { action: 'view', resource: 'team', scope: 'team' }
  ],
  'requisitor': [
    { action: 'create', resource: 'services', scope: 'self' },
    { action: 'view', resource: 'own_services', scope: 'self' }
  ]
};

// Verificar se usuário tem permissão específica
export const hasPermission = async (
  action: string, 
  resource: string, 
  scope: 'system' | 'organization' | 'team' | 'self' = 'self'
): Promise<boolean> => {
  try {
    const role = await getCurrentUserEffectiveRole();
    
    // Super admin sempre tem todas as permissões
    if (role === 'super_admin') return true;
    
    const userPermissions = ROLE_PERMISSIONS[role as UserRole] || [];
    
    return userPermissions.some(permission => 
      permission.action === action && 
      permission.resource === resource && 
      (permission.scope === scope || permission.scope === 'system')
    );
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    return false;
  }
};

// Verificar se usuário pode acessar rota específica
export const canAccessRoute = async (route: string): Promise<boolean> => {
  try {
    const role = await getCurrentUserEffectiveRole();
    
    // Mapeamento de rotas para permissões necessárias
    const routePermissions: Record<string, { action: string; resource: string; scope: any }> = {
      '/admin/system': { action: 'manage', resource: 'organizations', scope: 'system' },
      '/admin/organization': { action: 'manage', resource: 'organization', scope: 'organization' },
      '/settings/team-management': { action: 'manage', resource: 'teams', scope: 'organization' },
      '/settings/invites': { action: 'manage', resource: 'invites', scope: 'organization' },
      '/equipe': { action: 'view', resource: 'team', scope: 'team' },
      '/estatisticas': { action: 'view', resource: 'all_services', scope: 'organization' },
      '/settings': { action: 'view', resource: 'settings', scope: 'self' }
    };

    const permission = routePermissions[route];
    if (!permission) return true; // Rota não restrita
    
    return hasPermission(permission.action, permission.resource, permission.scope);
  } catch (error) {
    console.error('Erro ao verificar acesso à rota:', error);
    return false;
  }
};

// Verificar se usuário tem role igual ou superior
export const hasRoleOrHigher = async (requiredRole: UserRole): Promise<boolean> => {
  try {
    const userRole = await getCurrentUserEffectiveRole();
    const allowedRoles = ROLE_HIERARCHY[userRole as UserRole] || [];
    
    return allowedRoles.includes(requiredRole);
  } catch (error) {
    console.error('Erro ao verificar hierarquia de role:', error);
    return false;
  }
};

// Obter role efetivo do usuário atual
export const getCurrentUserEffectiveRole = async (): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('get_effective_user_role');
    if (error) throw error;
    
    return data || 'tecnico';
  } catch (error) {
    console.error('Erro ao obter role efetivo:', error);
    return 'tecnico';
  }
};

// Verificar se pode gerenciar usuário específico
export const canManageUser = async (targetUserId: string): Promise<boolean> => {
  try {
    const currentRole = await getCurrentUserEffectiveRole();
    
    // Super admin pode gerenciar qualquer um
    if (currentRole === 'super_admin') return true;
    
    // Obter informações do usuário alvo
    const { data: targetUser, error } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', targetUserId)
      .single();
      
    if (error) throw error;
    
    // Verificar se está na mesma organização
    const { data: currentOrgId } = await supabase.rpc('get_current_user_organization_id');
    
    if (targetUser.organization_id !== currentOrgId) return false;
    
    // Owner e admin podem gerenciar usuários da organização
    return ['owner', 'administrador'].includes(currentRole);
  } catch (error) {
    console.error('Erro ao verificar se pode gerenciar usuário:', error);
    return false;
  }
};

// Verificar se pode ver dados de organização específica
export const canViewOrganization = async (organizationId: string): Promise<boolean> => {
  try {
    const currentRole = await getCurrentUserEffectiveRole();
    
    // Super admin pode ver qualquer organização
    if (currentRole === 'super_admin') return true;
    
    // Verificar se é da mesma organização
    const { data: currentOrgId } = await supabase.rpc('get_current_user_organization_id');
    
    return currentOrgId === organizationId;
  } catch (error) {
    console.error('Erro ao verificar acesso à organização:', error);
    return false;
  }
};

// Obter organizações que o usuário pode ver
export const getAccessibleOrganizations = async (): Promise<string[]> => {
  try {
    const currentRole = await getCurrentUserEffectiveRole();
    
    // Super admin pode ver todas as organizações
    if (currentRole === 'super_admin') {
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .eq('is_active', true);
        
      if (error) throw error;
      return data.map(org => org.id);
    }
    
    // Outros roles só veem sua própria organização
    const { data: currentOrgId } = await supabase.rpc('get_current_user_organization_id');
    return currentOrgId ? [currentOrgId] : [];
  } catch (error) {
    console.error('Erro ao obter organizações acessíveis:', error);
    return [];
  }
};

// Utilitários para componentes React
export const usePermissions = () => {
  return {
    hasPermission,
    canAccessRoute,
    hasRoleOrHigher,
    getCurrentUserEffectiveRole,
    canManageUser,
    canViewOrganization
  };
};