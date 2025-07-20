
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { TechnicianAssigner } from "@/components/ui-custom/TechnicianAssigner";
import { updateService } from "@/services/servicesDataService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Service } from "@/types/serviceTypes";
import { formatDate } from "@/utils/formatters";
import { MapPin, Calendar, Clock, User, FileText, CheckCircle, XCircle } from "lucide-react";

interface ServiceDetailCardProps {
  service: Service;
  onServiceUpdate: () => void;
}

export const ServiceDetailCard: React.FC<ServiceDetailCardProps> = ({ service, onServiceUpdate }) => {
  const { hasPermission } = useAuth();

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
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">{service.title}</CardTitle>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{service.location}</span>
            </div>
            {service.number && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>#{service.number}</span>
              </div>
            )}
          </div>
          <Badge className={`${getStatusColor(service.status)} border flex items-center gap-1`}>
            {getStatusIcon(service.status)}
            {service.status === "concluido" ? "Concluído" : 
             service.status === "cancelado" ? "Cancelado" : "Pendente"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-background/30 rounded-lg border border-border/30">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Criação</p>
              <p className="text-sm text-muted-foreground">
                {service.creationDate ? formatDate(service.creationDate) :
                 service.date ? formatDate(service.date) : 'Data não disponível'}
              </p>
            </div>
          </div>
          {service.dueDate && (
            <div className="flex items-center gap-3 p-3 bg-background/30 rounded-lg border border-border/30">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Vencimento</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(service.dueDate)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-background/30 rounded-lg border border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Técnico Responsável</p>
                <p className="text-sm text-muted-foreground">
                  {service.technician?.name ?? "Não atribuído"}
                </p>
              </div>
            </div>
            {service.technician && (
              <TeamMemberAvatar 
                src={service.technician.avatar || ""} 
                name={service.technician.name} 
                size="sm"
              />
            )}
          </div>
        </div>

        {hasPermission("gestor") && (
          <TechnicianAssigner
            currentTechnicianId={
              service.technician?.id && service.technician.id !== '0'
                ? service.technician.id
                : undefined
            }
            onAssign={async (technician) => {
              await updateService({ id: service.id, technician: technician || undefined });
              toast.success("Técnico atualizado!");
              onServiceUpdate();
            }}
          />
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
