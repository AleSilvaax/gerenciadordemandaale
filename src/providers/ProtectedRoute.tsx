
import React, { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'tecnico' | 'administrador' | 'gestor';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children
}) => {
  // Simply render children without any checks
  return <>{children}</>;
};
