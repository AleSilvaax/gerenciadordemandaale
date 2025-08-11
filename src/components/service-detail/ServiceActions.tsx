
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, Clock, X, Download, PlayCircle, Pause, AlertTriangle } from "lucide-react";
import { Service } from "@/types/serviceTypes";
import SectionCard from "@/components/service-detail/SectionCard";

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

  return (
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
        <div className="bg-gradient-to-br from-primary/5 via-background/50 to-accent/5 rounded-xl p-6 border border-border/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
              {getStatusIcon(service.status)}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Status da Demanda</h4>
              <p className="text-xs text-muted-foreground">Controle do ciclo de vida do atendimento</p>
            </div>
          </div>

          {!editMode && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground block">Alterar Status:</label>
              <Select onValueChange={onStatusChange} value={service.status}>
                <SelectTrigger className="bg-gradient-to-r from-background/80 to-background/60 border-border/50 focus:border-primary/50 h-11">
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
          )}
        </div>

        {/* Report Generation */}
        {onGenerateReport && (
          <div className="bg-gradient-to-br from-accent/5 via-background/50 to-secondary/5 rounded-xl p-6 border border-border/40">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Relatório Profissional</h4>
                <p className="text-xs text-muted-foreground">Documento completo com todas as informações</p>
              </div>
            </div>
            
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
              className="w-full h-11 bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent shadow-md hover:shadow-lg transition-all duration-200"
              disabled={downloading}
              aria-label="Gerar relatório PDF da demanda"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading ? 'Gerando Relatório...' : 'Baixar Relatório PDF'}
            </Button>
            
            <div className="mt-3 p-3 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border border-border/30">
              <p className="text-xs text-muted-foreground text-center">
                📋 Inclui detalhes completos, cronograma, fotos, assinaturas e comunicações
              </p>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
};
