import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { createService, getServiceTypesFromDatabase, getTeamMembers } from "@/services/servicesDataService";
import { useAuth } from "@/context/AuthContext";
import { ServiceMaterialsPreloader } from "@/components/service-detail/ServiceMaterialsPreloader";
import { useAddMaterialUsageToService } from "@/hooks/useInventory";
// Ícone para o novo campo de Prioridade
import { ArrowLeft, Plus, Calendar, MapPin, FileText, User, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { ServiceTypeConfig, TeamMember, ServicePriority } from "@/types/serviceTypes";

// 1. ADICIONADO 'priority' À INTERFACE DO FORMULÁRIO
interface ServiceFormData {
  title: string;
  serviceType: string;
  client: string;
  location: string;
  address: string;
  city: string;
  description: string;
  notes: string;
  dueDate: string;
  dueTime: string;
  technicianId: string;
  priority: ServicePriority;
}

const NewService: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeConfig[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState<string>("");
  const [preloadedMaterials, setPreloadedMaterials] = useState<Array<{ materialId: string; quantity: number; required: boolean }>>([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const addMaterialUsage = useAddMaterialUsageToService();

  const hasGestorPermission = user?.role === 'gestor' || user?.role === 'administrador';

  const form = useForm<ServiceFormData>({
    defaultValues: {
      title: "",
      serviceType: "",
      client: "",
      location: "",
      address: "",
      city: "",
      description: "",
      notes: "",
      dueDate: "",
      dueTime: "",
      technicianId: "none",
      priority: "media",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const types = await getServiceTypesFromDatabase();
        setServiceTypes(types);
        
        if (hasGestorPermission) {
          const members = await getTeamMembers();
          setTeamMembers(members);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar tipos de serviço");
      }
    };

    fetchData();
  }, [hasGestorPermission]);

  const onSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    try {
      console.log("Criando nova demanda:", data);

      let selectedTechnician = null;
      if (hasGestorPermission && data.technicianId && data.technicianId !== "none") {
        const technician = teamMembers.find(t => t.id === data.technicianId);
        if (technician) {
          selectedTechnician = {
            id: technician.id,
            name: technician.name,
            avatar: technician.avatar,
            role: technician.role,
            email: technician.email,
            phone: technician.phone,
            signature: technician.signature
          };
        }
      } else if (!hasGestorPermission && user) {
        selectedTechnician = {
          id: user.id,
          name: user.name || "Usuário",
          avatar: user.avatar || "",
          role: user.role || "tecnico",
          email: user.email,
          phone: "",
          signature: ""
        };
      }

      const serviceData = {
        title: data.title,
        serviceType: data.serviceType,
        client: data.client,
        location: data.location,
        address: data.address,
        city: data.city,
        description: data.description,
        notes: data.notes,
        dueDate: data.dueDate ? new Date(data.dueDate + 'T' + (data.dueTime || '00:00:00')).toISOString() : undefined,
        technicians: selectedTechnician ? [selectedTechnician] : [],
        status: "pendente" as const,
        priority: data.priority,
        createdBy: user?.id,
        creationDate: new Date().toISOString(),
      };

      const result = await createService(serviceData);
      
      if (!result?.created?.id) {
        throw new Error("Falha ao criar demanda: resposta inválida do servidor");
      }
      
      const newService = result.created;
      console.log("Demanda criada:", newService);

      // Adicionar materiais precarregados ao serviço
      if (preloadedMaterials.length > 0) {
        for (const material of preloadedMaterials) {
          try {
            await addMaterialUsage.mutateAsync({
              serviceId: newService.id,
              materialId: material.materialId,
              plannedQuantity: material.quantity,
              usedQuantity: 0,
              notes: material.required ? "Material obrigatório" : "Material opcional"
            });
          } catch (error) {
            console.warn("Erro ao adicionar material precarregado:", error);
          }
        }
      }
      
      if (result.technicianError) {
        toast.warning(`Demanda criada com sucesso! ${result.technicianError}`);
      } else {
        toast.success("Demanda criada com sucesso!");
      }
      
      navigate(`/demanda/${newService.id}`);
    } catch (error) {
      console.error("Erro ao criar demanda:", error);
      toast.error("Erro ao criar a demanda");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div 
        className="container mx-auto p-6 pb-24 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div 
          className="flex items-center gap-4 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Link 
            to="/demandas" 
            className="h-12 w-12 rounded-xl flex items-center justify-center bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-accent hover:border-accent/50 transition-all duration-200 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Nova Demanda
            </h1>
            <p className="text-muted-foreground mt-1">Crie uma nova demanda de serviço</p>
          </div>
        </motion.div>

        {/* Main Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Informações da Demanda
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Título */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Título da Demanda
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Digite o título da demanda"
                              className="bg-background/50"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Tipo de Serviço */}
                    <FormField
                      control={form.control}
                      name="serviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Serviço/Demanda</FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            const selectedType = serviceTypes.find(t => t.name === value);
                            setSelectedServiceTypeId(selectedType?.id || "");
                          }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background/50">
                                <SelectValue placeholder="Selecione o tipo de serviço" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {serviceTypes.map(type => (
                                <SelectItem key={type.id} value={type.name}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    {/* Cliente */}
                    <FormField
                      control={form.control}
                      name="client"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Nome do cliente"
                              className="bg-background/50"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Prioridade */}
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Prioridade
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background/50">
                                <SelectValue placeholder="Selecione a prioridade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="baixa">Baixa</SelectItem>
                              <SelectItem value="media">Média</SelectItem>
                              <SelectItem value="alta">Alta</SelectItem>
                              <SelectItem value="urgente">Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    {/* Localidade */}
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Localidade
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Localidade do serviço"
                              className="bg-background/50"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Endereço */}
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Endereço completo"
                              className="bg-background/50"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Cidade */}
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Cidade"
                              className="bg-background/50"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                     {/* Data de Vencimento */}
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Data de Vencimento
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="date"
                              className="bg-background/50"
                              onChange={(e) => {
                                const selectedDate = e.target.value;
                                if (selectedDate) {
                                  const localDate = new Date(selectedDate + 'T00:00:00');
                                  field.onChange(localDate.toISOString().split('T')[0]);
                                } else {
                                  field.onChange('');
                                }
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Hora de Vencimento */}
                    <FormField
                      control={form.control}
                      name="dueTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Hora de Vencimento
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="time"
                              className="bg-background/50"
                              placeholder="00:00"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Técnico Responsável (apenas para gestores) */}
                    {hasGestorPermission && (
                      <FormField
                        control={form.control}
                        name="technicianId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              Técnico Responsável
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-background/50">
                                  <SelectValue placeholder="Selecionar técnico" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Não atribuído</SelectItem>
                                {teamMembers.map((tech) => (
                                  <SelectItem key={tech.id} value={tech.id}>
                                    {tech.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Materials Preloader */}
                  {selectedServiceTypeId && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Materiais Padrão</h3>
                      <ServiceMaterialsPreloader 
                        serviceTypeId={selectedServiceTypeId}
                        onMaterialsLoaded={setPreloadedMaterials}
                      />
                    </div>
                  )}

                  {/* Descrição */}
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
                            rows={4}
                            className="bg-background/50"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Notas Adicionais */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas Adicionais</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Informações adicionais relevantes"
                            rows={3}
                            className="bg-background/50"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Botões */}
                  <div className="flex justify-end gap-4 pt-6 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate("/demandas")}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="min-w-[120px]"
                    >
                      {isSubmitting ? "Criando..." : "Criar Demanda"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NewService;
