import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Edit2, Save, X } from "lucide-react";
import { Service, ServicePriority } from "@/types/serviceTypes";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateServiceInDatabase } from "@/services/serviceCrud";

interface ServiceEditFormProps {
  service: Service;
  onServiceUpdate: () => void;
  onCancel: () => void;
}

export const ServiceEditForm: React.FC<ServiceEditFormProps> = ({
  service,
  onServiceUpdate,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: service.title || "",
    location: service.location || "",
    client: service.client || "",
    address: service.address || "",
    city: service.city || "",
    description: service.description || "",
    priority: service.priority || "media" as ServicePriority,
    serviceType: service.serviceType || "",
    dueDate: service.dueDate ? new Date(service.dueDate) : undefined,
    dueTime: service.dueDate ? new Date(service.dueDate).toTimeString().slice(0, 5) : "",
    estimatedHours: service.estimatedHours || 0,
    notes: service.notes || ""
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Combinar data e hora para criar a data de vencimento
      let dueDateTime = undefined;
      if (formData.dueDate) {
        dueDateTime = new Date(formData.dueDate);
        if (formData.dueTime) {
          const [hours, minutes] = formData.dueTime.split(':').map(Number);
          dueDateTime.setHours(hours, minutes, 0, 0);
        }
      }

      const updatedService = await updateServiceInDatabase({
        id: service.id,
        title: formData.title,
        location: formData.location,
        client: formData.client,
        address: formData.address,
        city: formData.city,
        description: formData.description,
        priority: formData.priority,
        serviceType: formData.serviceType,
        dueDate: dueDateTime?.toISOString(),
        estimatedHours: formData.estimatedHours,
        notes: formData.notes
      });

      if (updatedService) {
        toast.success("Demanda atualizada com sucesso!");
        onServiceUpdate();
      } else {
        toast.error("Erro ao atualizar a demanda");
      }
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error);
      toast.error("Erro ao atualizar a demanda");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Edit2 className="w-5 h-5" />
          Editar Demanda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Título */}
        <div className="space-y-2">
          <Label htmlFor="title">Título da Demanda</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            placeholder="Digite o título da demanda"
          />
        </div>

        {/* Localização */}
        <div className="space-y-2">
          <Label htmlFor="location">Localização</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
            placeholder="Digite a localização"
          />
        </div>

        {/* Cliente */}
        <div className="space-y-2">
          <Label htmlFor="client">Cliente</Label>
          <Input
            id="client"
            value={formData.client}
            onChange={(e) => handleInputChange("client", e.target.value)}
            placeholder="Nome do cliente"
          />
        </div>

        {/* Endereço e Cidade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Endereço completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              placeholder="Cidade"
            />
          </div>
        </div>

        {/* Prioridade e Tipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceType">Tipo de Serviço</Label>
            <Input
              id="serviceType"
              value={formData.serviceType}
              onChange={(e) => handleInputChange("serviceType", e.target.value)}
              placeholder="Tipo de serviço"
            />
          </div>
        </div>

        {/* Data e Hora de Vencimento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data de Vencimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dueDate ? format(formData.dueDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.dueDate}
                  onSelect={(date) => handleInputChange("dueDate", date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueTime">Hora de Vencimento</Label>
            <Input
              id="dueTime"
              type="time"
              value={formData.dueTime}
              onChange={(e) => handleInputChange("dueTime", e.target.value)}
            />
          </div>
        </div>

        {/* Horas Estimadas */}
        <div className="space-y-2">
          <Label htmlFor="estimatedHours">Horas Estimadas</Label>
          <Input
            id="estimatedHours"
            type="number"
            value={formData.estimatedHours}
            onChange={(e) => handleInputChange("estimatedHours", Number(e.target.value))}
            placeholder="0"
            min="0"
            step="0.5"
          />
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Descrição detalhada da demanda"
            rows={3}
          />
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notas Adicionais</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange("notes", e.target.value)}
            placeholder="Notas e observações"
            rows={2}
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Salvando..." : "Salvar Alterações"}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={isLoading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};