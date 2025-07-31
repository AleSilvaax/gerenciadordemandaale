// Arquivo: src/components/ui-custom/TechnicianAssigner.tsx (VERSÃO FINAL E CORRIGIDA)

import React, { useEffect, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { getTeamMembers } from "@/services/servicesDataService";
import { TeamMember } from "@/types/serviceTypes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TechnicianAssignerProps {
  currentTechnicians: TeamMember[];
  onAssign: (technicians: TeamMember[]) => Promise<void>;
}

export const TechnicianAssigner: React.FC<TechnicianAssignerProps> = ({ currentTechnicians, onAssign }) => {
  const [allTeamMembers, setAllTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    getTeamMembers()
      .then(members => setAllTeamMembers(members.filter(m => m.role === 'tecnico')))
      .catch(() => toast.error("Erro ao carregar a lista de técnicos."));
  }, []);

  useEffect(() => {
    // Garante que o estado seja sempre um array
    setSelectedTechnicians(Array.isArray(currentTechnicians) ? currentTechnicians : []);
  }, [currentTechnicians]);

  const handleToggleSelection = (technician: TeamMember) => {
    setSelectedTechnicians(prev =>
      prev.some(t => t.id === technician.id)
        ? prev.filter(t => t.id !== technician.id)
        : [...prev, technician]
    );
  };

  const handleAssign = async () => {
    setLoading(true);
    try {
      await onAssign(selectedTechnicians);
      toast.success("Equipe atualizada com sucesso!");
      setIsOpen(false);
    } catch (e) {
      toast.error("Falha ao atualizar a equipe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 mt-4">
      <p className="text-sm font-medium">Atribuir Técnicos</p>
      <div className="flex gap-2 items-start">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full justify-between h-auto min-h-[40px]">
              <div className="flex flex-wrap gap-1">
                {selectedTechnicians.length > 0 ? (
                  selectedTechnicians.map(tech => (
                    <Badge variant="secondary" key={tech.id} className="mr-1" onClick={(e) => { e.stopPropagation(); handleToggleSelection(tech); }}>
                      {tech.name}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">Selecione um ou mais técnicos...</span>
                )}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Buscar técnico..." />
              <CommandEmpty>Nenhum técnico encontrado.</CommandEmpty>
              <CommandGroup>
                {allTeamMembers.map((member) => {
                  const isSelected = selectedTechnicians.some(t => t.id === member.id);
                  return (
                    <CommandItem key={member.id} onSelect={() => handleToggleSelection(member)}>
                      <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                      {member.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        <Button onClick={handleAssign} disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
};
