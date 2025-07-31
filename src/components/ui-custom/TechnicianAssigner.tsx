
import React, { useEffect, useState } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getTeamMembers } from "@/services/servicesDataService";
import { TeamMember } from "@/types/serviceTypes";
import { toast } from "sonner";

interface TechnicianAssignerProps {
  currentTechnicianId?: string;
  onAssign: (technician: TeamMember | null) => Promise<void>;
}

export const TechnicianAssigner: React.FC<TechnicianAssignerProps> = ({
  currentTechnicianId,
  onAssign
}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>(currentTechnicianId ?? "none");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getTeamMembers().then(setTeamMembers).catch(() => toast.error("Erro ao carregar técnicos."));
  }, []);

  useEffect(() => {
    setSelectedTechnicianId(currentTechnicianId ?? "none");
  }, [currentTechnicianId]);

  const handleAssign = async () => {
    setLoading(true);
    try {
      const chosen = selectedTechnicianId === "none"
        ? null
        : teamMembers.find(t => t.id === selectedTechnicianId) ?? null;
      await onAssign(chosen);
      toast.success("Técnico atribuído com sucesso!");
    } catch (e) {
      toast.error("Falha ao atribuir técnico");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 items-end mt-2">
      <div className="flex-1">
        <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um técnico" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Não atribuído</SelectItem>
            {teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleAssign} disabled={loading}>
        {loading ? "Salvando..." : "Atribuir"}
      </Button>
    </div>
  );
};
