// Arquivo: src/components/service-detail/ServiceDetailCard.tsx (VERSÃO COMPLETA E CORRIGIDA)

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { TechnicianAssigner } from "@/components/ui-custom/TechnicianAssigner";
import { updateService } from "@/services/servicesDataService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Service, TeamMember } from "@/types/serviceTypes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Calendar, Clock, Users, FileText, CheckCircle, XCircle } from "lucide-react";

interface ServiceDetailCardProps {
  service: Service;
  onServiceUpdate: () => void;
}

export const ServiceDetailCard: React.FC<ServiceDetailCardProps> = ({ service, onServiceUpdate }) => {
  const { user } = useAuth();
  const hasGestorPermission = user?.role === 'gestor' || user?.role === 'administrador';

  const handleTechnicianUpdate = async (newTechnicians: TeamMember[]) => {
    try {
      await updateService({ id: service.id, technicians: newTechnicians });
      toast.success("Equipe atualizada com sucesso!");
      onServiceUpdate(); // Recarrega os dados da página
    } catch {
      toast.error("Falha ao atualizar a equipe.");
    }
  };

  return (
    <Card className="bg-card/50 shadow-lg">
      <CardHeader>
        {/* ... Seu código original do Header ... */}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ... Seu código original das datas ... */}
        <div className="p-3 bg-background/30 rounded-lg border">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-primary mt-1" />
            <div>
              <p className="text-sm font-medium">Técnicos Responsáveis</p>
              {Array.isArray(service.technicians) && service.technicians.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {service.technicians.map(tech => (
                    <div key={tech.id} className="flex items-center gap-2 bg-background p-1 rounded-full border">
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
        {hasGestorPermission && (
          <TechnicianAssigner
            currentTechnicians={service.technicians || []}
            onAssign={handleTechnicianUpdate}
          />
        )}
        {service.description && (
          // ... seu código original da descrição ...
        )}
      </CardContent>
    </Card>
  );
};
