
import React from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Service, ServiceStatus } from '@/types/service';
import { updateService, updateReportData } from '@/services/api';
import { useServiceDetail } from '../context/ServiceDetailContext';
import { usePdfHandler } from './usePdfHandler';

export const useServiceFormSubmit = () => {
  const { id } = useParams<{ id: string }>();
  const { 
    formState, 
    setIsSubmitting, 
    pdfGenerated
  } = useServiceDetail();

  const { 
    handleGeneratePDF, 
    handleDownloadPDF, 
    promptPdfGeneration 
  } = usePdfHandler();

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
          promptPdfGeneration(handleGeneratePDF);
        }, 500);
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Erro ao salvar alterações. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { 
    handleSubmit, 
    handleGeneratePDF, 
    handleDownloadPDF 
  };
};
