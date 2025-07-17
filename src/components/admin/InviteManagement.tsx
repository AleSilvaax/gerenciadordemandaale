
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { inviteService, CreateInviteData, InviteListItem } from '@/services/inviteService';
import { supabase } from '@/integrations/supabase/client';

interface Team {
  id: string;
  name: string;
}

export const InviteManagement: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [invites, setInvites] = useState<InviteListItem[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'tecnico' | 'gestor' | 'administrador'>('tecnico');
  const [teamId, setTeamId] = useState<string>('');

  // Verificar permissões
  if (!user || !hasPermission('manage_team')) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Você não tem permissão para gerenciar convites.
        </AlertDescription>
      </Alert>
    );
  }

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar convites e equipes em paralelo
      const [invitesData, teamsData] = await Promise.all([
        inviteService.getInvites(),
        loadTeams()
      ]);
      
      setInvites(invitesData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeams = async (): Promise<Team[]> => {
    const { data, error } = await supabase
      .from('teams')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Erro ao carregar equipes:', error);
      return [];
    }

    return data || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    
    try {
      const inviteData: CreateInviteData = {
        email: email.toLowerCase().trim(),
        role,
        team_id: teamId || undefined
      };

      const success = await inviteService.createInvite(inviteData);
      
      if (success) {
        // Reset form
        setEmail('');
        setRole('tecnico');
        setTeamId('');
        // Reload invites
        await loadData();
      }
    } catch (error) {
      console.error('Erro ao criar convite:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (inviteId: string) => {
    const success = await inviteService.resendInvite(inviteId);
    if (success) {
      await loadData();
    }
  };

  const handleDelete = async (inviteId: string) => {
    const success = await inviteService.deleteInvite(inviteId);
    if (success) {
      await loadData();
    }
  };

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/register?token=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Link copiado!', {
      description: 'Link de convite copiado para a área de transferência'
    });
  };

  const getStatusBadge = (invite: InviteListItem) => {
    const isExpired = new Date(invite.expires_at) < new Date();
    const isUsed = invite.used_at !== null;

    if (isUsed) {
      return <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Aceito
      </Badge>;
    }

    if (isExpired) {
      return <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Expirado
      </Badge>;
    }

    return <Badge variant="secondary">
      <Clock className="h-3 w-3 mr-1" />
      Pendente
    </Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulário de Convite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Convidar Novo Usuário
          </CardTitle>
          <CardDescription>
            Envie convites para novos membros se juntarem à sua organização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Função *</Label>
                <Select value={role} onValueChange={(v) => setRole(v as any)} disabled={isSubmitting}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    {user.role === 'administrador' && (
                      <SelectItem value="administrador">Administrador</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="team">Equipe (Opcional)</Label>
                <Select value={teamId} onValueChange={setTeamId} disabled={isSubmitting}>
                  <SelectTrigger id="team">
                    <SelectValue placeholder="Selecionar equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem equipe</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting || !email}>
              <Plus className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Convites */}
      <Card>
        <CardHeader>
          <CardTitle>Convites Enviados</CardTitle>
          <CardDescription>
            Gerencie os convites enviados para sua organização
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum convite enviado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium">{invite.email}</span>
                      {getStatusBadge(invite)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Função: <span className="capitalize">{invite.role}</span></div>
                      {invite.teams && (
                        <div>Equipe: {invite.teams.name}</div>
                      )}
                      <div>
                        Expira em: {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!invite.used_at && new Date(invite.expires_at) > new Date() && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInviteLink(invite.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResend(invite.id)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(invite.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
