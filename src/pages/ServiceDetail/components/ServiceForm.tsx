
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
import { teamMembers } from "@/data/mockData";

interface ServiceFormProps {
  formState: {
    title: string;
    location: string;
    status: string;
    technician: string;
  };
  onChange: (field: string, value: any) => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ formState, onChange }) => {
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
          <FormLabel>Técnico Responsável</FormLabel>
          <Select
            value={formState.technician}
            onValueChange={(value) => onChange("technician", value)}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o técnico" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {teamMembers
                .filter(member => member.role === "tecnico")
                .map(technician => (
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
