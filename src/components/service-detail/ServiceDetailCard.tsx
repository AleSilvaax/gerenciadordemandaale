
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { MultiTechnicianAssigner } from "@/components/ui-custom/MultiTechnicianAssigner";
import { ServiceEditForm } from "./ServiceEditForm";
import { updateService } from "@/services/servicesDataService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Service } from "@/types/serviceTypes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Calendar, Clock, User, FileText, CheckCircle, XCircle, Edit2 } from "lucide-react";

interface ServiceDetailCardProps {
  service: Service;
  onServiceUpdate: () => void;
}

export const ServiceDetailCard: React.FC<ServiceDetailCardProps> = ({ service, onServiceUpdate }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  const canEdit = user?.role === 'gestor' || user?.role === 'administrador';

  // Função para verificar permissões - simplificada já que não temos hasPermission no AuthContext
  const hasGestorPermission = user?.role === 'gestor' || user?.role === 'administrador';

  if (isEditing) {
    return (
      <ServiceEditForm
        service={service}
        onServiceUpdate={() => {
          onServiceUpdate();
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "concluido":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelado":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluido":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "cancelado":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold mb-2">{service.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{service.location}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 px-2"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Editar
              </Button>
            )}
            <div className="flex flex-col items-end gap-2">
              <div className="text-xs text-muted-foreground font-medium">
                OS #{service.number || 'N/A'}
              </div>
              <Badge className={`${getStatusColor(service.status)} border flex items-center gap-1`}>
                {getStatusIcon(service.status)}
                {service.status === "concluido" ? "Concluído" : 
                 service.status === "cancelado" ? "Cancelado" : "Pendente"}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Resumo Compacto */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <div className="text-center">
            <p className="text-sm font-semibold text-primary">{service.priority || 'Normal'}</p>
            <p className="text-xs text-muted-foreground">Prioridade</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold">{service.serviceType || 'Geral'}</p>
            <p className="text-xs text-muted-foreground">Tipo</p>
          </div>
          <div className="text-center col-span-2 md:col-span-1">
            <p className="text-sm font-semibold">
              {format(new Date(service.creationDate!), "dd/MM/yyyy", { locale: ptBR })}
            </p>
            <p className="text-xs text-muted-foreground">Criação</p>
          </div>
        </div>

        {/* Informações do Cliente */}
        {(service.client || service.address || service.city) && (
          <div className="space-y-3">
            <h4 className="text-base font-semibold text-foreground flex items-center gap-2 pb-2 border-b border-border/30">
              <User className="w-4 h-4 text-primary" />
              Cliente
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {service.client && (
                <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-background/60 to-background/30 rounded-lg border border-border/30">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Cliente</p>
                    <p className="text-muted-foreground text-sm truncate">{service.client}</p>
                  </div>
                </div>
              )}
              {(service.address || service.city) && (
                <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-background/60 to-background/30 rounded-lg border border-border/30">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Endereço</p>
                    <p className="text-muted-foreground text-sm truncate">
                      {service.address && service.city 
                        ? `${service.address}, ${service.city}`
                        : service.address || service.city}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cronograma */}
        <div className="space-y-3">
          <h4 className="text-base font-semibold text-foreground flex items-center gap-2 pb-2 border-b border-border/30">
            <Calendar className="w-4 h-4 text-primary" />
            Cronograma
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-background/60 to-background/30 rounded-lg border border-border/30">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Calendar className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Criação</p>
                <p className="text-muted-foreground text-sm">
                  {format(new Date(service.creationDate!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            {service.dueDate && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-background/60 to-background/30 rounded-lg border border-border/30">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Vencimento</p>
                  <p className="text-muted-foreground text-sm">
                    {format(new Date(service.dueDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Técnicos Atribuídos */}
        <div className="space-y-3">
          <h4 className="text-base font-semibold text-foreground flex items-center gap-2 pb-2 border-b border-border/30">
            <User className="w-4 h-4 text-primary" />
            {service.technicians && service.technicians.length > 1 ? 'Técnicos Atribuídos' : 'Técnico Responsável'}
          </h4>
          <div className="p-3 bg-gradient-to-br from-background/60 to-background/30 rounded-lg border border-border/30">
            {service.technicians && service.technicians.length > 0 ? (
              <div className="space-y-3">
                {service.technicians.map((technician, index) => (
                  <div key={technician.id} className="flex items-center gap-3">
                    <TeamMemberAvatar 
                      src={technician.avatar || ""} 
                      name={technician.name} 
                      size="sm"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{technician.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {technician.role || 'Técnico'}
                        {index === 0 && service.technicians && service.technicians.length > 1 && ' (Principal)'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Não atribuído</p>
                    <p className="text-xs text-muted-foreground">Aguardando atribuição</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30 text-xs">
                  Pendente
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Gerenciar Atribuição (apenas para gestores) */}
        {hasGestorPermission && (
          <div className="space-y-3">
            <MultiTechnicianAssigner
              currentTechnicians={service.technicians || []}
              onAssign={async (technicians) => {
                await updateService({ id: service.id, technicians });
                toast.success("Técnicos atualizados com sucesso!");
                onServiceUpdate();
              }}
            />
          </div>
        )}

        {service.description && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Descrição
            </h4>
            <p className="text-sm text-muted-foreground p-3 bg-background/30 rounded-lg border border-border/30">
              {service.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
