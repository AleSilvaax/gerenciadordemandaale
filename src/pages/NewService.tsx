
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomFieldManager } from "@/components/ui-custom/CustomFieldManager";
import { useAuditedServices } from "@/hooks/useAuditedServices";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Service, CustomField, ServicePriority, TeamMember } from "@/types/serviceTypes";
import { CalendarDays, MapPin, User, FileText, Wrench, Camera } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function NewService() {
  const navigate = useNavigate();
  const { createService } = useAuditedServices();
  const { teamMembers } = useTeamMembers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    client: '',
    address: '',
    city: '',
    description: '',
    priority: 'media' as ServicePriority,
    serviceType: 'Vistoria',
    estimatedHours: 0,
    dueDate: '',
    technicianId: ''
  });

  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.title.trim() || !formData.location.trim()) {
      toast.error("Título e localização são obrigatórios");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedTechnician = teamMembers.find(t => t.id === formData.technicianId);

      const serviceData: Omit<Service, 'id'> = {
        title: formData.title,
        location: formData.location,
        status: 'pendente',
        client: formData.client || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        description: formData.description || undefined,
        priority: formData.priority,
        serviceType: formData.serviceType,
        estimatedHours: formData.estimatedHours || undefined,
        dueDate: formData.dueDate || undefined,
        technician: selectedTechnician,
        customFields: customFields.length > 0 ? customFields : undefined,
        creationDate: new Date().toISOString(),
        createdBy: 'current_user_id', // This should come from auth context
      };

      await createService(serviceData);
      toast.success("Demanda criada com sucesso!");
      navigate("/demandas");
    } catch (error) {
      console.error("Erro ao criar demanda:", error);
      toast.error("Erro ao criar demanda");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Nova Demanda de Serviço</h1>
        <p className="text-muted-foreground">
          Preencha as informações para criar uma nova demanda de trabalho
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Título da Demanda *
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Vistoria técnica equipamento X"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="serviceType" className="text-sm font-medium">
                  Tipo de Serviço
                </label>
                <Select 
                  value={formData.serviceType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, serviceType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vistoria">Vistoria</SelectItem>
                    <SelectItem value="Instalação">Instalação</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Reparo">Reparo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Descrição
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva detalhes adicionais sobre a demanda..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Local *
                </label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ex: Unidade Centro"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium">
                  Cidade
                </label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Ex: São Paulo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">
                Endereço Completo
              </label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Rua, número, bairro..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Client and Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Cliente e Atribuição
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="client" className="text-sm font-medium">
                  Cliente/Solicitante
                </label>
                <Input
                  id="client"
                  value={formData.client}
                  onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                  placeholder="Nome do cliente ou empresa"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="technician" className="text-sm font-medium">
                  Técnico Responsável
                </label>
                <Select 
                  value={formData.technicianId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, technicianId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar técnico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Não atribuído</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} - {member.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scheduling and Priority */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Agendamento e Prioridade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-medium">
                  Prioridade
                </label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value: ServicePriority) => setFormData(prev => ({ ...prev, priority: value }))}
                >
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
                <label htmlFor="estimatedHours" className="text-sm font-medium">
                  Horas Estimadas
                </label>
                <Input
                  id="estimatedHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="dueDate" className="text-sm font-medium">
                  Data Limite
                </label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Fields */}
        <CustomFieldManager 
          fields={customFields}
          onChange={setCustomFields}
        />

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate("/demandas")}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Criando..." : "Criar Demanda"}
          </Button>
        </div>
      </form>
    </div>
  );
}
