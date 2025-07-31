import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2, UserPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole } from '@/types/auth';
import { useAuth } from '@/context/AuthContext';
import { RegisterFormData } from '@/types/auth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Team {
  id: string;
  name: string;
}

interface InviteData {
  id: string;
  email: string;
  role: UserRole;
  organization_id: string;
  team_id: string | null;
}

interface RegisterFormProps {
  setRegistrationInProgress?: (value: boolean) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ setRegistrationInProgress }) => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('tecnico');
  const [teamId, setTeamId] = useState<string>(''); 
  const [teams, setTeams] = useState<Team[]>([]);   
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(!!inviteToken);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Carregar dados do convite se token fornecido
  useEffect(() => {
    if (inviteToken) {
      loadInviteData();
    } else {
      fetchTeams();
    }
  }, [inviteToken]);

  const loadInviteData = async () => {
    try {
      setLoadingInvite(true);
      
      const { data, error } = await supabase
        .from('user_invites')
        .select('*')
        .eq('token', inviteToken)
        .single();

      if (error) throw error;

      if (data.used_at) {
        toast.error('Convite já utilizado', { description: 'Este convite já foi utilizado.' });
        navigate('/login');
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        toast.error('Convite expirado', { description: 'Este convite já expirou.' });
        navigate('/login');
        return;
      }

      setInviteData(data as InviteData);
      setEmail(data.email);
      setRole(data.role as UserRole);
      if (data.team_id) {
        setTeamId(data.team_id);
      }
      
    } catch (error) {
      console.error('Erro ao carregar convite:', error);
      toast.error('Convite inválido', { description: 'Convite não encontrado ou inválido.' });
      navigate('/login');
    } finally {
      setLoadingInvite(false);
    }
  };

  // Busca as equipes disponíveis quando o componente carrega
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

  const validateForm = () => {
    setError(null);
    
    if (!name || !email || !password || !confirmPassword || !role) {
      setError('Todos os campos obrigatórios devem ser preenchidos');
      return false;
    }
    
    // Se não é convite e não é requisitor, precisa de equipe
    if (!inviteData && role !== 'requisitor' && !teamId) {
      setError('Selecione uma equipe');
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
        team_id: inviteData?.team_id || (role === 'requisitor' ? '' : teamId),
      };
      
      const success = await register(userData);
      
      if (success && inviteData) {
        // Marcar convite como usado
        await supabase
          .from('user_invites')
          .update({ used_at: new Date().toISOString() })
          .eq('token', inviteToken);
      }
      
      if (success) {
        toast.success(inviteData ? 'Convite aceito com sucesso!' : 'Cadastro realizado com sucesso!');
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

  if (loadingInvite) {
    return (
      <Card className="border-white/10">
        <CardContent className="p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            Carregando convite...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {inviteData ? 'Aceitar Convite' : 'Criar conta'}
        </CardTitle>
        <CardDescription>
          {inviteData 
            ? `Você foi convidado para se juntar como ${inviteData.role}`
            : 'Preencha os dados abaixo para se cadastrar no sistema'
          }
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
              disabled={isSubmitting || !!inviteData}
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
            {inviteData ? (
              <div className="p-2 bg-muted rounded border">
                {inviteData.role}
              </div>
            ) : (
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
            )}
          </div>

          {/* CAMPO DE EQUIPE - só mostrar se não for requisitor e não for convite */}
          {!inviteData && role !== 'requisitor' && (
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

          {inviteData && (
            <div className="space-y-2">
              <Label>Organização</Label>
              <div className="p-2 bg-muted rounded border text-sm">
                Você será adicionado à organização através do convite
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                {inviteData ? 'Aceitando convite...' : 'Registrando...'}
              </>
            ) : (
              <>
                <UserPlus size={16} className="mr-2" />
                {inviteData ? 'Aceitar convite' : 'Criar conta'}
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