import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, PlusCircle, Trash2, UserPlus, Upload, User, Loader2, Settings, Edit, Mail, Phone, Shield, Calendar, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TeamMember, UserRole } from "@/types/serviceTypes";
import { getTeamMembers, updateTeamMember, addTeamMember, deleteTeamMember } from "@/services/servicesDataService";
import { useEnhancedAuth } from "@/context/EnhancedAuthContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CompactTeamMemberCard } from "@/components/ui-custom/CompactTeamMemberCard";
import { useIsMobile } from "@/hooks/use-mobile";

const Equipe: React.FC = () => {
  const { user } = useEnhancedAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamStats, setTeamStats] = useState({
    total: 0,
    admins: 0,
    gestores: 0,
    tecnicos: 0,
    activeServices: 0
  });
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [newMember, setNewMember] = useState({ 
    name: "", 
    role: "tecnico" as UserRole,
    email: "",
    phone: "",
    bio: ""
  });
  const [uploadingAvatar, setUploadingAvatar] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | "todos">("todos");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  
  // Load team members from API
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        const members = await getTeamMembers();
        if (members && members.length > 0) {
          setTeam(members);
          calculateTeamStats(members);
        }
      } catch (error) {
        console.error("Error loading team members:", error);
      }
    };
    
    loadTeamMembers();
  }, []);

  const calculateTeamStats = async (members: TeamMember[]) => {
    const stats = {
      total: members.length,
      admins: members.filter(m => m.role === 'administrador').length,
      gestores: members.filter(m => m.role === 'gestor').length,
      tecnicos: members.filter(m => m.role === 'tecnico').length,
      activeServices: 0
    };

    // Buscar serviços ativos dos técnicos
    try {
      const { data: activeServices } = await supabase
        .from('services')
        .select('id')
        .eq('status', 'pendente');
      
      stats.activeServices = activeServices?.length || 0;
    } catch (error) {
      console.error('Erro ao buscar serviços ativos:', error);
    }

    setTeamStats(stats);
  };

  const filteredTeam = team.filter(member => 
    roleFilter === "todos" || member.role === roleFilter
  );

  const handleAddMember = async () => {
    if (newMember.email.trim() && newMember.role) {
      setIsSaving(true);
      
      try {
        // Em vez de adicionar diretamente, vamos criar um convite
        const { data, error } = await supabase
          .from('user_invites')
          .insert({
            email: newMember.email,
            role: newMember.role,
            organization_id: '00000000-0000-0000-0000-000000000001',
            invited_by: user?.id
          })
          .select()
          .single();

        if (error) throw error;
        
        setNewMember({ name: "", role: "tecnico", email: "", phone: "", bio: "" });
        setIsAddingMember(false);
        
        toast.success("Convite enviado!", {
          description: `Um convite foi enviado para ${newMember.email} com o papel de ${getRoleDisplayName(newMember.role)}.`
        });
      } catch (error: any) {
        console.error("Error sending invite:", error);
        toast.error("Falha ao enviar convite: " + (error.message || "Erro desconhecido"));
      } finally {
        setIsSaving(false);
      }
    } else {
      toast.error("Preencha o email e selecione um papel.");
    }
  };

  const handleEditMember = async () => {
    if (!editingMember) return;
    
    setIsSaving(true);
    try {
      await updateTeamMember(editingMember.id, editingMember);
      
      const updatedTeam = team.map(member =>
        member.id === editingMember.id ? editingMember : member
      );
      setTeam(updatedTeam);
      calculateTeamStats(updatedTeam);
      setEditingMember(null);
      
      toast.success("Membro atualizado com sucesso!");
    } catch (error) {
      console.error("Error updating team member:", error);
      toast.error("Erro ao atualizar membro.");
    } finally {
      setIsSaving(false);
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
        calculateTeamStats(updatedTeam);
        
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

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "administrador":
        return <Shield className="w-4 h-4" />;
      case "gestor":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
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
        className="container mx-auto p-3 md:p-6 pb-8 space-y-4 md:space-y-8 mobile-fit"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-4 md:mb-8">
          <div className="flex items-center gap-2 md:gap-4">
            <Link 
              to="/" 
              className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-accent hover:border-accent/50 transition-all duration-200 group flex-shrink-0"
            >
              <ArrowLeft size={18} className="md:w-5 md:h-5 group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mobile-team-title">
                Gestão de Equipe
              </h1>
              <p className="text-xs md:text-base text-muted-foreground mt-1 mobile-team-description">
                Gerencie membros e organize sua equipe
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => navigate("/settings")}
            variant="outline"
            size="sm"
            className="bg-card/50 backdrop-blur-sm border-border/50 btn-mobile flex-shrink-0"
          >
            <Settings className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Configurações</span>
          </Button>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4 mb-4 md:mb-8">
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-muted-foreground mobile-truncate">Total</p>
                  <p className="text-lg md:text-2xl font-bold">{teamStats.total}</p>
                </div>
                <User className="w-6 h-6 md:w-8 md:h-8 text-primary/60 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-muted-foreground mobile-truncate">Admins</p>
                  <p className="text-lg md:text-2xl font-bold text-red-500">{teamStats.admins}</p>
                </div>
                <Shield className="w-6 h-6 md:w-8 md:h-8 text-red-500/60 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-muted-foreground mobile-truncate">Gestores</p>
                  <p className="text-lg md:text-2xl font-bold text-blue-500">{teamStats.gestores}</p>
                </div>
                <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-blue-500/60 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-muted-foreground mobile-truncate">Técnicos</p>
                  <p className="text-lg md:text-2xl font-bold text-green-500">{teamStats.tecnicos}</p>
                </div>
                <User className="w-6 h-6 md:w-8 md:h-8 text-green-500/60 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50 col-span-2 md:col-span-1">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-muted-foreground mobile-truncate">Ativos</p>
                  <p className="text-lg md:text-2xl font-bold text-orange-500">{teamStats.activeServices}</p>
                </div>
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-orange-500/60 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Main Content with Tabs */}
        <motion.div 
          variants={itemVariants}
          className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-3 md:p-6 shadow-lg mobile-fit"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-background/50 mb-4">
              <TabsTrigger value="overview" className="text-xs md:text-sm">Visão Geral</TabsTrigger>
              <TabsTrigger value="management" className="text-xs md:text-sm">Gerenciamento</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-3 md:mt-6">
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                  <h2 className="text-lg md:text-xl font-semibold mobile-team-title">Membros da Equipe</h2>
                  <div className="flex gap-3 mobile-scroll-buttons">
                    <Select
                      value={roleFilter}
                      onValueChange={(value) => setRoleFilter(value as UserRole | "todos")}
                    >
                      <SelectTrigger className="w-32 md:w-40 bg-background/50 text-xs md:text-sm">
                        <SelectValue placeholder="Filtrar" />
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

                {/* Desktop Team Members */}
                {!isMobile && (
                  <div className="space-y-4">
                    {filteredTeam.map((member, index) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="bg-background/30 border border-border/30 hover:bg-background/50 transition-all duration-200">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 min-w-0 flex-1">
                                <div className="relative flex-shrink-0">
                                  <TeamMemberAvatar 
                                    src={member.avatar} 
                                    name={member.name} 
                                    size="md"
                                    className="ring-2 ring-border/20 w-12 h-12"
                                  />
                                  {uploadingAvatar === member.id && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold truncate">{member.name}</h3>
                                    <Badge className={`inline-flex items-center gap-1 text-xs ${getRoleColor(member.role)}`}>
                                      {getRoleIcon(member.role)}
                                      <span>{getRoleDisplayName(member.role)}</span>
                                    </Badge>
                                  </div>
                                  
                                   <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                     {member.email && (
                                       <div className="flex items-center gap-1">
                                         <Mail className="w-4 h-4 flex-shrink-0" />
                                         <span className="truncate">{member.email}</span>
                                       </div>
                                     )}
                                     {member.phone && (
                                       <div className="flex items-center gap-1">
                                         <Phone className="w-4 h-4 flex-shrink-0" />
                                         <span className="truncate">{member.phone}</span>
                                       </div>
                                     )}
                                     <div className="flex items-center gap-1">
                                       <Calendar className="w-4 h-4 flex-shrink-0" />
                                       <span>Membro desde {member.stats?.joinDate || 'N/A'}</span>
                                     </div>
                                   </div>
                                   
                                   {/* Performance Stats */}
                                   <div className="flex items-center gap-4 text-sm mt-2">
                                     <div className="flex items-center gap-1">
                                       <CheckCircle2 className="w-4 h-4 text-green-500" />
                                       <span className="text-green-500">{member.stats?.completedServices || 0} concluídos</span>
                                     </div>
                                     <div className="flex items-center gap-1">
                                       <Clock className="w-4 h-4 text-orange-500" />
                                       <span className="text-orange-500">{member.stats?.pendingServices || 0} pendentes</span>
                                     </div>
                                     <div className="flex items-center gap-1">
                                       <span className="text-yellow-500">⭐ {(member.stats?.avgRating || 0).toFixed(1)}</span>
                                     </div>
                                   </div>
                                </div>
                              </div>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-md border border-border/50">
                                  <DropdownMenuItem onClick={() => setEditingMember(member)}>
                                    <Edit size={16} className="mr-2" />
                                    Editar
                                  </DropdownMenuItem>
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
                              
                              <input
                                type="file"
                                accept="image/*"
                                ref={(el) => fileInputRefs.current[member.id] = el}
                                onChange={(e) => handleFileChange(member.id, e)}
                                className="hidden"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Mobile Team Members */}
                {isMobile && (
                  <div className="space-y-3">
                    {filteredTeam.map((member) => (
                      <CompactTeamMemberCard
                        key={member.id}
                        member={member}
                        onEdit={setEditingMember}
                      />
                    ))}
                  </div>
                )}

                {filteredTeam.length === 0 && (
                  <motion.div 
                    className="text-center py-8 md:py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <User className="mx-auto h-8 w-8 md:h-12 md:w-12 text-muted-foreground mb-4" />
                    <h3 className="text-base md:text-lg font-medium mb-2">Nenhum membro encontrado</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      {roleFilter === "todos" 
                        ? "Adicione o primeiro membro à sua equipe" 
                        : `Nenhum membro com o papel "${getRoleDisplayName(roleFilter)}" encontrado`
                      }
                    </p>
                  </motion.div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="management" className="mt-3 md:mt-6">
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                  <h2 className="text-lg md:text-xl font-semibold mobile-team-title">Gerenciar Equipe</h2>
                  <Button onClick={() => setIsAddingMember(true)} className="button-mobile">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Adicionar Membro
                  </Button>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                  <Card className="bg-background/30 border border-border/30">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Adicionar Membro
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Convide novos membros para sua equipe
                      </p>
                      <Button 
                        onClick={() => setIsAddingMember(true)}
                        className="w-full"
                      >
                        Adicionar
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-background/30 border border-border/30">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Configurações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Gerencie permissões e configurações
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => navigate("/settings")}
                        className="w-full"
                      >
                        Configurar
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-background/30 border border-border/30">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Relatórios
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Visualize relatórios de desempenho
                      </p>
                      <Button 
                        variant="outline"
                        className="w-full"
                        disabled
                      >
                        Em Breve
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
      
      {/* Add Member Dialog */}
      <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
        <DialogContent className="bg-card/95 backdrop-blur-md border border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar novo membro</DialogTitle>
            <DialogDescription>
              Envie um convite por email para adicionar um novo membro à equipe.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
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
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                className="bg-background/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Função *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="bio">Biografia</Label>
              <Textarea
                id="bio"
                placeholder="Descreva brevemente o membro..."
                value={newMember.bio}
                onChange={(e) => setNewMember({ ...newMember, bio: e.target.value })}
                className="bg-background/50"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingMember(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddMember} disabled={isSaving || !newMember.email.trim()}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent className="bg-card/95 backdrop-blur-md border border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle>Editar membro</DialogTitle>
            <DialogDescription>
              Atualize as informações do membro da equipe.
            </DialogDescription>
          </DialogHeader>
          
          {editingMember && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={editingMember.name || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingMember.email || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={editingMember.phone || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-role">Função</Label>
                <Select
                  value={editingMember.role}
                  onValueChange={(value) => setEditingMember({ ...editingMember, role: value as UserRole })}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEditMember} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
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
