
import React, { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'tecnico' | 'administrador' | 'gestor';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, loading, checkUserRole } = useAuth();
  const location = useLocation();
  const [showRetryButton, setShowRetryButton] = useState(false);

  // Adicionar um timer para mostrar o botão de tentar novamente após 10 segundos
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowRetryButton(true);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Mostrar um indicador de carregamento enquanto verifica a autenticação
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto animate-spin mb-4" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
          {showRetryButton && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                Está demorando mais que o esperado.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-secondary rounded-md hover:bg-secondary/80 transition-colors"
              >
                Tentar novamente
              </button>
              <p className="text-sm text-muted-foreground mt-4">
                Ou você pode 
                <a href="/login" className="text-blue-500 hover:underline ml-1">fazer login novamente</a>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Verificar se o usuário está autenticado
  if (!user) {
    console.log("Usuário não autenticado, redirecionando para login");
    // Redirecionar para a página de login e salvar a localização atual
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se há um papel necessário, verificar se o usuário tem esse papel
  if (requiredRole && !checkUserRole(requiredRole)) {
    console.log(`Usuário não tem a função necessária: ${requiredRole}`);
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-6">
            Você não tem permissão para acessar esta página. Esta funcionalidade requer 
            privilégios de {requiredRole}.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-secondary rounded-md hover:bg-secondary/80 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  console.log("Usuário autenticado com permissões corretas");
  // Se tudo estiver ok, renderizar os filhos
  return <>{children}</>;
};
