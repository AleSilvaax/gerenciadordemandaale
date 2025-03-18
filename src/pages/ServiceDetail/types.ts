
import { Service } from "@/types/service";

export interface ServiceFormData {
  title: string;
  status: string;
  location: string;
  technicianIds: string[];
  client: string;
  address: string;
  city: string;
  executedBy: string;
  installationDate: string;
  modelNumber: string;
  serialNumberNew: string;
  serialNumberOld: string;
  homologatedName: string;
  compliesWithNBR17019: boolean;
  homologatedInstallation: boolean;
  requiredAdjustment: boolean;
  adjustmentDescription: string;
  validWarranty: boolean;
  circuitBreakerEntry: string;
  chargerCircuitBreaker: string;
  cableGauge: string;
  chargerStatus: string;
  technicalComments: string;
}

export interface ServiceDetailContextType {
  service: Service;
  formData: ServiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  selectedPhotos: string[];
  setSelectedPhotos: React.Dispatch<React.SetStateAction<string[]>>;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  pdfGenerated: boolean;
  setPdfGenerated: React.Dispatch<React.SetStateAction<boolean>>;
}
