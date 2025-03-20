
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { teamMembers } from "@/data/mockData";
import { createService } from "@/services/api";

const NewService = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use react-hook-form for form handling
  const form = useForm({
    defaultValues: {
      title: "",
      location: "",
      technician: "",
    }
  });

  // Handle form submission
  const onSubmit = async (data: any) => {
    try {
      const technician = teamMembers.find(member => member.id === data.technician);
      
      if (!technician) {
        throw new Error("Técnico não encontrado");
      }
      
      const newService = await createService({
        title: data.title,
        location: data.location,
        technicians: [technician],
        status: "pendente"
      });
      
      toast({
        title: "Demanda criada",
        description: `A demanda #${newService.id} foi criada com sucesso.`,
      });
      
      // Navigate back to demands list
      navigate('/demandas');
    } catch (error) {
      console.error("Erro ao criar demanda:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a demanda. Tente novamente.",
        variant: "destructive",
      });
    }
  };

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
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Vistoria João Silva" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Av. Paulista, 1000" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="technician"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Técnico Responsável</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
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
            )}
          />

          <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-white/10 p-4 z-10">
            <div className="flex justify-between items-center max-w-md mx-auto">
              <Button type="button" variant="outline" onClick={() => navigate('/demandas')}>
                Cancelar
              </Button>
              <Button type="submit">
                <Save size={16} className="mr-2" />
                Criar Demanda
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewService;
