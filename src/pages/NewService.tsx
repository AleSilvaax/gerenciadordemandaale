
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, CalendarIcon, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { getTeamMembers } from "@/services/api";
import { createService } from "@/services/api";
import { useState, useEffect } from "react";
import { TeamMember } from "@/types/serviceTypes";

const NewService = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use react-hook-form for form handling
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      location: "",
      technician: "",
      serviceType: "inspection",
      priority: "media",
      dueDate: undefined as Date | undefined,
      estimatedHours: 2,
    }
  });

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const data = await getTeamMembers();
        setTeamMembers(data);
      } catch (error) {
        console.error("Error fetching team members:", error);
        toast({
          title: "Erro",
          description: "Falha ao carregar a equipe. Por favor, tente novamente.",
          variant: "destructive",
        });
      }
    };
    
    fetchTeamMembers();
  }, [toast]);

  // Handle form submission
  const onSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      const technician = teamMembers.find(member => member.id === data.technician);
      
      if (!technician) {
        throw new Error("Técnico não encontrado");
      }
      
      const newService = await createService({
        title: data.title,
        description: data.description,
        location: data.location,
        technician: technician,
        status: "pendente",
        serviceType: data.serviceType,
        priority: data.priority,
        dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
        date: new Date().toISOString(),
        estimatedHours: data.estimatedHours,
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
    } finally {
      setIsLoading(false);
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Descreva os detalhes da demanda"
                    rows={3}
                  />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Serviço</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="inspection">Vistoria</SelectItem>
                      <SelectItem value="installation">Instalação</SelectItem>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="baixa">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                          Baixa
                        </div>
                      </SelectItem>
                      <SelectItem value="media">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                          Média
                        </div>
                      </SelectItem>
                      <SelectItem value="alta">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                          Alta
                        </div>
                      </SelectItem>
                      <SelectItem value="urgente">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                          Urgente
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Vencimento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecionar data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Data limite para conclusão da demanda
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempo Estimado (horas)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Estimativa de tempo para a execução
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>

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
              <Button type="submit" disabled={isLoading}>
                <Save size={16} className="mr-2" />
                {isLoading ? "Criando..." : "Criar Demanda"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NewService;

function cn(...classes: any[]): string {
  return classes.filter(Boolean).join(' ');
}
