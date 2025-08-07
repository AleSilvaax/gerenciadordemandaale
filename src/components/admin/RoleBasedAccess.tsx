import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface RoleBasedAccessProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoading?: boolean;
}

/**
 * Componente para controle de acesso baseado em roles
 * Só renderiza o conteúdo se o usuário tiver um dos roles permitidos
 */
export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  allowedRoles,
  children,
  fallback = null,
  showLoading = true
}) => {
  const { user } = usePermissions();

  // Se ainda está carregando o usuário
  if (!user && showLoading) {
    return <LoadingSpinner />;
  }

  // Se não tem usuário logado
  if (!user) {
    return fallback as React.ReactElement;
  }

  // Verificar se o usuário tem um dos roles permitidos
  const hasPermission = allowedRoles.includes(user.role || '');

  if (!hasPermission) {
    return fallback as React.ReactElement;
  }

  return <>{children}</>;
};