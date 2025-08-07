import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getTeamMembers } from "@/services/servicesDataService";
import { TeamMember } from "@/types/serviceTypes";
import { toast } from "sonner";
import { X, Users, UserPlus } from "lucide-react";

interface MultiTechnicianAssignerProps {
  currentTechnicians?: TeamMember[];
  onAssign: (technicians: TeamMember[]) => Promise<void>;
}

export const MultiTechnicianAssigner: React.FC<MultiTechnicianAssignerProps> = ({
  currentTechnicians = [],
  onAssign
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<TeamMember[]>(currentTechnicians);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getTeamMembers()
      .then(setTeamMembers)
      .catch(() => toast.error("Erro ao carregar técnicos."));
  }, []);

  useEffect(() => {
    setSelectedTechnicians(currentTechnicians);
  }, [currentTechnicians]);

  const handleTechnicianToggle = (technician: TeamMember, checked: boolean) => {
    if (checked) {
      setSelectedTechnicians(prev => [...prev, technician]);
    } else {
      setSelectedTechnicians(prev => prev.filter(t => t.id !== technician.id));
    }
  };

  const removeTechnician = (technicianId: string) => {
    setSelectedTechnicians(prev => prev.filter(t => t.id !== technicianId));
  };

  const handleAssign = async () => {
    setLoading(true);
    try {
      await onAssign(selectedTechnicians);
      toast.success(
        selectedTechnicians.length === 0
          ? "Técnicos removidos com sucesso!"
          : `${selectedTechnicians.length} técnico(s) atribuído(s) com sucesso!`
      );
    } catch (e) {
      toast.error("Falha ao atribuir técnicos");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    if (selectedTechnicians.length !== currentTechnicians.length) return true;
    return !selectedTechnicians.every(selected => 
      currentTechnicians.some(current => current.id === selected.id)
    );
  };

  return (
    <Card className="border border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4" />
          Gerenciar Técnicos Atribuídos
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Técnicos Selecionados */}
        {selectedTechnicians.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Técnicos Selecionados ({selectedTechnicians.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedTechnicians.map((technician) => (
                <Badge
                  key={technician.id}
                  variant="secondary"
                  className="flex items-center gap-2 pr-1 bg-primary/10 text-primary border-primary/20"
                >
                  <span>{technician.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-primary/20"
                    onClick={() => removeTechnician(technician.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <Separator />
          </div>
        )}

        {/* Lista de Técnicos Disponíveis */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Técnicos Disponíveis
          </h4>
          
          <ScrollArea className="h-[200px] border rounded-lg">
            <div className="p-3 space-y-2">
              {teamMembers.map((technician) => {
                const isSelected = selectedTechnicians.some(t => t.id === technician.id);
                
                return (
                  <div
                    key={technician.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={`technician-${technician.id}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => 
                        handleTechnicianToggle(technician, checked as boolean)
                      }
                    />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {technician.avatar ? (
                          <img 
                            src={technician.avatar} 
                            alt={technician.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-primary">
                            {technician.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{technician.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {technician.role || 'Técnico'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {teamMembers.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum técnico disponível</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleAssign} 
            disabled={loading || !hasChanges()}
            className="flex-1"
          >
            {loading ? "Salvando..." : "Atualizar Atribuições"}
          </Button>
          
          {selectedTechnicians.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setSelectedTechnicians([])}
              disabled={loading}
            >
              Limpar Tudo
            </Button>
          )}
        </div>

        {/* Resumo */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/30">
          {selectedTechnicians.length === 0 
            ? "Nenhum técnico será atribuído" 
            : `${selectedTechnicians.length} técnico(s) será(ão) atribuído(s) a esta demanda`
          }
        </div>
      </CardContent>
    </Card>
  );
};