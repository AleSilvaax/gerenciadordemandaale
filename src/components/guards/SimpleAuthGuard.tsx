import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useEnhancedAuth } from '@/context/EnhancedAuthContext';

interface Props {
  children: ReactNode;
}

const SimpleAuthGuard = ({ children }: Props) => {
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

  // User is authenticated - render children
  return <>{children}</>;
};

export default SimpleAuthGuard;