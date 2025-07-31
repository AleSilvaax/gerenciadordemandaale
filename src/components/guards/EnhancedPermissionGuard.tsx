import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useEnhancedAuth } from '@/context/EnhancedAuthContext';
import { hasPermission, hasRoleOrHigher, canAccessRoute } from '@/services/permissionService';
import { UserRole } from '@/types/auth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredRole?: UserRole;
  requiredAction?: string;
  requiredResource?: string;
  fallbackPath?: string;
  showFallback?: boolean;
}

const EnhancedPermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredPermission,
  requiredRole,
  requiredAction,
  requiredResource,
  fallbackPath = '/',
  showFallback = false
}) => {
  const { user, isLoading, isAuthenticated } = useEnhancedAuth();
  const location = useLocation();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated || !user) {
        setHasAccess(false);
        setCheckingPermissions(false);
        return;
      }

      try {
        let accessGranted = true;

        // Verificar permissão específica
        if (requiredPermission) {
          accessGranted = user.permissions.includes(requiredPermission);
        }

        // Verificar role mínimo necessário
        if (accessGranted && requiredRole) {
          accessGranted = await hasRoleOrHigher(requiredRole);
        }

        // Verificar ação e recurso específicos
        if (accessGranted && requiredAction && requiredResource) {
          accessGranted = await hasPermission(requiredAction, requiredResource);
        }

        // Verificar acesso à rota atual
        if (accessGranted) {
          accessGranted = await canAccessRoute(location.pathname);
        }

        setHasAccess(accessGranted);
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        setHasAccess(false);
      } finally {
        setCheckingPermissions(false);
      }
    };

    checkAccess();
  }, [
    user, 
    isAuthenticated, 
    requiredPermission, 
    requiredRole, 
    requiredAction, 
    requiredResource, 
    location.pathname
  ]);

  // Loading state
  if (isLoading || checkingPermissions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // No access
  if (hasAccess === false) {
    if (showFallback) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-4">
              Acesso Negado
            </h2>
            <p className="text-muted-foreground mb-6">
              Você não tem permissão para acessar esta página.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Voltar
            </button>
          </div>
        </div>
      );
    }
    
    return <Navigate to={fallbackPath} replace />;
  }

  // Access granted
  return <>{children}</>;
};

export default EnhancedPermissionGuard;