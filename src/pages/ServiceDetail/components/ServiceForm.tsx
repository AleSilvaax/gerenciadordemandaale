
import React from "react";
import { Input } from "@/components/ui/input";
import { 
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { teamMembers } from "@/data/mockData";

interface ServiceFormProps {
  formState: {
    title: string;
    location: string;
    status: string;
    technicianIds: string[];
  };
  onChange: (field: string, value: any) => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ formState, onChange }) => {
  const handleAddTechnician = (technicianId: string) => {
    if (!formState.technicianIds.includes(technicianId)) {
      onChange('technicianIds', [...formState.technicianIds, technicianId]);
    }
  };

  const handleRemoveTechnician = (technicianId: string) => {
    onChange('technicianIds', formState.technicianIds.filter(id => id !== technicianId));
  };

  const selectedTechnicians = formState.technicianIds.map(id => 
    teamMembers.find(tech => tech.id === id)
  ).filter(Boolean);

  const availableTechnicians = teamMembers
    .filter(member => member.role === "tecnico" && !formState.technicianIds.includes(member.id));
  
  return (
    <>
      <div className="space-y-4">
        <FormItem>
          <FormLabel>Título</FormLabel>
          <FormControl>
            <Input 
              value={formState.title} 
              onChange={(e) => onChange("title", e.target.value)} 
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Local</FormLabel>
          <FormControl>
            <Input 
              value={formState.location} 
              onChange={(e) => onChange("location", e.target.value)} 
            />
          </FormControl>
        </FormItem>

        <FormItem>
          <FormLabel>Status</FormLabel>
          <Select
            value={formState.status}
            onValueChange={(value) => onChange("status", value)}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </FormItem>

        <FormItem>
          <FormLabel>Técnicos Responsáveis</FormLabel>
          
          {/* Display selected technicians */}
          {selectedTechnicians.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedTechnicians.map(tech => tech && (
                <Badge key={tech.id} variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
                  <TeamMemberAvatar
                    src={tech.avatar}
                    name={tech.name}
                    size="sm"
                  />
                  <span>{tech.name}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveTechnician(tech.id)}
                    className="ml-1 text-destructive hover:text-destructive/80"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          
          {/* Add technicians dropdown */}
          <Select
            onValueChange={handleAddTechnician}
            disabled={availableTechnicians.length === 0}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={
                  availableTechnicians.length > 0 
                    ? "Adicionar técnico" 
                    : "Todos os técnicos já foram adicionados"
                } />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {availableTechnicians.map(technician => (
                <SelectItem 
                  key={technician.id} 
                  value={technician.id}
                  className="flex items-center"
                >
                  <div className="flex items-center">
                    <TeamMemberAvatar
                      src={technician.avatar}
                      name={technician.name}
                      size="sm"
                      className="mr-2"
                    />
                    {technician.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      </div>
    </>
  );
};

export default ServiceForm;
