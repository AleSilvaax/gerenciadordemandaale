
import React from 'react';
import { Navigate } from 'react-router-dom';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { useAuth } from '@/context/AuthContext';

const Register: React.FC = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Sistema de Gestão</h1>
          <p className="text-muted-foreground mt-2">Crie sua conta para acessar o sistema</p>
        </div>
        
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register;
