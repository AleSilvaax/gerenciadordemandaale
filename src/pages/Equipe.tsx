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
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";

interface Permission {
  id: string;
  title: string;
  question: string;
  roles: UserRole[];
}

const Equipe: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
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
    if (newMember.name.trim()) {
      setIsSaving(true);
      
      try {
        const newTeamMember = await addTeamMember({
          name: newMember.name,
          role: newMember.role,
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
      toast.error("Preencha nome do membro.");
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
        
        const photoUrl = event.target.result.toString();
        
        try {
          const success = await updateTeamMember(memberId, { avatar: photoUrl });
          
          if (success) {
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
          return {
            ...permission,
            roles: permission.roles.filter(r => r !== role)
          };
        } else {
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
      localStorage.setItem("permissions", JSON.stringify(permissions));
      toast.success("As permissões da equipe foram atualizadas com sucesso.");
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Falha ao salvar as permissões.");
    } finally {
      setIsSaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div 
        className="container mx-auto p-6 pb-24 space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8">
          <Link 
            to="/" 
            className="h-12 w-12 rounded-xl flex items-center justify-center bg-card border border-border/50 hover:bg-accent hover:border-accent/50 transition-all duration-200 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Minha Equipe
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie membros e permissões da equipe</p>
          </div>
        </motion.div>
        
        {/* Team Management Section */}
        <motion.div 
          variants={itemVariants}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Gerenciar Equipe</h2>
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as UserRole | "todos")}
            >
              <SelectTrigger className="w-40 bg-background/50">
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
                <motion.div 
                  className="flex flex-col items-center space-y-2 min-w-fit cursor-pointer group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="h-16 w-16 rounded-xl flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary/30 group-hover:border-primary/50 group-hover:bg-primary/20 transition-all duration-200">
                    <UserPlus size={24} className="text-primary" />
                  </div>
                  <span className="text-sm font-medium whitespace-nowrap">Adicionar</span>
                </motion.div>
              </DialogTrigger>
              <DialogContent className="bg-card/95 backdrop-blur-md border border-border/50">
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
                      className="bg-background/50"
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
                      className="bg-background/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone (opcional)</Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Função</Label>
                    <Select
                      value={newMember.role}
                      onValueChange={(value) => setNewMember({ ...newMember, role: value as UserRole })}
                    >
                      <SelectTrigger className="bg-background/50">
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
                  <Button onClick={handleAddMember} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Adicionar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {filteredTeam.map((member, index) => (
              <motion.div 
                key={member.id} 
                className="flex flex-col items-center space-y-2 min-w-fit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="relative group">
                  <TeamMemberAvatar 
                    src={member.avatar} 
                    name={member.name} 
                    size="lg"
                    className="ring-2 ring-border/20 group-hover:ring-primary/30 transition-all duration-200"
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
                      <button className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 hover:bg-primary/90 transition-colors shadow-lg">
                        {uploadingAvatar === member.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <PlusCircle size={14} />
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-md border border-border/50">
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
                  <span className="text-sm font-medium whitespace-nowrap">{member.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {member.role === "tecnico" && "Técnico"}
                    {member.role === "administrador" && "Admin"}
                    {member.role === "gestor" && "Gestor"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Permissions Section */}
        <motion.div 
          variants={itemVariants}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-6">Permissões do Sistema</h2>
          
          <div className="space-y-6">
            {permissions.map((permission, index) => (
              <motion.div 
                key={permission.id} 
                className="bg-background/30 rounded-xl p-4 border border-border/30"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <h3 className="text-sm font-medium text-muted-foreground mb-1">{permission.title}</h3>
                <p className="text-base mb-4">{permission.question}</p>
                
                <div className="flex flex-wrap gap-2">
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
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
      
      {/* Fixed Save Button */}
      <motion.div 
        className="fixed bottom-6 left-6 right-6 z-50"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button 
          className="w-full bg-primary/90 backdrop-blur-md hover:bg-primary shadow-lg border border-primary/20" 
          onClick={handleSaveChanges} 
          disabled={isSaving}
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 size={20} className="mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save size={20} className="mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </motion.div>
      
      <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-md border border-border/50">
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
