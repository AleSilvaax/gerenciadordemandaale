
import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2, UserPlus, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { login, user, isLoading: authLoading } = useAuth();
  
  useEffect(() => {
    // Reset submission state when component unmounts
    return () => {
      if (isSubmitting) {
        setIsSubmitting(false);
      }
    };
  }, []);

  // If user is already logged in, redirect to home
  if (user) {
    console.log("User already logged in, redirecting to home");
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setErrorMsg("Por favor, preencha todos os campos");
      return;
    }
    
    if (isSubmitting) {
      console.log("Already submitting, preventing duplicate submission");
      return;
    }
    
    setErrorMsg(null);
    setIsSubmitting(true);
    console.log("Submitting login form with email:", email);
    
    try {
      const success = await login(email, password);
      console.log("Login result:", success);
      
      if (!success) {
        setErrorMsg("Email ou senha inválidos");
        toast({
          title: "Erro no login",
          description: "Verifique suas credenciais e tente novamente",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("Erro ao fazer login. Verifique suas credenciais e tente novamente.");
      toast({
        title: "Erro no login",
        description: "Ocorreu um problema ao processar seu login",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };
  
  const handleDemoLogin = async (role: string) => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    let demoEmail = '';
    let demoPassword = '123456';
    
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
    
    // Automatically submit after setting credentials
    try {
      console.log("Using demo login with role:", role, "email:", demoEmail);
      const success = await login(demoEmail, demoPassword);
      console.log("Demo login result:", success);
      
      if (!success) {
        setErrorMsg("Erro ao fazer login com credenciais de demonstração");
        toast({
          title: "Erro no login com demo",
          description: "Não foi possível acessar com as credenciais de demonstração",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Demo login error:", error);
      setErrorMsg("Erro ao fazer login com credenciais de demonstração");
      toast({
        title: "Erro no login com demo",
        description: "Não foi possível acessar com as credenciais de demonstração",
        variant: "destructive",
      });
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
        
        <Alert className="mb-4 bg-muted/50 border-primary/20 animate-fadeIn">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p className="text-sm">Credenciais de demonstração:</p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs hover-scale"
                onClick={() => handleDemoLogin('tecnico')}
                disabled={isSubmitting}
              >
                Técnico
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs hover-scale"
                onClick={() => handleDemoLogin('administrador')}
                disabled={isSubmitting}
              >
                Administrador
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs hover-scale"
                onClick={() => handleDemoLogin('gestor')}
                disabled={isSubmitting}
              >
                Gestor
              </Button>
              <div className="col-span-3 text-xs text-muted-foreground mt-1">
                Senha para todos: 123456
              </div>
            </div>
          </AlertDescription>
        </Alert>
        
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
