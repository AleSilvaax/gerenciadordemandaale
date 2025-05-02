
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Users, Key, Plus, ArrowRight } from "lucide-react";
import { createTeam, getCurrentTeam, joinTeamByCode } from "@/services/teamService";
import { toast } from "sonner";
import { TeamMember } from '@/types/serviceTypes';
import { useAuth } from "@/context/AuthContext";

const TeamManagement: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [teamName, setTeamName] = useState<string>("");
  const [inviteCode, setInviteCode] = useState<string>("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentTeam, setCurrentTeam] = useState<{ id: string, name: string, invite_code: string } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchTeamInfo();
  }, []);

  const fetchTeamInfo = async () => {
    setLoading(true);
    try {
      const teamData = await getCurrentTeam();
      if (teamData) {
        setCurrentTeam(teamData);
      }
    } catch (error) {
      console.error("Erro ao buscar informações da equipe:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast.error("O nome da equipe não pode estar vazio");
      return;
    }
    
    setLoading(true);
    try {
      const result = await createTeam(teamName);
      if (result) {
        toast.success("Equipe criada com sucesso!");
        setCurrentTeam({ 
          id: result.id, 
          name: teamName, // Adicionando o nome aqui
          invite_code: result.invite_code 
        });
        setTeamName("");
      }
    } catch (error) {
      console.error("Erro ao criar equipe:", error);
      toast.error("Falha ao criar a equipe");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) {
      toast.error("O código de convite não pode estar vazio");
      return;
    }
    
    setLoading(true);
    try {
      const joined = await joinTeamByCode(inviteCode);
      if (joined) {
        toast.success("Você entrou na equipe com sucesso!");
        fetchTeamInfo();
        setInviteCode("");
      }
    } catch (error) {
      console.error("Erro ao entrar na equipe:", error);
      toast.error("Falha ao entrar na equipe");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Equipe</h1>
      
      {currentTeam ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2" size={20} />
              Sua equipe: {currentTeam.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Código de convite da equipe</label>
              <div className="flex items-center space-x-2">
                <Input 
                  value={currentTeam.invite_code} 
                  readOnly 
                  className="font-mono text-center"
                />
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(currentTeam.invite_code);
                    toast.success("Código copiado para a área de transferência");
                  }}
                  variant="outline"
                >
                  Copiar
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Compartilhe este código com as pessoas que você deseja convidar para sua equipe.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="mr-2" size={20} />
                Criar uma nova equipe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da equipe</label>
                  <Input 
                    value={teamName} 
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Ex: Assistência Técnica XYZ" 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleCreateTeam} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Equipe
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="mr-2" size={20} />
                Entrar em uma equipe existente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Código de convite</label>
                  <Input 
                    value={inviteCode} 
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Ex: ABC12345"
                    className="font-mono text-center"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleJoinTeam} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar na Equipe <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
