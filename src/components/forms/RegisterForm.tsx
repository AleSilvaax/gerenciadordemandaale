
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2, UserPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole } from '@/types/serviceTypes';
import { useAuth } from '@/context/AuthContext';
import { RegisterFormData } from '@/types/auth';

export const RegisterForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('tecnico');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    setError(null);
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Todos os campos são obrigatórios');
      return false;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não conferem');
      return false;
    }
    
    if (!email.includes('@')) {
      setError('Email inválido');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (isSubmitting) {
      console.log("Already submitting, preventing duplicate submission");
      return;
    }
    
    setIsSubmitting(true);
    console.log("Submitting registration form for:", email);
    
    try {
      const userData: RegisterFormData = {
        name,
        email,
        role,
        password,
        confirmPassword
      };
      
      const success = await register(userData);
      console.log("Registration result:", success);
      
      if (success) {
        // Navigate to home if registration was successful and auto-login occurred
        navigate('/');
      } else {
        setError('Ocorreu um erro durante o registro. Verifique se o email já está em uso.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError('Ocorreu um erro durante o registro. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  // Handle role change with proper type casting
  const handleRoleChange = (value: string) => {
    setRole(value as UserRole);
  };

  return (
    <Card className="border-white/10">
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>
          Preencha os dados abaixo para se cadastrar no sistema
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
        
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
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
            <Label htmlFor="confirm-password">Confirmar senha</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select
              value={role}
              onValueChange={handleRoleChange}
              disabled={isSubmitting}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecione sua função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="administrador">Administrador</SelectItem>
                <SelectItem value="gestor">Gestor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <UserPlus size={16} className="mr-2" />
                Criar conta
              </>
            )}
          </Button>
          
          <div className="text-sm text-center mt-4">
            Já possui uma conta?{" "}
            <Link to="/login" className="text-primary hover:underline">
              <LogIn className="inline-block h-3 w-3 mr-1" />
              Entrar
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};
