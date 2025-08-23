import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Users, Edit2, Trash2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface Team {
  id: string;
  name: string;
  invite_code: string;
  organization_id: string;
  created_at: string;
  member_count: number;
}

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: string;
}

interface TeamManagementProps {
  selectedOrgId: string;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ selectedOrgId }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const canManageTeams = user?.role && ['super_admin', 'owner', 'administrador', 'gestor'].includes(user.role);

  const loadTeams = async () => {
    if (!selectedOrgId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          profiles!profiles_team_id_fkey(id)
        `)
        .eq('organization_id', selectedOrgId)
        .order('name');

      if (error) throw error;

      const teamsWithCounts = data?.map(team => ({
        ...team,
        member_count: team.profiles?.length || 0,
      })) || [];

      setTeams(teamsWithCounts);
    } catch (error: any) {
      console.error('Error loading teams:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar equipes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          avatar,
          user_roles(role)
        `)
        .eq('team_id', teamId);

      if (error) throw error;

      const members = data?.map(member => ({
        id: member.id,
        name: member.name || 'Sem nome',
        avatar: member.avatar,
        role: member.user_roles?.[0]?.role || 'tecnico',
      })) || [];

      setTeamMembers(members);
      setSelectedTeamId(teamId);
    } catch (error: any) {
      console.error('Error loading team members:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar membros da equipe",
        variant: "destructive",
      });
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim() || !selectedOrgId) return;

    try {
      // Generate a random invite code
      const generateInviteCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: newTeamName.trim(),
          organization_id: selectedOrgId,
          created_by: user?.id,
          invite_code: generateInviteCode(),
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Equipe criada com sucesso",
      });

      setNewTeamName('');
      setCreateDialogOpen(false);
      loadTeams();
    } catch (error: any) {
      console.error('Error creating team:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar equipe",
        variant: "destructive",
      });
    }
  };

  const updateTeam = async () => {
    if (!editingTeam || !newTeamName.trim()) return;

    try {
      const { error } = await supabase
        .from('teams')
        .update({ name: newTeamName.trim() })
        .eq('id', editingTeam.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Equipe atualizada com sucesso",
      });

      setEditDialogOpen(false);
      setEditingTeam(null);
      setNewTeamName('');
      loadTeams();
    } catch (error: any) {
      console.error('Error updating team:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar equipe",
        variant: "destructive",
      });
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      // First, remove team assignment from all members
      await supabase
        .from('profiles')
        .update({ team_id: null })
        .eq('team_id', teamId);

      // Then delete the team
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Equipe excluída com sucesso",
      });

      loadTeams();
    } catch (error: any) {
      console.error('Error deleting team:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir equipe",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadTeams();
  }, [selectedOrgId]);

  if (!canManageTeams) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Você não tem permissão para gerenciar equipes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gerenciar Equipes
            </CardTitle>
            <CardDescription>
              Crie e gerencie equipes da organização
            </CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Equipe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Equipe</DialogTitle>
                <DialogDescription>
                  Digite o nome da nova equipe
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="teamName">Nome da Equipe</Label>
                  <Input
                    id="teamName"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Digite o nome da equipe"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={createTeam} disabled={!newTeamName.trim()}>
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma equipe encontrada. Crie a primeira equipe.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código de Convite</TableHead>
                  <TableHead>Membros</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{team.invite_code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadTeamMembers(team.id)}
                        className="flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        {team.member_count} membros
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTeam(team);
                            setNewTeamName(team.name);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Equipe</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a equipe "{team.name}"? 
                                Os membros serão removidos da equipe.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteTeam(team.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Team Members Modal */}
      {selectedTeamId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Membros da Equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum membro nesta equipe
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{member.role}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Team Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Equipe</DialogTitle>
            <DialogDescription>
              Altere o nome da equipe
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editTeamName">Nome da Equipe</Label>
              <Input
                id="editTeamName"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Digite o nome da equipe"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={updateTeam} disabled={!newTeamName.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};