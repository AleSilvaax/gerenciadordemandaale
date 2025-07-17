
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2, UserPlus, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/MockAuthContext';
import { toast } from 'sonner';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setErrorMsg("Por favor, preencha todos os campos");
      return;
    }
    
    setErrorMsg(null);
    setIsSubmitting(true);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        toast.success("Login realizado com sucesso!");
        navigate("/");
      } else {
        setErrorMsg("Email ou senha inválidos");
        toast.error("Erro no login");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("Erro ao fazer login. Tente novamente.");
      toast.error("Erro no login");
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
        toast.success(`Login como ${role} realizado!`);
        navigate("/");
      } else {
        setErrorMsg("Erro ao fazer login com credenciais de demonstração");
        toast.error("Erro no login demo");
      }
    } catch (error) {
      console.error("Demo login error:", error);
      setErrorMsg("Erro ao fazer login com credenciais de demonstração");
      toast.error("Erro no login demo");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar no Sistema</CardTitle>
        <CardDescription>
          Use suas credenciais para acessar o sistema
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <Alert className="bg-muted/50 border-primary/20">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="text-sm mb-2">Credenciais de demonstração:</p>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => handleDemoLogin('tecnico')}
                  disabled={isSubmitting}
                >
                  Técnico
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => handleDemoLogin('administrador')}
                  disabled={isSubmitting}
                >
                  Admin
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => handleDemoLogin('gestor')}
                  disabled={isSubmitting}
                >
                  Gestor
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Senha: 123456
              </p>
            </AlertDescription>
          </Alert>

          {errorMsg && (
            <Alert variant="destructive">
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
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
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
        </CardFooter>
      </form>
    </Card>
  );
};
