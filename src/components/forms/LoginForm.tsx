
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    
    if (isSubmitting) return;
    
    setErrorMsg(null);
    setIsSubmitting(true);
    console.log("Submitting login form with email:", email);
    
    try {
      const success = await login(email, password);
      console.log("Login result:", success);
      
      if (success) {
        navigate('/');
      } else {
        setErrorMsg("Email ou senha inválidos");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("Erro ao fazer login. Verifique suas credenciais e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar no sistema</CardTitle>
        <CardDescription>
          Use seu email e senha para acessar o sistema
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
