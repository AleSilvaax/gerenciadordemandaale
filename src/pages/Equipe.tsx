
import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, PlusCircle, Trash2, UserPlus, Upload, User, Loader2, Settings } from "lucide-react";
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
import { useNavigate } from "react-router-dom";

const Equipe: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case "tecnico":
        return "Técnico";
      case "administrador":
        return "Administrador";
      case "gestor":
        return "Gestor";
      default:
        return role;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "administrador":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "gestor":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-green-500/10 text-green-500 border-green-500/20";
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
        className="container mx-auto p-6 pb-8 space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="h-12 w-12 rounded-xl flex items-center justify-center bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-accent hover:border-accent/50 transition-all duration-200 group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Minha Equipe
              </h1>
              <p className="text-muted-foreground mt-1">Gerencie membros da equipe</p>
            </div>
          </div>
          
          <Button 
            onClick={() => navigate("/settings")}
            variant="outline"
            className="bg-card/50 backdrop-blur-sm border-border/50"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurações e Permissões
          </Button>
        </motion.div>
        
        {/* Team Management Section */}
        <motion.div 
          variants={itemVariants}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Membros da Equipe</h2>
            <div className="flex gap-3">
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
                  <SelectItem value="administrador">Administradores</SelectItem>
                  <SelectItem value="gestor">Gestores</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Team Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Add Member Card */}
            <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
              <DialogTrigger asChild>
                <motion.div 
                  className="flex flex-col items-center p-6 bg-background/30 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer group hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="h-16 w-16 rounded-full flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors mb-3">
                    <UserPlus size={24} className="text-primary" />
                  </div>
                  <span className="text-sm font-medium text-center">Adicionar Membro</span>
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
            
            {/* Team Members */}
            {filteredTeam.map((member, index) => (
              <motion.div 
                key={member.id} 
                className="flex flex-col items-center p-6 bg-background/30 border border-border/30 rounded-xl hover:bg-background/50 transition-all duration-200 group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="relative mb-4">
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
                      <button className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 hover:bg-primary/90 transition-colors shadow-lg opacity-0 group-hover:opacity-100">
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
                
                <div className="text-center space-y-2">
                  <h3 className="font-medium text-sm">{member.name}</h3>
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.role)}`}>
                    {getRoleDisplayName(member.role)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {filteredTeam.length === 0 && (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum membro encontrado</h3>
              <p className="text-muted-foreground">
                {roleFilter === "todos" 
                  ? "Adicione o primeiro membro à sua equipe" 
                  : `Nenhum membro com o papel "${getRoleDisplayName(roleFilter)}" encontrado`
                }
              </p>
            </motion.div>
          )}
        </motion.div>
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
