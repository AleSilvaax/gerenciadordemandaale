
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy, UserPlus, Check, Users, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { createTeam, getCurrentTeam, joinTeamByCode, getTeamMembers } from "@/services/teamService";
import { TeamMember } from "@/types/serviceTypes";

const TeamManagement = () => {
  const { toast } = useToast();
  const [team, setTeam] = useState<{id: string, name: string, invite_code: string} | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar informações da equipe ao montar o componente
  useEffect(() => {
    const loadTeamData = async () => {
      try {
        const teamData = await getCurrentTeam();
        setTeam(teamData);

        if (teamData) {
          const members = await getTeamMembers();
          setTeamMembers(members);
        }
      } catch (error) {
        console.error("Erro ao carregar dados da equipe:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamData();
  }, []);

  // Função para criar uma nova equipe
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um nome para a equipe",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const result = await createTeam(newTeamName);
      if (result) {
        setTeam(result);
        toast({
          title: "Equipe criada",
          description: `A equipe ${newTeamName} foi criada com sucesso!`,
        });
        
        // Recarregar membros da equipe
        const members = await getTeamMembers();
        setTeamMembers(members);
      }
    } catch (error) {
      console.error("Erro ao criar equipe:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Função para entrar em uma equipe usando código de convite
  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o código de convite",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      const success = await joinTeamByCode(inviteCode);
      if (success) {
        // Recarregar dados da equipe após entrar
        const teamData = await getCurrentTeam();
        setTeam(teamData);
        
        if (teamData) {
          const members = await getTeamMembers();
          setTeamMembers(members);
        }
      }
    } catch (error) {
      console.error("Erro ao entrar na equipe:", error);
    } finally {
      setIsJoining(false);
    }
  };

  // Função para copiar código de convite
  const copyInviteCode = () => {
    if (team?.invite_code) {
      navigator.clipboard.writeText(team.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Código copiado",
        description: "Código de convite copiado para a área de transferência",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-20 page-transition">
      <div className="flex items-center mb-6">
        <Link to="/" className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary border border-white/10 mr-4">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">Gerenciar Equipe</h1>
      </div>

      {team ? (
        // Exibir informações da equipe existente
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{team.name}</CardTitle>
              <CardDescription>Informações da sua equipe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Código de convite:</p>
                  <div className="flex items-center mt-1">
                    <code className="bg-secondary p-2 rounded text-sm flex-1">
                      {team.invite_code}
                    </code>
                    <Button variant="ghost" size="icon" onClick={copyInviteCode} className="ml-2">
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Compartilhe este código com os membros que deseja adicionar à sua equipe.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <Users size={20} className="mr-2" />
              Membros da equipe ({teamMembers.length})
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {teamMembers.map((member) => (
                <Card key={member.id} className="overflow-hidden">
                  <CardContent className="p-4 flex flex-col items-center">
                    <TeamMemberAvatar
                      src={member.avatar}
                      name={member.name}
                      size="lg"
                      className="mb-3"
                    />
                    <p className="font-medium text-center">{member.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {member.role === "tecnico" && "Técnico"}
                      {member.role === "administrador" && "Admin"}
                      {member.role === "gestor" && "Gestor"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Opções para criar ou entrar em uma equipe
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Criar uma equipe</CardTitle>
              <CardDescription>
                Crie uma nova equipe para gerenciar seus técnicos e serviços
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3">
                <Input
                  placeholder="Nome da equipe"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleCreateTeam} 
                  disabled={isCreating || !newTeamName.trim()}
                >
                  <Plus size={16} className="mr-2" />
                  {isCreating ? "Criando..." : "Criar Equipe"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center my-4">
            <p className="text-sm text-muted-foreground">ou</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Entrar em uma equipe</CardTitle>
              <CardDescription>
                Entre em uma equipe existente usando um código de convite
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3">
                <Input
                  placeholder="Código de convite"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="flex-1"
                  maxLength={8}
                />
                <Button 
                  onClick={handleJoinTeam} 
                  disabled={isJoining || !inviteCode.trim()}
                >
                  <UserPlus size={16} className="mr-2" />
                  {isJoining ? "Entrando..." : "Entrar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
