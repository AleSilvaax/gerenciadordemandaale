
import React, { useState, useEffect } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2, UserPlus, Info } from 'lucide-react';
import { useEnhancedAuth } from '@/context/EnhancedAuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { login, user, isLoading } = useEnhancedAuth();
  const navigate = useNavigate();
  
  // Se usuário já está logado, redirecionar
  useEffect(() => {
    if (user && !isLoading) {
      console.log("Usuário já logado, redirecionando...");
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se usuário já está logado, não mostrar a página de login
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Por favor, preencha todos os campos");
      return;
    }
    
    if (isSubmitting) return;
    
    setErrorMsg(null);
    setIsSubmitting(true);
    console.log("Tentando fazer login com:", email);
    
    try {
      const success = await login(email.trim(), password.trim());
      
      if (success) {
        console.log("Login bem-sucedido, redirecionando...");
        navigate('/', { replace: true });
      } else {
        setErrorMsg("Email ou senha inválidos");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      setErrorMsg("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDemoLogin = async (role: string) => {
    if (isSubmitting) return;
    
    let demoEmail = '';
    const demoPassword = '123456';
    
    switch(role) {
      case 'tecnico':
        demoEmail = 'joao@exemplo.com';
        break;
      case 'administrador':
        demoEmail = 'maria@exemplo.com';
        break;
      case 'gestor':
        demoEmail = 'carlos@exemplo.com';
        break;
    }
    
    setEmail(demoEmail);
    setPassword(demoPassword);
    setIsSubmitting(true);
    setErrorMsg(null);
    
    try {
      const success = await login(demoEmail, demoPassword);
      
      if (success) {
        navigate('/', { replace: true });
      } else {
        setErrorMsg("Erro ao fazer login com credenciais de demonstração");
      }
    } catch (error) {
      console.error("Erro no demo login:", error);
      setErrorMsg("Erro ao fazer login com credenciais de demonstração");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full animate-scaleIn">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Sistema de Gestão</h1>
          <p className="text-muted-foreground mt-2">Entre com suas credenciais para acessar</p>
        </div>
        
        
        <Card className="border-white/10 animate-fadeSlideIn">
          <CardHeader>
            <CardTitle>Acesso ao sistema</CardTitle>
            <CardDescription>
              Use seu email e senha para entrar no sistema
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {errorMsg && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
              )}
            
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="transition-medium"
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="transition-medium"
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-3">
              <Button 
                type="submit" 
                className="w-full transition-medium hover-scale" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn size={16} className="mr-2" />
                    Entrar
                  </>
                )}
              </Button>
              
              <div className="text-sm text-center mt-4 animate-fadeIn" style={{ animationDelay: "0.2s" }}>
                Não possui uma conta?{" "}
                <Link to="/register" className="text-primary hover:underline transition-colors">
                  <UserPlus className="inline-block h-3 w-3 mr-1" />
                  Cadastre-se
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
