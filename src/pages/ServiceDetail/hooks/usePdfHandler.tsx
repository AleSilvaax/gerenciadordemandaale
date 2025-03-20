
import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Service, ServiceStatus } from '@/types/service';
import { useServiceDetail } from '../context/ServiceDetailContext';

type PdfUtilsType = {
  generatePDF: (service: Service) => boolean;
  downloadPDF: (service: Service) => void;
} | null;

export const usePdfHandler = () => {
  const { toast: uiToast } = useToast();
  const { 
    service, 
    formState, 
    setPdfGenerated,
    selectedPhotos 
  } = useServiceDetail();

  const [pdfUtils, setPdfUtils] = useState<PdfUtilsType>(null);

  useEffect(() => {
    import('@/utils/pdfGenerator').then(module => {
      setPdfUtils({
        generatePDF: module.generatePDF,
        downloadPDF: module.downloadPDF
      });
    });
  }, []);

  const createUpdatedServiceForPdf = () => {
    if (!service) return null;
    
    return {
      ...service,
      title: formState.title,
      status: formState.status as ServiceStatus,
      location: formState.location,
      technicians: formState.technicianIds.map(id => {
        const tech = service.technicians.find(t => t.id === id);
        return tech || { id, name: "Técnico", avatar: "" };
      }),
      reportData: {
        client: formState.client,
        address: formState.address,
        city: formState.city,
        executedBy: formState.executedBy,
        installationDate: formState.installationDate,
        modelNumber: formState.modelNumber,
        serialNumberNew: formState.serialNumberNew,
        serialNumberOld: formState.serialNumberOld,
        homologatedName: formState.homologatedName,
        compliesWithNBR17019: formState.compliesWithNBR17019,
        homologatedInstallation: formState.homologatedInstallation,
        requiredAdjustment: formState.requiredAdjustment,
        adjustmentDescription: formState.adjustmentDescription,
        validWarranty: formState.validWarranty,
        circuitBreakerEntry: formState.circuitBreakerEntry,
        chargerCircuitBreaker: formState.chargerCircuitBreaker,
        cableGauge: formState.cableGauge,
        chargerStatus: formState.chargerStatus,
        technicalComments: formState.technicalComments
      },
      photos: selectedPhotos
    };
  };

  const handleGeneratePDF = () => {
    if (!pdfUtils || !service) return;
    
    const updatedService = createUpdatedServiceForPdf();
    if (!updatedService) return;
    
    const result = pdfUtils.generatePDF(updatedService);
    
    if (result) {
      setPdfGenerated(true);
      uiToast({
        description: "PDF gerado com sucesso. Clique em 'Baixar PDF' para salvar o arquivo."
      });
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfUtils || !service) return;
    
    const updatedService = createUpdatedServiceForPdf();
    if (!updatedService) return;
    
    pdfUtils.downloadPDF(updatedService);
    
    uiToast({
      description: "O PDF está sendo baixado."
    });
  };

  const promptPdfGeneration = (callback: () => void) => {
    uiToast({
      description: "O serviço foi concluído. Deseja gerar o PDF do relatório?",
      action: (
        <button 
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium"
          onClick={callback}
        >
          Gerar PDF
        </button>
      ),
    });
  };

  return {
    handleGeneratePDF,
    handleDownloadPDF,
    promptPdfGeneration
  };
};
