
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Service } from "@/types/serviceTypes";
import { CheckCircle, XCircle, Edit, Trash2 } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/ui-custom/DeleteConfirmationDialog";
import { deleteService } from "@/services/servicesDataService";
import { toast } from "sonner";

interface ServiceActionsProps {
  service: Service;
  onStatusChange: (status: Service["status"]) => void;
  editMode?: boolean;
}

export const ServiceActions: React.FC<ServiceActionsProps> = ({ service, onStatusChange, editMode = false }) => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteService = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteService(service.id);
      if (success) {
        toast.success("Demanda excluída com sucesso!");
        navigate("/demandas");
      } else {
        toast.error("Erro ao excluir demanda");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Erro ao excluir demanda");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (editMode) return null;

  return (
    <>
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
            {hasPermission("delete_services") && (
              <Button
                onClick={() => setDeleteDialogOpen(true)}
                className="bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30"
                variant="outline"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Demanda
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteService}
        title="Excluir Demanda"
        description={`Tem certeza que deseja excluir a demanda "${service.title}"? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.`}
        isLoading={isDeleting}
      />
    </>
  );
};
