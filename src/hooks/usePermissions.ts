
import { useOptimizedAuth } from '@/context/OptimizedAuthContext';
import { hasPermission, canAccessRoute, hasRoleOrHigher, getCurrentUserEffectiveRole, canManageUser, canViewOrganization } from '@/services/permissionService';

export const usePermissions = () => {
  const { user } = useOptimizedAuth();
  
  return {
    user,
    hasPermission,
    canAccessRoute,
    hasRoleOrHigher,
    getCurrentUserEffectiveRole,
    canManageUser,
    canViewOrganization,
    
    // Shortcuts para verificações comuns
    isSuperAdmin: () => user?.role === 'administrador',
    isOwner: () => user?.role === 'administrador',
    isAdmin: () => ['administrador'].includes(user?.role || ''),
    isManager: () => ['administrador', 'gestor'].includes(user?.role || ''),
    
    // Verificações específicas de funcionalidades
    canManageOrganizations: () => user?.role === 'administrador',
    canManageUsers: () => ['administrador'].includes(user?.role || ''),
    canManageTeams: () => ['administrador'].includes(user?.role || ''),
    canCreateInvites: () => ['administrador', 'gestor'].includes(user?.role || ''),
    canEditServices: () => ['administrador', 'gestor'].includes(user?.role || ''),
    canViewAllServices: () => ['administrador'].includes(user?.role || ''),
  };
};
