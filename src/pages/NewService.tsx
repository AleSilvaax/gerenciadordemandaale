import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  User,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getTeamMembers,
  getServiceTypesFromDatabase,
} from "@/services/servicesDataService";
import { createServiceInDatabase } from "@/services/serviceCrud";
import {
  TeamMember,
  ServicePriority,
  ServiceTypeConfig,
} from "@/types/serviceTypes";
import { ServiceMaterialsPreloader } from "@/components/service-detail/ServiceMaterialsPreloader";

const NewService = () => {
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [technicians, setTechnicians] = useState<TeamMember[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeConfig[]>([]);

  const [title, setTitle] = useState("");
  const [serviceType, setServiceType] = useState("Vistoria");
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState("");
  const [client, setClient] = useState("");
  const [priority, setPriority] = useState<ServicePriority>("media");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [dueTime, setDueTime] = useState("15:00");
  const [technicianId, setTechnicianId] = useState("none");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    getTeamMembers()
      .then((data) => setTechnicians(data || []))
      .catch(() => {});

    getServiceTypesFromDatabase()
      .then((types) => {
        if (types && types.length > 0) {
          setServiceTypes(types);
        }
      })
      .catch(() => {});
  }, []);

  const handleServiceTypeChange = (val: string) => {
    setServiceType(val);
    const found = serviceTypes.find((t) => t.name === val);
    setSelectedServiceTypeId(found?.id || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Informe o título da demanda.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalDueDate: string | undefined = undefined;
      if (dueDate) {
        const composed = new Date(dueDate);
        if (dueTime) {
          const [hours, minutes] = dueTime.split(":").map(Number);
          composed.setHours(hours || 0, minutes || 0, 0, 0);
        }
        finalDueDate = composed.toISOString();
      }

      const selectedTech =
        technicianId !== "none"
          ? technicians.find((t) => t.id === technicianId)
          : undefined;

      const created = await createServiceInDatabase({
        title: title.trim(),
        serviceType,
        client: client.trim(),
        priority,
        location: location.trim() || city.trim() || "São Paulo",
        address: address.trim(),
        city: city.trim(),
        dueDate: finalDueDate,
        description: description.trim(),
        notes: notes.trim(),
        technicians: selectedTech ? [selectedTech] : [],
        status: "pendente",
      } as any);

      if (created) {
        toast.success("Demanda criada com sucesso!");
        navigate("/demandas");
      } else {
        toast.error("Não foi possível criar a demanda.");
      }
    } catch (error: any) {
      console.error("Erro ao criar demanda:", error);
      toast.error("Erro ao criar demanda", { description: error?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeOptions = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-lg border-slate-200 bg-white"
        >
          <ArrowLeft className="h-4 w-4 text-slate-700" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Nova Demanda
          </h1>
          <p className="text-xs text-slate-500">
            Cadastre uma nova ordem de serviço para a operação
          </p>
        </div>
      </div>

      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs rounded-xl">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4 text-blue-600" />
            Informações da Ordem de Serviço
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Título e Tipo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Título da Demanda *
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Vistoria de Instalação"
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Tipo de Serviço
                </Label>
                <Select
                  value={serviceType}
                  onValueChange={handleServiceTypeChange}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.length > 0 ? (
                      serviceTypes.map((t) => (
                        <SelectItem key={t.id} value={t.name}>
                          {t.name}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="Vistoria">Vistoria</SelectItem>
                        <SelectItem value="Instalação">Instalação</SelectItem>
                        <SelectItem value="Manutenção">Manutenção</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedServiceTypeId && (
              <ServiceMaterialsPreloader
                serviceTypeId={selectedServiceTypeId}
              />
            )}

            {/* Cliente e Prioridade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Cliente
                </Label>
                <Input
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Nome do cliente ou condomínio"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Prioridade
                </Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as ServicePriority)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Endereço, Cidade e Localidade */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  Endereço Completo
                </Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, bairro"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Cidade / Região
                </Label>
                <Input
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (!location) setLocation(e.target.value);
                  }}
                  placeholder="Ex: São Paulo"
                  className="h-10"
                />
              </div>
            </div>

            {/* Data e Hora de Vencimento (100% compatível com iOS sem esticar) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                  <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                  Data de Vencimento
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full h-10 justify-start text-left font-normal border-slate-200",
                        !dueDate && "text-slate-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                      {dueDate ? (
                        format(dueDate, "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })
                      ) : (
                        <span>Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  Horário Previsto
                </Label>
                <Select value={dueTime} onValueChange={setDueTime}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Técnico Responsável */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-400" />
                Técnico Responsável
              </Label>
              <Select value={technicianId} onValueChange={setTechnicianId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Não atribuído" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não atribuído</SelectItem>
                  {technicians
                    .filter((t) => t && t.name)
                    .map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descrição e Notas */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Descrição do Serviço
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o escopo técnico do atendimento..."
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Observações Adicionais
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informações de acesso, portaria, contato no local..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Demanda"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewService;
