
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
  const [loading, setLoading] = useState<boolean>(false);
  const [teamName, setTeamName] = useState<string>("");
  const [inviteCode, setInviteCode] = useState<string>("");
  const [currentTeam, setCurrentTeam] = useState<{ id: string, name: string, invite_code: string } | null>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchTeamInfo();
  }, []);

  const fetchTeamInfo = async () => {
    setInitialLoading(true);
    try {
      const teamData = await getCurrentTeam();
      console.log("Dados da equipe carregados:", teamData);
      if (teamData) {
        setCurrentTeam(teamData);
      }
    } catch (error) {
      console.error("Erro ao buscar informações da equipe:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast.error("O nome da equipe não pode estar vazio");
      return;
    }
    
    setLoading(true);
    try {
      console.log("Iniciando criação da equipe:", teamName);
      const result = await createTeam(teamName);
      console.log("Resultado da criação:", result);
      
      if (result) {
        toast.success("Equipe criada com sucesso!");
        setCurrentTeam({ 
          id: result.id, 
          name: teamName,
          invite_code: result.invite_code 
        });
        setTeamName("");
        // Recarregar as informações da equipe para garantir dados atualizados
        await fetchTeamInfo();
      } else {
        toast.error("Falha ao criar a equipe");
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
        await fetchTeamInfo();
        setInviteCode("");
      }
    } catch (error) {
      console.error("Erro ao entrar na equipe:", error);
      toast.error("Falha ao entrar na equipe");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={40} className="animate-spin" />
        <span className="ml-2">Carregando informações da equipe...</span>
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
                    disabled={loading}
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
                    disabled={loading}
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
