import { useEnhancedAuth } from '@/context/EnhancedAuthContext';
import { hasPermission, canAccessRoute, hasRoleOrHigher, getCurrentUserEffectiveRole, canManageUser, canViewOrganization } from '@/services/permissionService';

export const usePermissions = () => {
  const { user } = useEnhancedAuth();
  
  return {
    user,
    hasPermission,
    canAccessRoute,
    hasRoleOrHigher,
    getCurrentUserEffectiveRole,
    canManageUser,
    canViewOrganization,
    
    // Shortcuts para verificações comuns
    isSuperAdmin: () => user?.role === 'super_admin',
    isOwner: () => user?.role === 'owner',
    isAdmin: () => ['super_admin', 'owner', 'administrador'].includes(user?.role || ''),
    isManager: () => ['super_admin', 'owner', 'administrador', 'gestor'].includes(user?.role || ''),
    
    // Verificações específicas de funcionalidades
    canManageOrganizations: () => user?.role === 'super_admin',
    canManageUsers: () => ['super_admin', 'owner', 'administrador'].includes(user?.role || ''),
    canManageTeams: () => ['super_admin', 'owner', 'administrador'].includes(user?.role || ''),
    canCreateInvites: () => ['super_admin', 'owner', 'administrador', 'gestor'].includes(user?.role || ''),
    canEditServices: () => ['super_admin', 'owner', 'administrador', 'gestor'].includes(user?.role || ''),
    canViewAllServices: () => ['super_admin', 'owner', 'administrador'].includes(user?.role || ''),
  };
};