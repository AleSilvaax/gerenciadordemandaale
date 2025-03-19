
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useToast } from '@/components/ui/use-toast';
import { useEffect, useState } from 'react';
import { Service, ServiceStatus } from '@/types/service';
import { updateService, updateReportData } from '@/services/api';
import { useServiceDetail } from '../context/ServiceDetailContext';

export const useServiceFormSubmit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const { 
    service, 
    formState, 
    setIsSubmitting, 
    pdfGenerated, 
    setPdfGenerated, 
    selectedPhotos 
  } = useServiceDetail();

  const [pdfUtils, setPdfUtils] = useState<{
    generatePDF: (service: Service) => boolean;
    downloadPDF: (service: Service) => void;
  } | null>(null);

  useEffect(() => {
    import('@/utils/pdfGenerator').then(module => {
      setPdfUtils({
        generatePDF: module.generatePDF,
        downloadPDF: module.downloadPDF
      });
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    setIsSubmitting(true);
    
    try {
      const updatedService: Partial<Service> = {
        title: formState.title,
        status: formState.status as ServiceStatus,
        location: formState.location,
        technicians: formState.technicianIds.map(id => ({ 
          id, 
          name: "", 
          avatar: "" 
        })),
      };
      
      const serviceSuccess = await updateService(id, updatedService);
      
      if (!serviceSuccess) {
        throw new Error("Failed to update service");
      }

      const reportSuccess = await updateReportData(id, {
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
      });

      if (!reportSuccess) {
        throw new Error("Failed to update report data");
      }

      toast.success("Alterações salvas com sucesso!");

      if (formState.status === "concluido" && !pdfGenerated) {
        setTimeout(() => {
          uiToast({
            description: "O serviço foi concluído. Deseja gerar o PDF do relatório?",
            action: (
              <button 
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium"
                onClick={handleGeneratePDF}
              >
                Gerar PDF
              </button>
            ),
          });
        }, 500);
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Erro ao salvar alterações. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneratePDF = () => {
    if (!pdfUtils || !service) return;
    
    const updatedService = {
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
    
    const updatedService = {
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
    
    pdfUtils.downloadPDF(updatedService);
    
    uiToast({
      description: "O PDF está sendo baixado."
    });
  };

  return { 
    handleSubmit, 
    handleGeneratePDF, 
    handleDownloadPDF 
  };
};
