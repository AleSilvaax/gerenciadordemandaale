// Arquivo: src/components/guards/AuthGuard.tsx (VERSÃO CORRIGIDA)

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
// ✅ ALTERAÇÃO: Trocamos para o hook de autenticação correto
import { useOptimizedAuth } from '@/context/OptimizedAuthContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  // ✅ ALTERAÇÃO: Usamos o hook correto
  const { user, isLoading } = useOptimizedAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redireciona para o login se não houver usuário
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se o usuário estiver logado, renderiza a página solicitada
  return <>{children}</>;
};
