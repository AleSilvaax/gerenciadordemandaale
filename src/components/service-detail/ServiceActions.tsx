
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Service } from "@/types/serviceTypes";
import { CheckCircle, XCircle, Edit } from "lucide-react";

interface ServiceActionsProps {
  service: Service;
  onStatusChange: (status: Service["status"]) => void;
  editMode?: boolean;
}

export const ServiceActions: React.FC<ServiceActionsProps> = ({ service, onStatusChange, editMode = false }) => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  if (editMode) return null;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-3">
          {service.status !== "concluido" && (
            <Button
              onClick={() => onStatusChange("concluido")}
              className="bg-green-500/20 text-green-500 border border-green-500/30 hover:bg-green-500/30"
              variant="outline"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar como Concluído
            </Button>
          )}
          {service.status !== "cancelado" && (
            <Button
              onClick={() => onStatusChange("cancelado")}
              className="bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30"
              variant="outline"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancelar Demanda
            </Button>
          )}
          {hasPermission("edit_services") && (
            <Button
              onClick={() => navigate(`/demandas/${service.id}/edit`)}
              className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
              variant="outline"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Demanda
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
