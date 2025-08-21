
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useOptimizedAuth } from '@/context/OptimizedAuthContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, isLoading } = useOptimizedAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não há usuário, redirecionar para login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Usuário autenticado, renderizar children
  return <>{children}</>;
};
