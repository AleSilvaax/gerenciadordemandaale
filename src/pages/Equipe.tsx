
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamMemberCard } from "@/components/team/TeamMemberCard";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { TeamMember, UserRole } from "@/types/serviceTypes";
import { toast } from "sonner";

export default function Equipe() {
  const { teamMembers, isLoading, error, addMember, updateMember, deleteMember } = useTeamMembers();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'tecnico' as UserRole,
    avatar: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Filter out 'requisitor' role which is not valid for team members
      const validRole = formData.role === 'requisitor' ? 'tecnico' : formData.role;
      const memberData = { ...formData, role: validRole };
      
      if (editingMember) {
        await updateMember(editingMember.id, memberData);
        setEditingMember(null);
      } else {
        await addMember(memberData);
        setIsAddDialogOpen(false);
      }
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'tecnico',
        avatar: ''
      });
    } catch (error) {
      console.error('Erro ao salvar membro:', error);
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email || '',
      phone: member.phone || '',
      role: member.role,
      avatar: member.avatar || ''
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este membro?')) {
      try {
        await deleteMember(id);
      } catch (error) {
        console.error('Erro ao remover membro:', error);
      }
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Carregando equipe...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Erro ao carregar equipe: {error.message}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gerenciar Equipe</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          Adicionar Membro
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers?.map(() => (
          <TeamMemberCard
            key={Math.random()}
            member={{
              id: '1',
              name: 'Membro da Equipe',
              role: 'tecnico',
              avatar: '',
            }}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMember ? 'Editar Membro' : 'Adicionar Novo Membro'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="role">Função</Label>
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
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                setEditingMember(null);
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  role: 'tecnico',
                  avatar: ''
                });
              }}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingMember ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
