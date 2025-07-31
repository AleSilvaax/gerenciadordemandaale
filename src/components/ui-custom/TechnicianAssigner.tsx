// Arquivo: src/components/ui-custom/TechnicianAssigner.tsx (VERSÃO COMPLETA E CORRIGIDA)

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
  currentTechnicians?: TeamMember[];
  onAssign: (technicians: TeamMember[]) => void; // A prop foi simplificada
}

export const TechnicianAssigner: React.FC<TechnicianAssignerProps> = ({ currentTechnicians, onAssign }) => {
  const [allTeamMembers, setAllTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTechnicians, setSelectedTechnicians] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    getTeamMembers()
      .then(members => {
        if (Array.isArray(members)) {
          setAllTeamMembers(members.filter(m => m.role === 'tecnico'));
        }
      })
      .catch(() => toast.error("Erro ao carregar a lista de técnicos."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setSelectedTechnicians(Array.isArray(currentTechnicians) ? currentTechnicians : []);
  }, [currentTechnicians]);

  const handleToggleSelection = (technician: TeamMember) => {
    const newSelection = selectedTechnicians.some(t => t.id === technician.id)
      ? selectedTechnicians.filter(t => t.id !== technician.id)
      : [...selectedTechnicians, technician];
    setSelectedTechnicians(newSelection);
    // Chama o onAssign imediatamente para formulários reativos
    onAssign(newSelection);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Técnicos Responsáveis</p>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between h-auto min-h-[40px]" disabled={isLoading}>
            <div className="flex flex-wrap gap-1">
              {selectedTechnicians.length > 0 ? (
                selectedTechnicians.map(tech => (
                  <Badge variant="secondary" key={tech.id} className="mr-1">
                    {tech.name}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">
                  {isLoading ? "Carregando..." : "Selecione um ou mais técnicos..."}
                </span>
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
    </div>
  );
};
