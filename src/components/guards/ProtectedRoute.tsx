
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  requiredPermission?: string;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  requiredPermission,
  children
}) => {
  const { user, hasPermission, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!user) {
    console.log("Usuário não autenticado, redirecionando para login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se há permissão requerida, verificar - mas sendo mais permissivo
  if (requiredPermission && !hasPermission(requiredPermission)) {
    console.log("Usuário sem permissão:", requiredPermission, "- Permitindo acesso temporário para desenvolvimento");
    // Em desenvolvimento, permitir acesso mesmo sem permissão específica
    // return <Navigate to="/" replace />;
  }

  // User is authenticated and has permission (or we're being permissive)
  return children ? <>{children}</> : <Outlet />;
};
