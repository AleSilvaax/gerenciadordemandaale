
import React, { useState, useRef } from "react";
import { ArrowLeft, Save, PlusCircle, Trash2, UserPlus, Upload, User, ShieldCheck, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { currentUser, teamMembers, UserRole } from "@/data/mockData";

interface Permission {
  id: string;
  title: string;
  question: string;
  roles: UserRole[];
}

const Equipe: React.FC = () => {
  const [team, setTeam] = useState(teamMembers);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", role: "tecnico" as UserRole });
  const [uploadingAvatar, setUploadingAvatar] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | "todos">("todos");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const { toast } = useToast();

  // Permissions list
  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: "view_all",
      title: "Acessar a todos os chamados",
      question: "Quem Pode Ter Acesso?",
      roles: ["administrador", "gestor"]
    },
    {
      id: "change_status",
      title: "Modificar status dos chamados",
      question: "Quem Pode Modificar?",
      roles: ["tecnico", "administrador", "gestor"]
    },
    {
      id: "add_members",
      title: "Adicionar membros na equipe",
      question: "Quem Pode Adicionar Novos Membros?",
      roles: ["administrador", "gestor"]
    },
    {
      id: "view_stats",
      title: "Acessar as estatísticas",
      question: "Quem Pode Acessar As Estatísticas?",
      roles: ["administrador", "gestor"]
    }
  ]);

  const filteredTeam = team.filter(member => 
    roleFilter === "todos" || member.role === roleFilter
  );

  const handleAddMember = () => {
    if (newMember.name.trim()) {
      const newTeamMember = {
        id: `${team.length + 10}`,
        name: newMember.name,
        avatar: "",
        role: newMember.role
      };
      
      setTeam([...team, newTeamMember]);
      setNewMember({ name: "", role: "tecnico" });
      setIsAddingMember(false);
      
      toast({
        title: "Membro adicionado",
        description: `${newMember.name} foi adicionado à equipe como ${newMember.role}.`,
      });
    }
  };

  const handleDeleteMember = (id: string) => {
    setMemberToDelete(id);
  };

  const confirmDeleteMember = () => {
    if (memberToDelete) {
      const updatedTeam = team.filter(member => member.id !== memberToDelete);
      const deletedMember = team.find(member => member.id === memberToDelete);
      
      setTeam(updatedTeam);
      setMemberToDelete(null);
      
      toast({
        title: "Membro removido",
        description: `${deletedMember?.name} foi removido da equipe.`,
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (memberId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingAvatar(memberId);
      
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target || !event.target.result) {
          toast({
            title: "Erro",
            description: "Falha ao ler a imagem",
            variant: "destructive",
          });
          setUploadingAvatar(null);
          return;
        }
        
        // Get the data URL from the file
        const photoUrl = event.target.result.toString();
        
        // Update the team member with the actual uploaded photo
        setTimeout(() => {
          const updatedTeam = team.map(member => {
            if (member.id === memberId) {
              return {
                ...member,
                avatar: photoUrl
              };
            }
            return member;
          });
          
          setTeam(updatedTeam);
          setUploadingAvatar(null);
          
          toast({
            title: "Foto atualizada",
            description: "A foto do perfil foi atualizada com sucesso.",
          });
        }, 800);
      };
      
      reader.onerror = () => {
        toast({
          title: "Erro",
          description: "Erro ao ler o arquivo",
          variant: "destructive",
        });
        setUploadingAvatar(null);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleUpdatePermission = (permissionId: string, role: UserRole) => {
    setPermissions(permissions.map(permission => {
      if (permission.id === permissionId) {
        if (permission.roles.includes(role)) {
          // Remove role if it already exists
          return {
            ...permission,
            roles: permission.roles.filter(r => r !== role)
          };
        } else {
          // Add role if it doesn't exist
          return {
            ...permission,
            roles: [...permission.roles, role]
          };
        }
      }
      return permission;
    }));
  };
  
  const handleSaveChanges = () => {
    setIsSaving(true);
    
    // Simulate saving to backend
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Permissões salvas",
        description: "As permissões da equipe foram atualizadas com sucesso.",
      });
    }, 800);
  };

  return (
    <div className="min-h-screen p-4 pb-20 page-transition">
      <div className="flex items-center mb-6">
        <Link to="/" className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary border border-white/10 mr-4">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">Minha equipe</h1>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg">Gerenciar minha equipe</h2>
        <Select
          value={roleFilter}
          onValueChange={(value) => setRoleFilter(value as UserRole | "todos")}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Filtrar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="tecnico">Técnicos</SelectItem>
            <SelectItem value="administrador">Admins</SelectItem>
            <SelectItem value="gestor">Gestores</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex space-x-4 overflow-x-auto scrollbar-none pb-2">
        <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
          <DialogTrigger asChild>
            <div className="flex flex-col items-center space-y-1">
              <button className="h-14 w-14 rounded-full flex items-center justify-center bg-secondary border border-white/20">
                <UserPlus size={20} />
              </button>
              <span className="text-xs whitespace-nowrap">Adicionar</span>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar novo membro</DialogTitle>
              <DialogDescription>
                Preencha as informações para adicionar um novo membro à equipe.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Nome do membro"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select
                  value={newMember.role}
                  onValueChange={(value) => setNewMember({ ...newMember, role: value as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingMember(false)}>Cancelar</Button>
              <Button onClick={handleAddMember}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {filteredTeam.map(member => (
          <div key={member.id} className="flex flex-col items-center space-y-1">
            <div className="relative">
              <TeamMemberAvatar 
                src={member.avatar} 
                name={member.name} 
                size="lg" 
              />
              <input
                type="file"
                accept="image/*"
                ref={(el) => fileInputRefs.current[member.id] = el}
                onChange={(e) => handleFileChange(member.id, e)}
                className="hidden"
              />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="absolute -bottom-1 -right-1 bg-secondary border border-white/20 rounded-full p-1 hover:bg-primary/90 transition-colors">
                    {uploadingAvatar === member.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <PlusCircle size={14} />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => fileInputRefs.current[member.id]?.click()}>
                    <Upload size={16} className="mr-2" />
                    Trocar foto
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteMember(member.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Remover
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs whitespace-nowrap">{member.name}</span>
              <span className="text-xs text-muted-foreground">
                {member.role === "tecnico" && "Técnico"}
                {member.role === "administrador" && "Admin"}
                {member.role === "gestor" && "Gestor"}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 space-y-6">
        <h2 className="text-lg mb-2">Permissões do sistema</h2>
        
        {permissions.map((permission) => (
          <div key={permission.id} className="space-y-2">
            <h3 className="text-sm text-muted-foreground">{permission.title}</h3>
            <p className="text-base">{permission.question}</p>
            
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                size="sm"
                variant={permission.roles.includes("tecnico") ? "default" : "outline"}
                className="rounded-full"
                onClick={() => handleUpdatePermission(permission.id, "tecnico")}
              >
                <User size={14} className="mr-1" />
                Técnico
              </Button>
              
              <Button
                size="sm"
                variant={permission.roles.includes("administrador") ? "default" : "outline"}
                className="rounded-full"
                onClick={() => handleUpdatePermission(permission.id, "administrador")}
              >
                <ShieldCheck size={14} className="mr-1" />
                Administrador
              </Button>
              
              <Button
                size="sm"
                variant={permission.roles.includes("gestor") ? "default" : "outline"}
                className="rounded-full"
                onClick={() => handleUpdatePermission(permission.id, "gestor")}
              >
                <ShieldCheck size={14} className="mr-1" />
                Gestor
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-white/10 p-4 z-10">
        <Button className="w-full" onClick={handleSaveChanges} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save size={18} className="mr-2" />
              Salvar
            </>
          )}
        </Button>
      </div>
      
      <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este membro da equipe? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMember} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Equipe;
