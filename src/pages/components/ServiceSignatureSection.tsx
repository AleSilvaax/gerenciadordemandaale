
import React from "react";
import { SignatureCapture } from "@/components/ui-custom/SignatureCapture";

interface ServiceSignatureSectionProps {
  clientSignature?: string;
  technicianSignature?: string;
  clientName: string;
  technicianName: string;
  onClientSignature: (signature: string) => void;
  onTechnicianSignature: (signature: string) => void;
}

const ServiceSignatureSection: React.FC<ServiceSignatureSectionProps> = ({
  clientSignature,
  technicianSignature,
  clientName,
  technicianName,
  onClientSignature,
  onTechnicianSignature,
}) => (
  <div className="pt-4">
    <h4 className="font-medium mb-4">Assinaturas</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h5 className="text-sm font-medium mb-2">Assinatura do Cliente</h5>
        <div className="mb-4">
          <span className="block text-sm text-muted-foreground">
            {clientName}
          </span>
        </div>
        <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-800">
          <SignatureCapture
            initialSignature={clientSignature}
            onChange={onClientSignature}
            label="Assinatura do Cliente"
          />
        </div>
      </div>
      <div>
        <h5 className="text-sm font-medium mb-2">Assinatura do Técnico</h5>
        <div className="mb-4">
          <span className="block text-sm text-muted-foreground">
            Técnico: {technicianName}
          </span>
        </div>
        <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-800">
          <SignatureCapture
            initialSignature={technicianSignature}
            onChange={onTechnicianSignature}
            label="Assinatura do Técnico"
          />
        </div>
      </div>
    </div>
  </div>
);

export default ServiceSignatureSection;
