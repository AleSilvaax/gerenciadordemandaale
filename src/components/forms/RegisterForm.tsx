
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
import { useOptimizedAuth } from '@/context/OptimizedAuthContext';
import { RegisterFormData } from '@/types/auth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  const { register } = useOptimizedAuth();
  const navigate = useNavigate();

  // Busca as equipes disponíveis quando o componente carrega
  useEffect(() => {
    const fetchTeams = async () => {
      console.log("Buscando equipes do Supabase..."); 

      const { data, error } = await supabase.from('teams').select('id, name');

      console.log("Resultado da busca por equipes:", { data, error });

      if (error) {
        toast.error('Erro ao carregar equipes', { description: error.message });
      } else if (data) {
        console.log(`Encontradas ${data.length} equipes.`); 
        setTeams(data);
      }
    };
    fetchTeams();
  }, []);

  const validateForm = () => {
    setError(null);
    
    // Se for requisitor, não precisa de equipe
    if (role !== 'requisitor' && (!name || !email || !password || !confirmPassword || !role || !teamId)) {
      setError('Todos os campos, incluindo a equipe, são obrigatórios');
      return false;
    }
    
    if (role === 'requisitor' && (!name || !email || !password || !confirmPassword || !role)) {
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
      
      const success = await register(userData);
      
      if (success) {
        toast.success('Cadastro realizado com sucesso!');
        navigate('/');
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
              <Label htmlFor="team">Equipe *</Label>
              <Select value={teamId} onValueChange={setTeamId} disabled={isSubmitting || teams.length === 0}>
                <SelectTrigger id="team">
                  <SelectValue placeholder={teams.length === 0 ? "Carregando equipes..." : "Selecione uma equipe"} />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {teams.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma equipe encontrada. Entre em contato com o administrador.
                </p>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
          <Button type="submit" className="w-full" disabled={isSubmitting || (role !== 'requisitor' && !teamId)}>
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
