
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignatureCapture } from "@/components/ui-custom/SignatureCapture";
import { PenTool, Download } from "lucide-react";
import { Service } from "@/types/serviceTypes";

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

  const handleSaveSignatures = () => {
    onUpdateSignatures({
      client: clientSignature,
      technician: technicianSignature,
    });
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
              onChange={setClientSignature}
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
              onChange={setTechnicianSignature}
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
            onClick={onGenerateReport}
            variant="outline"
            className="w-full"
            disabled={!hasSignatures}
          >
            <Download className="w-4 h-4 mr-2" />
            Gerar Relatório PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
