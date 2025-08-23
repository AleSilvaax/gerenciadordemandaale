import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, RefreshCw, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface Team {
  id: string;
  name: string;
}

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName?: string;
  onSuccess: () => void;
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'tecnico',
    teamId: '',
    tempPassword: '',
    mustChangePassword: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const roles = [
    { value: 'tecnico', label: 'Técnico' },
    { value: 'gestor', label: 'Gestor' },
    { value: 'administrador', label: 'Administrador' },
  ];

  // Super admin can create owners
  if (user?.role === 'super_admin') {
    roles.push({ value: 'owner', label: 'Owner' });
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, tempPassword: password }));
  };

  const loadTeams = async () => {
    if (!organizationId) return;

    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;
      setTeams(data || []);
    } catch (error: any) {
      console.error('Error loading teams:', error);
    }
  };

  const createUser = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.tempPassword.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: formData.email.trim(),
          name: formData.name.trim(),
          role: formData.role,
          organizationId,
          teamId: formData.teamId || null,
          tempPassword: formData.tempPassword,
          mustChangePassword: formData.mustChangePassword,
        },
      });

      if (error) throw error;

      if (data.success) {
        setCreatedUser(data.user);
        toast({
          title: "Sucesso",
          description: data.message,
        });
        onSuccess();
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(formData.tempPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
      toast({
        title: "Copiado",
        description: "Senha copiada para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao copiar senha",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      role: 'tecnico',
      teamId: '',
      tempPassword: '',
      mustChangePassword: true,
    });
    setCreatedUser(null);
    setCopiedPassword(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      loadTeams();
      generatePassword();
    }
  }, [isOpen, organizationId]);

  if (createdUser) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-green-600">✅ Usuário Criado com Sucesso!</DialogTitle>
            <DialogDescription>
              O usuário foi criado e pode fazer login com as credenciais abaixo.
            </DialogDescription>
          </DialogHeader>
          
          <Card className="p-4 space-y-4">
            <div>
              <Label className="text-sm font-medium">Nome</Label>
              <p className="text-sm">{createdUser.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <p className="text-sm">{createdUser.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Senha Temporária</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.tempPassword}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyPassword}
                >
                  {copiedPassword ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Role</Label>
              <Badge variant="secondary" className="ml-2">{createdUser.role}</Badge>
            </div>
            {organizationName && (
              <div>
                <Label className="text-sm font-medium">Organização</Label>
                <p className="text-sm">{organizationName}</p>
              </div>
            )}
          </Card>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              ⚠️ <strong>Importante:</strong> Compartilhe essas credenciais de forma segura com o usuário. 
              Ele será obrigado a alterar a senha no primeiro login.
            </p>
          </div>
          
          <DialogFooter>
            <Button onClick={handleClose}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>
            Crie um novo usuário com senha temporária que deve ser alterada no primeiro login.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome completo"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Digite o email"
            />
          </div>
          
          <div>
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {teams.length > 0 && (
            <div>
              <Label htmlFor="team">Equipe (Opcional)</Label>
              <Select
                value={formData.teamId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, teamId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma equipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma equipe</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div>
            <Label htmlFor="tempPassword">Senha Temporária *</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="tempPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.tempPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, tempPassword: e.target.value }))}
                placeholder="Senha temporária"
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generatePassword}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mustChange"
              checked={formData.mustChangePassword}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, mustChangePassword: !!checked }))
              }
            />
            <Label htmlFor="mustChange" className="text-sm">
              Exigir troca de senha no primeiro login
            </Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={createUser} disabled={loading}>
            {loading ? "Criando..." : "Criar Usuário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};