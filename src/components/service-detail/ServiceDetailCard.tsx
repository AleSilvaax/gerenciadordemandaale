// Arquivo: src/components/service-detail/ServiceDetailCard.tsx (VERSÃO ATUALIZADA)

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { TechnicianAssigner } from "@/components/ui-custom/TechnicianAssigner";
import { updateService } from "@/services/servicesDataService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Service } from "@/types/serviceTypes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Calendar, Clock, User, Users, FileText, CheckCircle, XCircle } from "lucide-react"; // Adicionado ícone 'Users'

interface ServiceDetailCardProps {
  service: Service;
  onServiceUpdate: () => void;
}

export const ServiceDetailCard: React.FC<ServiceDetailCardProps> = ({ service, onServiceUpdate }) => {
  const { user } = useAuth();
  const hasGestorPermission = user?.role === 'gestor' || user?.role === 'administrador';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "concluido": return <CheckCircle className="w-4 h-4" />;
      case "cancelado": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluido": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "cancelado": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-orange-500/10 text-orange-500 border-orange-500/20";
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
            {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
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
                {service.creationDate ? format(new Date(service.creationDate), "PPP", { locale: ptBR }) : 'N/A'}
              </p>
            </div>
          </div>
          {service.dueDate && (
            <div className="flex items-center gap-3 p-3 bg-background/30 rounded-lg border border-border/30">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Vencimento</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(service.dueDate), "PPP", { locale: ptBR })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ✅ SEÇÃO DE TÉCNICOS ATUALIZADA */}
        <div className="p-3 bg-background/30 rounded-lg border border-border/30">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="text-sm font-medium">Técnicos Responsáveis</p>
                {service.technicians && service.technicians.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {service.technicians.map(tech => (
                      <div key={tech.id} className="flex items-center gap-2 bg-background p-1 rounded-full">
                        <TeamMemberAvatar src={tech.avatar || ""} name={tech.name} size="xs" />
                        <span className="text-xs pr-2">{tech.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum técnico atribuído</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Manteremos o TechnicianAssigner por enquanto, mas ele precisará ser atualizado */}
        {hasGestorPermission && (
          <TechnicianAssigner
            // A prop 'currentTechnicianId' precisará ser alterada para uma lista de IDs
            currentTechnicianId={service.technicians?.[0]?.id} // Placeholder
            onAssign={async (technician) => {
              // A lógica aqui precisará ser atualizada para lidar com uma lista
              await updateService({ id: service.id, technicians: [technician] }); // Placeholder
              toast.success("Técnicos atualizados!");
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
