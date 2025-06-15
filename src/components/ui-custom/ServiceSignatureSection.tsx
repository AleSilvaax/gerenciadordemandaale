
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignatureCapture } from "@/components/ui-custom/SignatureCapture";
import { PenTool, Download } from "lucide-react";
import { Service } from "@/types/serviceTypes";
import { generateDetailedServiceReport } from "@/utils/detailedReportGenerator";

interface ServiceSignatureSectionProps {
  service: Service;
  onUpdateSignatures: (signatures: { client?: string; technician?: string }) => void;
  onGenerateReport: () => void;
}

export const ServiceSignatureSection: React.FC<ServiceSignatureSectionProps> = ({
  service,
  onUpdateSignatures,
  onGenerateReport,
}) => {
  const [clientSignature, setClientSignature] = useState(service.signatures?.client || "");
  const [technicianSignature, setTechnicianSignature] = useState(service.signatures?.technician || "");
  const [isGenerating, setIsGenerating] = useState(false);

  // Atualizar assinaturas quando o serviço mudar
  useEffect(() => {
    setClientSignature(service.signatures?.client || "");
    setTechnicianSignature(service.signatures?.technician || "");
  }, [service.signatures]);

  const handleSaveSignatures = async () => {
    try {
      console.log("Salvando assinaturas:", { client: clientSignature, technician: technicianSignature });
      await onUpdateSignatures({
        client: clientSignature || undefined,
        technician: technicianSignature || undefined,
      });
    } catch (error) {
      console.error("Erro ao salvar assinaturas:", error);
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      // Garantir que as assinaturas mais recentes estão no serviço
      const updatedService = {
        ...service,
        signatures: {
          client: clientSignature || undefined,
          technician: technicianSignature || undefined,
        }
      };
      
      await generateDetailedServiceReport(updatedService);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const hasSignatures = clientSignature || technicianSignature;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <PenTool className="w-5 h-5" />
          Assinaturas e Relatório
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assinatura do Cliente */}
        <div>
          <h5 className="text-sm font-medium mb-2 text-left">Assinatura do Cliente</h5>
          <div className="mb-2">
            <span className="block text-sm text-muted-foreground text-left">
              Cliente: {service.client || "Não informado"}
            </span>
          </div>
          <div className="border rounded-md p-4 bg-background/30">
            <SignatureCapture
              initialSignature={clientSignature}
              onChange={(signature) => {
                console.log("Cliente assinatura mudou:", signature);
                setClientSignature(signature);
              }}
              label="Assinatura do Cliente"
            />
          </div>
        </div>

        {/* Assinatura do Técnico */}
        <div>
          <h5 className="text-sm font-medium mb-2 text-left">Assinatura do Técnico</h5>
          <div className="mb-2">
            <span className="block text-sm text-muted-foreground text-left">
              Técnico: {service.technician?.name || "Não atribuído"}
            </span>
          </div>
          <div className="border rounded-md p-4 bg-background/30">
            <SignatureCapture
              initialSignature={technicianSignature}
              onChange={(signature) => {
                console.log("Técnico assinatura mudou:", signature);
                setTechnicianSignature(signature);
              }}
              label="Assinatura do Técnico"
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={handleSaveSignatures}
            className="w-full"
            disabled={!hasSignatures}
          >
            <PenTool className="w-4 h-4 mr-2" />
            Salvar Assinaturas
          </Button>
          
          <Button 
            onClick={handleGenerateReport}
            variant="outline"
            className="w-full"
            disabled={isGenerating}
          >
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? "Gerando..." : "Gerar Relatório PDF"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
