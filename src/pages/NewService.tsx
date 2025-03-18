
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { teamMembers } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { createService } from "@/services/api";
import { cn } from "@/lib/utils";

const NewService = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTechnicians, setSelectedTechnicians] = useState<{ id: string; name: string; avatar: string }[]>([]);
  
  // Use react-hook-form for form handling
  const form = useForm({
    defaultValues: {
      title: "",
      location: "",
    }
  });

  // Handle adding a technician
  const handleAddTechnician = (technician: { id: string; name: string; avatar: string }) => {
    if (!selectedTechnicians.some(t => t.id === technician.id)) {
      setSelectedTechnicians([...selectedTechnicians, technician]);
    }
  };

  // Handle removing a technician
  const handleRemoveTechnician = (technicianId: string) => {
    setSelectedTechnicians(selectedTechnicians.filter(t => t.id !== technicianId));
  };

  // Handle form submission
  const onSubmit = async (data: any) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Extract technician IDs
      const technicianIds = selectedTechnicians.map(tech => tech.id);
      
      // Create service in the database
      const serviceId = await createService({
        title: data.title,
        location: data.location,
        technician_ids: technicianIds
      });
      
      if (serviceId) {
        toast({
          title: "Demanda criada",
          description: "A nova demanda foi criada com sucesso.",
        });
        
        // Navigate to the service detail page
        navigate(`/demandas/${serviceId}`);
      } else {
        toast({
          title: "Erro ao criar demanda",
          description: "Ocorreu um erro ao criar a demanda. Por favor, tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao criar demanda:", error);
      toast({
        title: "Erro ao criar demanda",
        description: "Ocorreu um erro ao criar a demanda. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available technicians (those not already selected)
  const availableTechnicians = teamMembers
    .filter(member => member.role === "tecnico" && !selectedTechnicians.some(t => t.id === member.id));

  return (
    <div className="min-h-screen p-4 pb-20 page-transition">
      <div className="flex items-center mb-6">
        <Link to="/demandas" className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary border border-white/10 mr-4">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">Nova Demanda</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            rules={{ required: "Título é obrigatório" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Vistoria João Silva" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            rules={{ required: "Local é obrigatório" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Av. Paulista, 1000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Técnicos Responsáveis</FormLabel>
            <div className="space-y-3">
              {/* Display selected technicians as badges */}
              {selectedTechnicians.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedTechnicians.map(tech => (
                    <Badge key={tech.id} variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
                      <TeamMemberAvatar
                        src={tech.avatar}
                        name={tech.name}
                        size="xs"
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
              
              {/* Dropdown to add technicians */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="justify-start w-full text-left font-normal"
                    disabled={availableTechnicians.length === 0}
                  >
                    <Plus size={16} className="mr-2" />
                    {availableTechnicians.length > 0 
                      ? "Adicionar técnico" 
                      : "Todos os técnicos já foram adicionados"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-full" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar técnico..." />
                    <CommandList>
                      <CommandEmpty>Nenhum técnico encontrado</CommandEmpty>
                      <CommandGroup>
                        {availableTechnicians.map(technician => (
                          <CommandItem
                            key={technician.id}
                            value={technician.name}
                            onSelect={() => handleAddTechnician(technician)}
                            className="cursor-pointer"
                          >
                            <TeamMemberAvatar
                              src={technician.avatar}
                              name={technician.name}
                              size="sm"
                              className="mr-2"
                            />
                            {technician.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </FormItem>

          <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-white/10 p-4 z-10">
            <div className="flex justify-between items-center max-w-md mx-auto">
              <Button type="button" variant="outline" onClick={() => navigate('/demandas')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="32" strokeDashoffset="10" />
                      </svg>
                    </span>
                    Criando...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Criar Demanda
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewService;
