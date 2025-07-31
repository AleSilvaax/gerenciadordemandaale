import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedAuth } from '@/context/EnhancedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/auth';

interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  organization_id: string;
  team_id?: string;
  created_at: string;
  user_roles: {
    role: UserRole;
  }[];
  teams?: {
    name: string;
  };
  organization_roles?: {
    role: string;
    is_active: boolean;
  }[];
}

const ROLE_DISPLAY_NAMES = {
  super_admin: 'Super Admin',
  owner: 'Proprietário',
  administrador: 'Administrador',
  gestor: 'Gestor',
  tecnico: 'Técnico',
  requisitor: 'Requisitor'
} as const;

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { user: currentUser } = useEnhancedAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (role),
          teams (name),
          organization_roles!organization_roles_user_id_fkey (role, is_active)
        `)
        .order('name');

      if (error) throw error;
      setUsers((data as unknown as UserProfile[]) || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: UserRole) => {
    try {
      // Para roles organizacionais (owner, administrador, gestor, tecnico)
      if (['owner', 'administrador', 'gestor', 'tecnico'].includes(newRole)) {
        const { error } = await supabase
          .from('organization_roles')
          .upsert({
            user_id: userId,
            organization_id: currentUser?.organizationId,
            role: newRole,
            is_active: true
          }, {
            onConflict: 'user_id,organization_id'
          });

        if (error) throw error;
      } else {
        // Para super_admin, atualizar na tabela user_roles
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Role do usuário atualizado com sucesso'
      });

      await loadUsers();
      setIsEditOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o role do usuário',
        variant: 'destructive'
      });
    }
  };

  const getUserEffectiveRole = (user: UserProfile): UserRole => {
    // Se tem role de super_admin, retorna isso
    if (user.user_roles?.[0]?.role === 'super_admin') {
      return 'super_admin';
    }

    // Senão, busca o role organizacional ativo
    const activeOrgRole = user.organization_roles?.find(r => r.is_active);
    if (activeOrgRole) {
      return activeOrgRole.role as UserRole;
    }

    // Fallback para o role base
    return user.user_roles?.[0]?.role || 'tecnico';
  };

  const canEditUser = (user: UserProfile): boolean => {
    if (currentUser?.effectiveRole === 'super_admin') return true;
    if (currentUser?.effectiveRole === 'owner') {
      return user.organization_id === currentUser.organizationId;
    }
    return false;
  };

  if (loading) {
    return <div>Carregando usuários...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Usuários</h3>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>Organização</TableHead>
            <TableHead>Equipe</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Membro desde</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const effectiveRole = getUserEffectiveRole(user);
            
            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{user.organization_id}</Badge>
                </TableCell>
                <TableCell>
                  {user.teams?.name || 'Sem equipe'}
                </TableCell>
                <TableCell>
                  <Badge variant={effectiveRole === 'super_admin' ? 'destructive' : 'default'}>
                    {ROLE_DISPLAY_NAMES[effectiveRole]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  {canEditUser(user) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingUser(user);
                        setIsEditOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Dialog para editar usuário */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Alterar role e permissões do usuário
            </DialogDescription>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={editingUser.avatar} />
                  <AvatarFallback>
                    {editingUser.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{editingUser.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Role atual: {ROLE_DISPLAY_NAMES[getUserEffectiveRole(editingUser)]}
                  </div>
                </div>
              </div>

              <div>
                <Label>Novo Role</Label>
                <Select
                  onValueChange={(value: UserRole) => handleRoleUpdate(editingUser.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar novo role" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUser?.effectiveRole === 'super_admin' && (
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    )}
                    <SelectItem value="owner">Proprietário</SelectItem>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="requisitor">Requisitor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}