import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, CheckCircle, Clock, X, Download, PlayCircle, Pause, AlertTriangle, Share2 } from "lucide-react";
import { Service } from "@/types/serviceTypes";
import SectionCard from "@/components/service-detail/SectionCard";
import { ServiceCompletionValidationModal } from "./ServiceCompletionValidationModal";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ServiceActionsProps {
  service: Service;
  onStatusChange: (status: Service["status"]) => void;
  editMode?: boolean;
  onGenerateReport?: () => void;
}

export const ServiceActions: React.FC<ServiceActionsProps> = ({
  service,
  onStatusChange,
  editMode = false,
  onGenerateReport
}) => {
  const [downloading, setDownloading] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [materialShortages, setMaterialShortages] = useState<any[]>([]);
  const navigate = useNavigate();

  const getStatusIcon = (status: Service["status"]) => {
    switch (status) {
      case "concluido":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelado":
        return <X className="w-4 h-4" />;
      case "em_andamento":
        return <PlayCircle className="w-4 h-4" />;
      default:
        return <Pause className="w-4 h-4" />;
    }
  };

  const getStatusBadgeVariant = (status: Service["status"]) => {
    switch (status) {
      case "concluido":
        return "bg-gradient-to-r from-success/10 to-success/5 text-success border-success/30";
      case "cancelado":
        return "bg-gradient-to-r from-danger/10 to-danger/5 text-danger border-danger/30";
      case "em_andamento":
        return "bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-primary/30";
      default:
        return "bg-gradient-to-r from-warning/10 to-warning/5 text-warning border-warning/30";
    }
  };

  const getStatusDisplayName = (status: Service["status"]) => {
    switch (status) {
      case "pendente": return "Pendente";
      case "em_andamento": return "Em Andamento";
      case "concluido": return "Concluído";
      case "cancelado": return "Cancelado";
      default: return "Desconhecido";
    }
  };

  const handleCompleteService = async () => {
    try {
      setIsUpdatingStatus(true);
      await onStatusChange('concluido');
      setIsCompleteDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao finalizar demanda:', error);
      
      if (error?.message?.startsWith('MATERIAL_SHORTAGE:')) {
        const shortagesData = JSON.parse(error.message.replace('MATERIAL_SHORTAGE:', ''));
        setMaterialShortages(shortagesData);
        setValidationModalOpen(true);
        setIsCompleteDialogOpen(false);
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleProceedWithCompletion = async () => {
    try {
      setIsUpdatingStatus(true);
      await onStatusChange('concluido');
      setValidationModalOpen(false);
    } catch (error: any) {
      console.error('Erro ao forçar conclusão:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddStock = () => {
    setValidationModalOpen(false);
    navigate('/inventory');
  };

  const handleCopyTrackingLink = async () => {
    try {
      const { data, error } = await supabase.rpc("create_service_tracking_link", { p_service_id: service.id });
      if (error || !data) throw error || new Error("Link indisponível");
      await navigator.clipboard.writeText(`${window.location.origin}/tracking/${data}`);
      toast.success("Link do cliente copiado. Envie pelo WhatsApp.");
    } catch { toast.error("Não foi possível copiar o link do cliente."); }
  };

  return (
    <>
      <SectionCard 
        title="Gerenciar Demanda" 
        description="Controle de status e geração de relatórios"
        rightSlot={
          <Badge className={`${getStatusBadgeVariant(service.status)} border flex items-center gap-1.5 px-3 py-1`}>
            {getStatusIcon(service.status)}
            {getStatusDisplayName(service.status)}
          </Badge>
        }
      >
        <div className="space-y-6">
          {/* Status Management */}
          <div className="bg-gradient-to-br from-primary/10 via-background/80 to-accent/10 rounded-xl p-6 border border-border/60">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl flex items-center justify-center">
                {getStatusIcon(service.status)}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Status da Demanda</h4>
                <p className="text-xs text-muted-foreground">Controle do ciclo de vida do atendimento</p>
              </div>
            </div>

            {!editMode && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground block">Alterar Status:</label>
                  <Select onValueChange={onStatusChange} value={service.status}>
                    <SelectTrigger className="bg-card border border-border focus-visible:ring-2 focus-visible:ring-primary/50 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">
                        <div className="flex items-center gap-3">
                          <Pause className="w-4 h-4 text-warning" />
                          <div>
                            <div className="font-medium">Pendente</div>
                            <div className="text-xs text-muted-foreground">Aguardando início</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="em_andamento">
                        <div className="flex items-center gap-3">
                          <PlayCircle className="w-4 h-4 text-primary" />
                          <div>
                            <div className="font-medium">Em Andamento</div>
                            <div className="text-xs text-muted-foreground">Execução em progresso</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="concluido">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <div>
                            <div className="font-medium">Concluído</div>
                            <div className="text-xs text-muted-foreground">Atendimento finalizado</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="cancelado">
                        <div className="flex items-center gap-3">
                          <X className="w-4 h-4 text-danger" />
                          <div>
                            <div className="font-medium">Cancelado</div>
                            <div className="text-xs text-muted-foreground">Atendimento cancelado</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {service.status !== 'concluido' && (
                  <div className="pt-2 border-t border-border/50">
                    <Button 
                      onClick={() => setIsCompleteDialogOpen(true)}
                      disabled={isUpdatingStatus}
                      className="w-full h-11 bg-success text-success-foreground hover:bg-success/90 border border-success/30 shadow-sm hover:shadow-md transition-all duration-200"
                      aria-label="Finalizar demanda"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {isUpdatingStatus ? 'Finalizando...' : 'Finalizar Demanda'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Report Generation & Client Tracking */}
          <div className="space-y-3">
            {onGenerateReport && (
              <div className="bg-gradient-to-br from-accent/10 via-background/80 to-secondary/10 rounded-xl p-6 border border-border/60 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Relatório e Partilha</h4>
                    <p className="text-xs text-muted-foreground">Documentação e Portal do Cliente</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Button 
                    onClick={async () => {
                      if (!onGenerateReport) return;
                      try {
                        setDownloading(true);
                        await onGenerateReport();
                      } finally {
                        setDownloading(false);
                      }
                    }} 
                    className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-100 disabled:bg-muted disabled:text-muted-foreground"
                    disabled={downloading}
                    aria-label="Gerar relatório PDF da demanda"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {downloading ? 'Gerando...' : 'Baixar PDF'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyTrackingLink}
                    className="w-full h-11 border-border bg-card hover:bg-accent/10 text-foreground"
                  >
                    <Share2 className="w-4 h-4 mr-2 text-primary" />
                    Copiar Link Cliente
                  </Button>
                </div>
                
                <div className="p-3 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border border-border/30">
                  <p className="text-xs text-muted-foreground text-center">
                    🌐 Envie o link do cliente para acompanhamento em tempo real ou baixe o PDF completo.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Confirmation Dialog */}
      <AlertDialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Finalizar Demanda
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja marcar esta demanda como concluída? Esta ação irá validar o estoque dos materiais utilizados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCompleteService}
              disabled={isUpdatingStatus}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              {isUpdatingStatus ? 'Finalizando...' : 'Sim, Finalizar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Material Validation Modal */}
      <ServiceCompletionValidationModal
        isOpen={validationModalOpen}
        onClose={() => setValidationModalOpen(false)}
        onProceedAnyway={handleProceedWithCompletion}
        onAddStock={handleAddStock}
        shortages={materialShortages}
        isLoading={isUpdatingStatus}
      />
    </>
  );
};

export default ServiceActions;
