
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
import { MapPin, Calendar, Clock, User, FileText, CheckCircle, XCircle } from "lucide-react";

interface ServiceDetailCardProps {
  service: Service;
  onServiceUpdate: () => void;
}

export const ServiceDetailCard: React.FC<ServiceDetailCardProps> = ({ service, onServiceUpdate }) => {
  const { user } = useAuth();

  // Função para verificar permissões - simplificada já que não temos hasPermission no AuthContext
  const hasGestorPermission = user?.role === 'gestor' || user?.role === 'administrador';

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
      
      <CardContent className="space-y-6">
        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{service.number || 'N/A'}</p>
            <p className="text-xs text-muted-foreground">Número da OS</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">{service.priority || 'Normal'}</p>
            <p className="text-xs text-muted-foreground">Prioridade</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">{service.serviceType || 'Geral'}</p>
            <p className="text-xs text-muted-foreground">Tipo de Serviço</p>
          </div>
        </div>

        {/* Seção do Cliente */}
        {(service.client || service.address || service.city) && (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-3">
              <User className="w-5 h-5 text-primary" />
              Informações do Cliente
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {service.client && (
                <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-background/60 to-background/30 rounded-xl border border-border/30 shadow-sm">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Cliente</p>
                    <p className="text-muted-foreground">{service.client}</p>
                  </div>
                </div>
              )}
              {(service.address || service.city) && (
                <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-background/60 to-background/30 rounded-xl border border-border/30 shadow-sm">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Endereço</p>
                    <p className="text-muted-foreground">
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

        {/* Seção de Cronograma */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-3">
            <Calendar className="w-5 h-5 text-primary" />
            Cronograma do Serviço
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-background/60 to-background/30 rounded-xl border border-border/30 shadow-sm">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold mb-1">Data de Criação</p>
                <p className="text-muted-foreground">
                  {format(new Date(service.creationDate!), "PPP 'às' p", { locale: ptBR })}
                </p>
              </div>
            </div>
            {service.dueDate && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-background/60 to-background/30 rounded-xl border border-border/30 shadow-sm">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold mb-1">Prazo de Vencimento</p>
                  <p className="text-muted-foreground">
                    {format(new Date(service.dueDate), "PPP 'às' p", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seção do Técnico Responsável */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-3">
            <User className="w-5 h-5 text-primary" />
            Técnico Responsável
          </h4>
          <div className="p-4 bg-gradient-to-br from-background/60 to-background/30 rounded-xl border border-border/30 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {service.technicians?.[0] ? (
                  <TeamMemberAvatar 
                    src={service.technicians[0].avatar || ""} 
                    name={service.technicians[0].name} 
                    size="md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-semibold">
                    {service.technicians?.[0]?.name ?? "Técnico não atribuído"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {service.technicians?.[0]?.role ?? "Aguardando atribuição"}
                  </p>
                </div>
              </div>
              {!service.technicians?.[0] && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30">
                  Pendente
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Atribuição de Técnico (apenas para gestores) */}
        {hasGestorPermission && (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-3">
              Gerenciar Atribuição
            </h4>
            <TechnicianAssigner
              currentTechnicianId={service.technicians?.[0]?.id}
              onAssign={async (technician) => {
                await updateService({ id: service.id, technicians: [technician] });
                toast.success("Técnico atualizado com sucesso!");
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
