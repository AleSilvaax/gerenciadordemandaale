
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserRole } from '@/types/auth';

interface RegisterFormProps {
  setRegistrationInProgress?: (inProgress: boolean) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ setRegistrationInProgress }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('tecnico');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg("Por favor, preencha todos os campos");
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMsg("As senhas não coincidem");
      return;
    }
    
    if (password.length < 6) {
      setErrorMsg("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    
    if (isSubmitting) return;
    
    setErrorMsg(null);
    setIsSubmitting(true);
    setRegistrationInProgress?.(true);
    
    try {
      const success = await register({
        name,
        email,
        password,
        role,
        team_id: null,
      });
      
      if (success) {
        navigate('/login');
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMsg("Erro ao criar conta. Tente novamente.");
    } finally {
      setIsSubmitting(false);
      setRegistrationInProgress?.(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>
          Preencha os dados para criar sua conta
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
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

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
            <Label htmlFor="role">Função</Label>
            <Select value={role} onValueChange={(value: UserRole) => setRole(value)} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione sua função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="gestor">Gestor</SelectItem>
                <SelectItem value="administrador">Administrador</SelectItem>
              </SelectContent>
            </Select>
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
                Criando conta...
              </>
            ) : (
              <>
                <UserPlus size={16} className="mr-2" />
                Criar conta
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
