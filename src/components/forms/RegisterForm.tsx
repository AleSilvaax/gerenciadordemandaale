
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
import { toast } from '@/hooks/use-toast';

interface RegisterFormProps {
  setRegistrationInProgress?: (value: boolean) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ setRegistrationInProgress }) => {
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
    if (setRegistrationInProgress) {
      setRegistrationInProgress(true);
    }
    
    console.log("=== REGISTRATION DEBUG ===");
    console.log("Selected role:", role);
    console.log("Form data being sent:", { name, email, role });
    
    try {
      const userData: RegisterFormData = {
        name,
        email,
        role, // This role will be passed to the Supabase metadata
        password,
        confirmPassword
      };
      
      console.log("Final userData object:", userData);
      
      const success = await register(userData);
      console.log("Registration result:", success);
      
      if (success) {
        toast({
          title: "Conta criada com sucesso!",
          description: `Usuário registrado como ${role}. Você será redirecionado para a página inicial.`,
          variant: "default",
        });
        
        // Navigate to home if registration was successful and auto-login occurred
        setTimeout(() => navigate('/'), 1500);
      } else {
        setError('Ocorreu um erro durante o registro. Verifique se o email já está em uso.');
        toast({
          title: "Erro no cadastro",
          description: "Verifique se o email já está em uso ou tente novamente mais tarde.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError('Ocorreu um erro durante o registro. Tente novamente.');
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um problema ao processar seu cadastro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      if (setRegistrationInProgress) {
        setRegistrationInProgress(false);
      }
    }
  };

  // Handle role change with proper type casting
  const handleRoleChange = (value: string) => {
    console.log("Role changed to:", value);
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
                <SelectItem value="gestor">Gestor</SelectItem>
                <SelectItem value="administrador">Administrador</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              <strong>Papel selecionado: {role}</strong>
            </div>
            <div className="text-xs text-muted-foreground">
              Este papel será usado para definir suas permissões no sistema
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Registrando como {role}...
              </>
            ) : (
              <>
                <UserPlus size={16} className="mr-2" />
                Criar conta como {role}
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
