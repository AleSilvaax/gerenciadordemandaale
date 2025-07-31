import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Organization {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function OrganizationManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Erro ao carregar organizações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as organizações',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingOrg) {
        const { error } = await supabase
          .from('organizations')
          .update({
            name: formData.name,
            slug: formData.slug,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingOrg.id);
        
        if (error) throw error;
        
        toast({
          title: 'Sucesso',
          description: 'Organização atualizada com sucesso'
        });
      } else {
        const { error } = await supabase
          .from('organizations')
          .insert({
            name: formData.name,
            slug: formData.slug
          });
        
        if (error) throw error;
        
        toast({
          title: 'Sucesso',
          description: 'Organização criada com sucesso'
        });
      }
      
      await loadOrganizations();
      setIsCreateOpen(false);
      setEditingOrg(null);
      setFormData({ name: '', slug: '' });
    } catch (error) {
      console.error('Erro ao salvar organização:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a organização',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      slug: org.slug
    });
    setIsCreateOpen(true);
  };

  const handleDelete = async (orgId: string) => {
    if (!confirm('Tem certeza que deseja desativar esta organização?')) return;
    
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', orgId);
      
      if (error) throw error;
      
      toast({
        title: 'Sucesso',
        description: 'Organização desativada com sucesso'
      });
      await loadOrganizations();
    } catch (error) {
      console.error('Erro ao desativar organização:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível desativar a organização',
        variant: 'destructive'
      });
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  if (loading) {
    return <div>Carregando organizações...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Organizações</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingOrg(null);
              setFormData({ name: '', slug: '' });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Organização
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingOrg ? 'Editar Organização' : 'Nova Organização'}
              </DialogTitle>
              <DialogDescription>
                {editingOrg ? 'Editar informações da organização' : 'Criar uma nova organização'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        name,
                        slug: generateSlug(name)
                      }));
                    }}
                    placeholder="Nome da organização"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="slug-da-organizacao"
                    required
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingOrg ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criada em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map((org) => (
            <TableRow key={org.id}>
              <TableCell className="font-medium">{org.name}</TableCell>
              <TableCell>
                <code className="text-sm bg-muted px-2 py-1 rounded">{org.slug}</code>
              </TableCell>
              <TableCell>
                <Badge variant={org.is_active ? 'default' : 'secondary'}>
                  {org.is_active ? 'Ativa' : 'Inativa'}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(org.created_at).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(org)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(org.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}