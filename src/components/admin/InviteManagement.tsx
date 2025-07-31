import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Mail, Trash2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';

const ROLE_DISPLAY_NAMES = {
  super_admin: 'Super Admin',
  owner: 'Proprietário', 
  administrador: 'Administrador',
  gestor: 'Gestor',
  tecnico: 'Técnico',
  requisitor: 'Requisitor'
} as const;

export function InviteManagement() {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'tecnico' as UserRole
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_invites')
        .select('*')
        .eq('organization_id', '00000000-0000-0000-0000-000000000001')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error: any) {
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
    
    try {
      const { data, error } = await supabase
        .from('user_invites')
        .insert({
          email: formData.email,
          role: formData.role,
          organization_id: '00000000-0000-0000-0000-000000000001',
          invited_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Convite enviado para ${formData.email}`
      });
      
      loadInvites();
      setIsCreateOpen(false);
      setFormData({ email: '', role: 'tecnico' });
    } catch (error: any) {
      console.error('Erro ao criar convite:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o convite',
        variant: 'destructive'
      });
    }
  };

  const cancelInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('user_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Convite cancelado com sucesso'
      });
      loadInvites();
    } catch (error: any) {
      console.error('Erro ao cancelar convite:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível cancelar o convite',
        variant: 'destructive'
      });
    }
  };

  const resendInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('user_invites')
        .update({ 
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Convite reenviado com sucesso'
      });
      loadInvites();
    } catch (error: any) {
      console.error('Erro ao reenviar convite:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível reenviar o convite',
        variant: 'destructive'
      });
    }
  };

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
                  <Label htmlFor="role">Papel</Label>
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
                  Criar Convite
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div>Carregando convites...</div>
      ) : invites.length === 0 ? (
        <div className="bg-muted/50 p-8 rounded-lg text-center">
          <h3 className="text-lg font-semibold mb-2">Nenhum convite encontrado</h3>
          <p className="text-muted-foreground">
            Ainda não há convites criados. Clique em "Novo Convite" para começar.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
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
                    {ROLE_DISPLAY_NAMES[invite.role as keyof typeof ROLE_DISPLAY_NAMES] || invite.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={invite.used_at ? 'default' : new Date(invite.expires_at) < new Date() ? 'destructive' : 'secondary'}>
                    {invite.used_at ? 'Aceito' : new Date(invite.expires_at) < new Date() ? 'Expirado' : 'Pendente'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(invite.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    {!invite.used_at && new Date(invite.expires_at) > new Date() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resendInvite(invite.id)}
                        title="Reenviar convite"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    {!invite.used_at && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelInvite(invite.id)}
                        className="text-destructive hover:text-destructive"
                        title="Cancelar convite"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}