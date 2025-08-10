
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, Clock, X, Download } from "lucide-react";
import { Service } from "@/types/serviceTypes";

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
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "cancelado":
        return <X className="w-4 h-4 text-red-500" />;
      case "em_andamento":
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: Service["status"]) => {
    switch (status) {
      case "concluido":
        return "default";
      case "cancelado":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Ações da Demanda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Atual */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status Atual:</span>
          <Badge variant={getStatusBadgeVariant(service.status)} className="flex items-center gap-1">
            {getStatusIcon(service.status)}
            {service.status === "pendente" ? "Pendente" :
             service.status === "em_andamento" ? "Em Andamento" :
             service.status === "concluido" ? "Concluído" : "Cancelado"}
          </Badge>
        </div>

        {/* Alteração de Status */}
        {!editMode && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Alterar Status:</label>
            <Select onValueChange={onStatusChange} value={service.status}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    Pendente
                  </div>
                </SelectItem>
                <SelectItem value="em_andamento">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    Em Andamento
                  </div>
                </SelectItem>
                <SelectItem value="concluido">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Concluído
                  </div>
                </SelectItem>
                <SelectItem value="cancelado">
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-500" />
                    Cancelado
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Gerar Relatório */}
        {onGenerateReport && (
<div className="pt-4 border-t">
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
    className="w-full"
    variant="outline"
    disabled={downloading}
    aria-label="Gerar relatório PDF da demanda"
  >
    <Download className="w-4 h-4 mr-2" />
    {downloading ? 'Gerando...' : 'Gerar Relatório PDF'}
  </Button>
  <p className="text-xs text-muted-foreground mt-2 text-center">
    Inclui todas as informações, fotos e assinaturas
  </p>
</div>
        )}
      </CardContent>
    </Card>
  );
};
