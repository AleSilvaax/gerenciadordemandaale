
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  requiredPermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  requiredPermission 
}) => {
  const { user, hasPermission } = useAuth();
  const location = useLocation();

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route requires specific permission and user doesn't have it
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // Redirect to unauthorized page or home
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has permission, render the children
  return <Outlet />;
};
