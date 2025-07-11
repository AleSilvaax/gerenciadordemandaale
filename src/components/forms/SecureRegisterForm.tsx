
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LogIn, Loader2, UserPlus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface InviteData {
  id: string;
  email: string;
  role: string;
  organization_id: string;
  team_id: string | null;
  organization: {
    name: string;
  };
  invited_by_profile: {
    name: string;
  };
}

export const SecureRegisterForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [isLoadingInvite, setIsLoadingInvite] = useState(true);
  const navigate = useNavigate();

  // Verificar convite válido
  useEffect(() => {
    const validateInvite = async () => {
      if (!token) {
        setError('Token de convite não fornecido');
        setIsLoadingInvite(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_invites')
          .select(`
            id,
            email,
            role,
            organization_id,
            team_id,
            organizations:organization_id (name),
            invited_by_profile:profiles!invited_by (name)
          `)
          .eq('token', token)
          .is('used_at', null)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error || !data) {
          setError('Convite inválido ou expirado');
          return;
        }

        setInviteData(data as any);
      } catch (err) {
        console.error('Erro ao validar convite:', err);
        setError('Erro ao validar convite');
      } finally {
        setIsLoadingInvite(false);
      }
    };

    validateInvite();
  }, [token]);

  const validateForm = () => {
    setError(null);
    
    if (!name || !password || !confirmPassword) {
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
    if (!validateForm() || !inviteData) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email: inviteData.email,
        password,
        options: { 
          data: { 
            name,
            role: inviteData.role,
            team_id: inviteData.team_id,
            organization_id: inviteData.organization_id
          }
        }
      });
      
      if (error) {
        console.error('Erro no registro:', error);
        setError('Erro durante o registro: ' + error.message);
        return;
      }
      
      toast.success('Conta criada com sucesso!', {
        description: 'Você já pode fazer login no sistema'
      });
      
      navigate('/login');
    } catch (err) {
      console.error('Erro inesperado:', err);
      setError('Ocorreu um erro inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="border-white/10 max-w-md w-full">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Validando convite...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="border-white/10 max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-xl">Convite Inválido</CardTitle>
            <CardDescription>
              O link de convite é inválido ou expirou
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/login">
                <LogIn className="h-4 w-4 mr-2" />
                Ir para Login
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Criar Conta</h1>
          <p className="text-muted-foreground mt-2">
            Complete seu cadastro para acessar o sistema
          </p>
        </div>
        
        <Card className="border-white/10">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Bem-vindo!</CardTitle>
            <CardDescription>
              Você foi convidado para se juntar à <strong>{inviteData?.organizations?.name}</strong>
              <br />
              Função: <strong className="capitalize">{inviteData?.role}</strong>
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={inviteData?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            
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
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-3">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
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
              
              <div className="text-sm text-center">
                Já possui uma conta?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  <LogIn className="inline-block h-3 w-3 mr-1" /> 
                  Entrar
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
