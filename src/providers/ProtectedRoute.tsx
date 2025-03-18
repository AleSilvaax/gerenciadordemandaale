
import React, { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Adicionar um timer para mostrar o botão de tentar novamente após 5 segundos
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowRetryButton(true);
      }, 5000);
      
      // Após 10 segundos, mostrar o botão de timeout
      const timeoutTimer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(timeoutTimer);
      };
    } else {
      setShowRetryButton(false);
      setLoadingTimeout(false);
    }
  }, [loading]);

  // Mostrar um indicador de carregamento enquanto verifica a autenticação
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          {loadingTimeout ? (
            <>
              <AlertCircle size={48} className="mx-auto mb-4 text-amber-500" />
              <h2 className="text-xl font-semibold mb-2">Verificação de autenticação demorada</h2>
              <p className="text-muted-foreground mb-6">
                Está demorando mais que o esperado para verificar sua autenticação. Isso pode indicar problemas de conexão.
              </p>
            </>
          ) : (
            <>
              <Loader2 size={48} className="mx-auto animate-spin mb-4" />
              <p className="text-muted-foreground mb-4">Verificando autenticação...</p>
            </>
          )}
          
          {showRetryButton && (
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Tentar novamente
              </Button>
              <Button 
                onClick={() => window.location.href = "/login"} 
                variant="outline"
                className="w-full"
              >
                Ir para a tela de login
              </Button>
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
          <Button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-secondary rounded-md hover:bg-secondary/80 transition-colors"
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  console.log("Usuário autenticado com permissões corretas");
  // Se tudo estiver ok, renderizar os filhos
  return <>{children}</>;
};
