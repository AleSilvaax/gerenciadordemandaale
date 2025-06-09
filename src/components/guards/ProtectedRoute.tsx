
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
  const { user, isLoading } = useAuth();
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

  // Remove permission checks - all authenticated users have access
  console.log("Usuário autenticado, permitindo acesso");

  // User is authenticated
  return children ? <>{children}</> : <Outlet />;
};
