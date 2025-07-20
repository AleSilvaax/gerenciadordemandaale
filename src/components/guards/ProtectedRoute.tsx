import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEnhancedAuth } from '@/context/EnhancedAuthContext';

interface ProtectedRouteProps {
  requiredRole?: 'tecnico' | 'gestor' | 'administrador' | 'requisitor';
  requiredPermission?: string;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  requiredRole,
  requiredPermission,
  children
}) => {
  const { user, isLoading } = useEnhancedAuth();
  const location = useLocation();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole) {
    const roleHierarchy = {
      'tecnico': 1,
      'requisitor': 1,
      'gestor': 2,
      'administrador': 3
    };

    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
      return <Navigate to="/" replace />;
    }
  }

  // Check permission-based access
  if (requiredPermission) {
    const hasAccess = () => {
      switch (user.role) {
        case 'administrador':
          return true; // Admin has all permissions
        case 'gestor':
          return ['view_services', 'create_services', 'manage_team', 'view_stats', 'add_members'].includes(requiredPermission);
        case 'tecnico':
          return ['view_services', 'update_services'].includes(requiredPermission);
        case 'requisitor':
          return ['view_services', 'create_services'].includes(requiredPermission);
        default:
          return false;
      }
    };

    if (!hasAccess()) {
      return <Navigate to="/" replace />;
    }
  }

  // User is authenticated and authorized - render children or Outlet
  return children ? <>{children}</> : <Outlet />;
};