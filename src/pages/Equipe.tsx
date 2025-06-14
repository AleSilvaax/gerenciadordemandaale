import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Save, PlusCircle, Trash2, UserPlus, Upload, User, ShieldCheck, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { TeamMember, UserRole } from "@/types/serviceTypes";
import { getTeamMembers, updateTeamMember, addTeamMember, deleteTeamMember } from "@/services/servicesDataService";
import { useAuth } from "@/context/AuthContext";

interface Permission {
  id: string;
  title: string;
  question: string;
  roles: UserRole[];
}

const Equipe: React.FC = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({ 
    name: "", 
    role: "tecnico" as UserRole,
    email: "",
    phone: ""
  });
  const [uploadingAvatar, setUploadingAvatar] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | "todos">("todos");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
  
  // Load team members from API
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        const members = await getTeamMembers();
        if (members && members.length > 0) {
          setTeam(members);
        }
      } catch (error) {
        console.error("Error loading team members:", error);
      }
    };
    
    loadTeamMembers();
    
    // Load permissions from localStorage
    const storedPermissions = localStorage.getItem('permissions');
    if (storedPermissions) {
      try {
        const parsedPermissions = JSON.parse(storedPermissions);
        setPermissions(parsedPermissions);
      } catch (error) {
        console.error("Error loading permissions:", error);
      }
    }
  }, []);

  const filteredTeam = team.filter(member => 
    roleFilter === "todos" || member.role === roleFilter
  );

  const handleAddMember = async () => {
    if (newMember.name.trim() && newMember.email.trim()) {
      setIsSaving(true);
      
      try {
        const newTeamMember = await addTeamMember({
          name: newMember.name,
          role: newMember.role,
          email: newMember.email,
          phone: newMember.phone,
          avatar: ""
        });
        
        setTeam([...team, newTeamMember]);
        setNewMember({ name: "", role: "tecnico", email: "", phone: "" });
        setIsAddingMember(false);
        
        toast.success(`Membro adicionado`,
          {
            description: `${newMember.name} foi adicionado à equipe como ${newMember.role}.`
          }
        );
      } catch (error) {
        console.error("Error adding team member:", error);
        toast.error("Falha ao adicionar novo membro.");
      } finally {
        setIsSaving(false);
      }
    } else {
      toast.error("Preencha nome e email do membro.");
    }
  };

  const handleDeleteMember = (id: string) => {
    setMemberToDelete(id);
  };

  const confirmDeleteMember = async () => {
    if (memberToDelete) {
      setIsSaving(true);
      
      try {
        const deletedMember = team.find(member => member.id === memberToDelete);
        await deleteTeamMember(memberToDelete);
        
        const updatedTeam = team.filter(member => member.id !== memberToDelete);
        setTeam(updatedTeam);
        
        toast.success(`Membro removido`,
          {
            description: `${deletedMember?.name} foi removido da equipe.`
          }
        );
      } catch (error) {
        console.error("Error deleting team member:", error);
        toast.error("Falha ao remover membro da equipe.");
      } finally {
        setMemberToDelete(null);
        setIsSaving(false);
      }
    }
  };

  const handleFileChange = async (memberId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingAvatar(memberId);
      
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (!event.target || !event.target.result) {
          toast.error("Falha ao ler a imagem");
          setUploadingAvatar(null);
          return;
        }
        
        // Get the data URL from the file
        const photoUrl = event.target.result.toString();
        
        try {
          // Update the team member with the new photo
          const success = await updateTeamMember(memberId, { avatar: photoUrl });
          
          if (success) {
            // Update local state
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
            
            toast.success("A foto do perfil foi atualizada com sucesso.");
          } else {
            throw new Error("Failed to update team member photo");
          }
        } catch (error) {
          console.error("Error updating team member photo:", error);
          toast.error("Falha ao atualizar a foto do membro.");
        } finally {
          setUploadingAvatar(null);
        }
      };
      
      reader.onerror = () => {
        toast.error("Erro ao ler o arquivo");
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
  
  const handleSaveChanges = async () => {
    setIsSaving(true);
    
    try {
      // Save permissions to localStorage
      localStorage.setItem("permissions", JSON.stringify(permissions));
      
      toast.success("As permissões da equipe foram atualizadas com sucesso.");
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Falha ao salvar as permissões.");
    } finally {
      setIsSaving(false);
    }
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone (opcional)</Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
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
      
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-md border-t border-white/10 p-4 z-10">
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
