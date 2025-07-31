import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
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
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Verificar se é super admin - pode ver todos os usuários
      const isSuperAdmin = currentUser?.role === 'super_admin';
      
      let query = supabase
        .from('profiles')
        .select(`
          *,
          user_roles (role),
          teams (name)
        `);
      
      // Se não for super admin, filtrar por organização
      if (!isSuperAdmin && currentUser?.organizationId) {
        query = query.eq('organization_id', currentUser.organizationId);
      }
      
      const { data, error } = await query.order('name');

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
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Role do usuário atualizado com sucesso'
      });

      setIsEditOpen(false);
      setEditingUser(null);
      loadUsers(); // Recarregar lista
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
    return user.user_roles?.[0]?.role || 'tecnico';
  };

  const canEditUser = (user: UserProfile): boolean => {
    if (!currentUser) return false;
    
    // Super admin pode editar qualquer um
    if (currentUser.role === 'super_admin') return true;
    
    // Owner e admin podem editar usuários da própria organização
    if (['owner', 'administrador'].includes(currentUser.role)) {
      return user.organization_id === currentUser.organizationId;
    }
    
    // Gestor pode editar apenas técnicos da sua equipe
    if (currentUser.role === 'gestor') {
      return user.team_id === currentUser.teamId && 
             getUserEffectiveRole(user) === 'tecnico';
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
                  {user.teams?.name || 'Sem equipe'}
                </TableCell>
                <TableCell>
                  <Badge variant={effectiveRole === 'administrador' ? 'default' : 'secondary'}>
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Novo Role:</label>
                <Select onValueChange={(value: UserRole) => handleRoleUpdate(editingUser.id, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar novo role" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUser?.role === 'super_admin' && (
                      <>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="owner">Proprietário</SelectItem>
                      </>
                    )}
                    {['super_admin', 'owner'].includes(currentUser?.role || '') && (
                      <SelectItem value="administrador">Administrador</SelectItem>
                    )}
                    {['super_admin', 'owner', 'administrador'].includes(currentUser?.role || '') && (
                      <SelectItem value="gestor">Gestor</SelectItem>
                    )}
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="requisitor">Requisitor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}