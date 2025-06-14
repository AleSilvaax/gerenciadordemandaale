import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createService, getTeamMembers, getServiceTypes } from "@/services/servicesDataService";
import { TeamMember, ServiceType, ServiceTypeConfig } from "@/types/serviceTypes";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TipoDemanda, PrioridadeDemanda, StatusDemanda } from "../models/service.enums";

const NewService: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeConfig[]>([]);
  
  // Form state
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTechnician, setSelectedTechnician] = useState<TeamMember | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType>("Vistoria");
  const [priority, setPriority] = useState("media");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [tipoDemandaId, setTipoDemandaId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [members, types] = await Promise.all([
          getTeamMembers(),
          getServiceTypes()
        ]);
        setTeamMembers(members);
        setServiceTypes(types.filter((t) => !!t.name)); // pega só tipos válidos
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Erro ao carregar dados");
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !location.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (!tipoDemandaId) {
      toast.error("Escolha um tipo de demanda.");
      return;
    }

    setIsLoading(true);
    
    try {
      const serviceData = {
        title: title.trim(),
        location: location.trim(),
        status: "pendente" as const,
        technician: selectedTechnician || {
          id: '0',
          name: 'Não atribuído',
          avatar: '',
          role: 'tecnico' as const,
        },
        creationDate: new Date().toISOString(),
        messages: [],
        serviceType: selectedServiceType,
        priority: priority as any,
        dueDate: dueDate?.toISOString(),
        description,
        createdBy: user?.id,
      };

      console.log("Creating service with data:", serviceData);
      
      const created = await createService(serviceData);

      if (!created || !created.id) {
        toast.error("Erro ao criar demanda. Verifique as permissões ou tente novamente.");
        return;
      }

      toast.success("Demanda criada com sucesso!");
      navigate("/demandas");
    } catch (error: any) {
      let errMsg = "Erro ao criar demanda. Tente novamente.";
      if (
        typeof error?.message === "string" &&
        error.message.toLowerCase().includes("permission denied")
      ) {
        errMsg = "Permissão negada ao criar demanda. Verifique suas permissões de acesso ou consulte o administrador.";
      }
      console.error("Error creating service:", error);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTechnicianSelect = (technicianId: string) => {
    if (technicianId === "none") {
      setSelectedTechnician(null);
    } else {
      const technician = teamMembers.find(t => t.id === technicianId);
      setSelectedTechnician(technician || null);
    }
  };

  return (
    <div className="container py-4 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Nova Demanda</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Demanda *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Digite o título da demanda"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Local *</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Digite o local do serviço"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceType">Tipo de Serviço</Label>
              <Select value={selectedServiceType} onValueChange={(value: ServiceType) => setSelectedServiceType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de serviço" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes
                    .filter((type) => type && type.name)
                    .map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name} {!!type.description && `- ${type.description}`}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Técnico Responsável</Label>
              <Select 
                value={selectedTechnician?.id || "none"} 
                onValueChange={handleTechnicianSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um técnico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não atribuído</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center space-x-2">
                        <TeamMemberAvatar 
                          src={member.avatar} 
                          name={member.name} 
                          size="sm" 
                        />
                        <span>{member.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva os detalhes da demanda"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/demandas")}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Criando..." : "Criar Demanda"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewService;
