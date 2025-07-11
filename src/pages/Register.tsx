
import React from 'react';
import { Navigate } from 'react-router-dom';
import { SimpleRegisterForm } from '@/components/forms/SimpleRegisterForm';
import { useAuth } from '@/context/AuthContext';

const Register: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    console.log("User already logged in, redirecting to home");
    return <Navigate to="/" replace />;
  }

  return <SimpleRegisterForm />;
};

export default Register;
