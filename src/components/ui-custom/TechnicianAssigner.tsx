// Arquivo: src/components/ui-custom/TechnicianAssigner.tsx
import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { TeamMember } from "@/types/serviceTypes";
import { cn } from "@/lib/utils";

interface TechnicianAssignerProps {
  currentTechnicians: TeamMember[];
  allTechnicians: TeamMember[]; // ✅ Recebe a lista completa de técnicos
  onAssign: (technicians: TeamMember[]) => void;
}

export const TechnicianAssigner: React.FC<TechnicianAssignerProps> = ({
  currentTechnicians,
  allTechnicians,
  onAssign
}) => {
  const [selected, setSelected] = useState<TeamMember[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setSelected(Array.isArray(currentTechnicians) ? currentTechnicians : []);
  }, [currentTechnicians]);

  const handleToggle = (technician: TeamMember) => {
    const isSelected = selected.some(t => t.id === technician.id);
    if (isSelected) {
      setSelected(prev => prev.filter(t => t.id !== technician.id));
    } else {
      setSelected(prev => [...prev, technician]);
    }
  };

  return (
    <div className="space-y-2 mt-4">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">Atribuir Técnicos</p>
        <Button
          type="button"
          onClick={() => {
            onAssign(selected);
            setIsOpen(false);
          }}
        >
          Salvar
        </Button>
      </div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between h-auto min-h-[40px]">
            <div className="flex flex-wrap gap-1">
              {selected.length > 0 ? (
                selected.map(tech => (
                  <Badge variant="secondary" key={tech.id} onClick={(e) => { e.stopPropagation(); handleToggle(tech); }}>
                    {tech.name} <X className="ml-1 h-3 w-3" />
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
              {allTechnicians.map((member) => (
                <CommandItem key={member.id} onSelect={() => handleToggle(member)}>
                  <Check className={cn("mr-2 h-4 w-4", selected.some(t => t.id === member.id) ? "opacity-100" : "opacity-0")} />
                  {member.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
