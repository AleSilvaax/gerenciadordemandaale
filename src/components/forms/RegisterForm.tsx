import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2, UserPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole } from '@/types/auth';
import { useEnhancedAuth } from '@/context/EnhancedAuthContext';
import { RegisterFormData } from '@/types/auth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { validateEmail, validatePassword, validateRequiredField, validatePasswordMatch } from '@/utils/formValidation';

interface Team {
  id: string;
  name: string;
}

interface RegisterFormProps {
  setRegistrationInProgress?: (value: boolean) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ setRegistrationInProgress }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('tecnico');
  const [teamId, setTeamId] = useState<string>(''); 
  const [teams, setTeams] = useState<Team[]>([]);   
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { register } = useEnhancedAuth();
  const navigate = useNavigate();

  // Carregar equipes disponíveis
  useEffect(() => {
    fetchTeams();
  }, []);

  // Busca as equipes disponíveis quando o componente carrega
  const fetchTeams = async () => {
    try {
      console.log("Buscando equipes do Supabase..."); 
      
      const { data, error } = await supabase.from('teams').select('id, name');
      
      console.log("Resultado da busca por equipes:", { data, error });

      if (error) {
        console.error('Erro ao carregar equipes:', error);
        toast.error('Erro ao carregar equipes', { description: error.message });
      } else if (data) {
        console.log(`Encontradas ${data.length} equipes.`); 
        setTeams(data);
      }
    } catch (error) {
      console.error('Erro inesperado ao carregar equipes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    setError(null);
    
    // Validar nome
    const nameValidation = validateRequiredField(name.trim(), 'Nome');
    if (!nameValidation.valid) {
      setError(nameValidation.error);
      return false;
    }
    
    // Validar email
    const emailValidation = validateEmail(email.trim());
    if (!emailValidation.valid) {
      setError(emailValidation.error);
      return false;
    }
    
    // Validar senha
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error);
      return false;
    }
    
    // Validar confirmação de senha
    const passwordMatchValidation = validatePasswordMatch(password, confirmPassword);
    if (!passwordMatchValidation.valid) {
      setError(passwordMatchValidation.error);
      return false;
    }
    
    // Validar role
    if (!role) {
      setError('Selecione uma função');
      return false;
    }
    
    // Para roles que não sejam requisitor, equipe é obrigatória (se houver equipes disponíveis)
    if (role !== 'requisitor' && teams.length > 0 && !teamId) {
      setError('Selecione uma equipe ou escolha a função "Requisitor"');
      return false;
    }
    
    console.log('[RegisterForm] Validação concluída com sucesso');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    if (setRegistrationInProgress) setRegistrationInProgress(true);
    
    try {
      const userData: RegisterFormData = {
        name,
        email,
        role,
        password,
        team_id: role === 'requisitor' ? '' : teamId,
      };
      
      console.log('[RegisterForm] Dados de registro:', userData);
      const success = await register(userData);
      
      if (success) {
        toast.success('Cadastro realizado com sucesso!');
        setTimeout(() => navigate('/'), 1500);
      } else {
        setError('Ocorreu um erro durante o registro. Verifique se o email já está em uso.');
      }
    } catch (err) {
      console.error('Erro no registro:', err);
      setError('Ocorreu um erro inesperado.');
    } finally {
      setIsSubmitting(false);
      if (setRegistrationInProgress) setRegistrationInProgress(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-white/10">
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            Carregando formulário...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Criar conta</CardTitle>
        <CardDescription>
          Preencha os dados abaixo para se cadastrar no sistema
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo *</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              disabled={isSubmitting}
              placeholder="Digite seu nome completo"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              disabled={isSubmitting}
              placeholder="Digite seu email"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              disabled={isSubmitting}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar senha *</Label>
            <Input 
              id="confirm-password" 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              disabled={isSubmitting}
              placeholder="Digite a senha novamente"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Função *</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)} disabled={isSubmitting}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecione sua função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="gestor">Gestor</SelectItem>
                <SelectItem value="administrador">Administrador</SelectItem>
                <SelectItem value="requisitor">Requisitor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* CAMPO DE EQUIPE - só mostrar se não for requisitor */}
          {role !== 'requisitor' && (
            <div className="space-y-2">
              <Label htmlFor="team">Equipe {teams.length > 0 ? '*' : ''}</Label>
              <Select value={teamId} onValueChange={setTeamId} disabled={isSubmitting || teams.length === 0}>
                <SelectTrigger id="team">
                  <SelectValue placeholder={teams.length === 0 ? "Nenhuma equipe disponível" : "Selecione uma equipe"} />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {teams.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma equipe encontrada. Você pode se cadastrar como "Requisitor" ou contatar o administrador para criar uma equipe.
                </p>
              )}
            </div>
          )}
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