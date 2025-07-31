import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Mail, Trash2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedAuth } from '@/context/EnhancedAuthContext';
import { createInvite, getOrganizationInvites, type UserInvite } from '@/services/inviteService';
import { UserRole } from '@/types/auth';

const ROLE_DISPLAY_NAMES = {
  super_admin: 'Super Admin',
  owner: 'Proprietário', 
  administrador: 'Administrador',
  gestor: 'Gestor',
  tecnico: 'Técnico',
  requisitor: 'Requisitor'
} as const;

export function InviteManagement() {
  const [invites, setInvites] = useState<UserInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'tecnico' as UserRole
  });
  const { user } = useEnhancedAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.organizationId) {
      loadInvites();
    }
  }, [user?.organizationId]);

  const loadInvites = async () => {
    if (!user?.organizationId) return;

    try {
      setLoading(true);
      const data = await getOrganizationInvites();
      setInvites(data);
    } catch (error) {
      console.error('Erro ao carregar convites:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os convites',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.organizationId) return;

    try {
      await createInvite({
        email: formData.email,
        role: formData.role,
        organizationId: user.organizationId
      });

      toast({
        title: 'Sucesso',
        description: 'Convite enviado com sucesso'
      });

      await loadInvites();
      setIsCreateOpen(false);
      setFormData({ email: '', role: 'tecnico' });
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o convite',
        variant: 'destructive'
      });
    }
  };

  const handleRevoke = async (inviteId: string) => {
    if (!confirm('Tem certeza que deseja revogar este convite?')) return;

    try {
      // Por enquanto, apenas simular a revogação
      toast({
        title: 'Info',
        description: 'Funcionalidade de revogar convite será implementada'
      });
      // await revokeInvite(inviteId);
      // await loadInvites();
    } catch (error) {
      console.error('Erro ao revogar convite:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível revogar o convite',
        variant: 'destructive'
      });
    }
  };

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/register?invite=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: 'Sucesso',
      description: 'Link do convite copiado! Compartilhe manualmente com o usuário.'
    });
  };

  const getStatusBadge = (invite: UserInvite) => {
    if (invite.used_at) {
      return <Badge variant="secondary">Usado</Badge>;
    }
    
    const now = new Date();
    const expiresAt = new Date(invite.expires_at);
    
    if (expiresAt < now) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    
    return <Badge variant="default">Pendente</Badge>;
  };

  if (loading) {
    return <div>Carregando convites...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Convites</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Convite
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Convite</DialogTitle>
              <DialogDescription>
                Enviar convite para um novo usuário se juntar à organização
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="usuario@exemplo.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value: UserRole) => setFormData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="administrador">Administrador</SelectItem>
                      {user?.effectiveRole === 'super_admin' && (
                        <SelectItem value="owner">Proprietário</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Convite
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Enviado em</TableHead>
            <TableHead>Expira em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.map((invite) => (
            <TableRow key={invite.id}>
              <TableCell className="font-medium">{invite.email}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {ROLE_DISPLAY_NAMES[invite.role]}
                </Badge>
              </TableCell>
              <TableCell>{getStatusBadge(invite)}</TableCell>
              <TableCell>
                {new Date(invite.created_at).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell>
                {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  {!invite.used_at && new Date(invite.expires_at) > new Date() && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyInviteLink(invite.token)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevoke(invite.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {invites.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum convite encontrado</p>
        </div>
      )}
    </div>
  );
}