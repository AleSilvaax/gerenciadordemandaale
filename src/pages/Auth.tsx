
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/MockAuthContext';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { LoginForm } from '@/components/forms/LoginForm';

const Auth: React.FC = () => {
  const { user } = useAuth();
  const [registrationInProgress, setRegistrationInProgress] = useState(false);

  // Se o usuário já está logado, redireciona para home
  if (user && !registrationInProgress) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 font-bold text-2xl text-primary mb-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">GD</span>
            </div>
            <span>GerenciadorDemandas</span>
          </div>
          <p className="text-muted-foreground">Sistema de Gestão de Demandas</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="register">Cadastrar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <LoginForm />
          </TabsContent>
          
          <TabsContent value="register">
            <RegisterForm setRegistrationInProgress={setRegistrationInProgress} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
