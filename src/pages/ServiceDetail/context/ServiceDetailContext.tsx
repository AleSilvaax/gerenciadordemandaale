
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { toast } from 'sonner';
import { Service, ServiceStatus, TeamMember } from '@/types/service';
import { getServiceById, convertDbServiceToAppService } from '@/services/api';
import { ServiceFormData } from '../types';

interface ServiceDetailContextType {
  service: Service | null;
  isLoading: boolean;
  selectedPhotos: string[];
  setSelectedPhotos: React.Dispatch<React.SetStateAction<string[]>>;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  pdfGenerated: boolean;
  setPdfGenerated: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  formState: ServiceFormData;
  handleFormChange: (field: string, value: any) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const defaultFormState: ServiceFormData = {
  title: '',
  status: 'pendente',
  location: '',
  technicianIds: [],
  client: '',
  address: '',
  city: '',
  executedBy: '',
  installationDate: '',
  modelNumber: '',
  serialNumberNew: '',
  serialNumberOld: '',
  homologatedName: '',
  compliesWithNBR17019: false,
  homologatedInstallation: false,
  requiredAdjustment: false,
  adjustmentDescription: '',
  validWarranty: false,
  circuitBreakerEntry: '',
  chargerCircuitBreaker: '',
  cableGauge: '',
  chargerStatus: '',
  technicalComments: ''
};

export const ServiceDetailContext = createContext<ServiceDetailContextType | undefined>(undefined);

export const ServiceDetailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [service, setService] = useState<Service | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [formState, setFormState] = useState<ServiceFormData>(defaultFormState);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const serviceData = await getServiceById(id);
        
        if (serviceData) {
          const formattedService = convertDbServiceToAppService(serviceData);
          setService(formattedService);
          setSelectedPhotos(formattedService.photos || []);
          
          // Initialize form state with service data
          setFormState({
            title: formattedService.title,
            status: formattedService.status,
            location: formattedService.location,
            technicianIds: formattedService.technicians.map(tech => tech.id),
            client: formattedService.reportData?.client || '',
            address: formattedService.reportData?.address || '',
            city: formattedService.reportData?.city || '',
            executedBy: formattedService.reportData?.executedBy || '',
            installationDate: formattedService.reportData?.installationDate || '',
            modelNumber: formattedService.reportData?.modelNumber || '',
            serialNumberNew: formattedService.reportData?.serialNumberNew || '',
            serialNumberOld: formattedService.reportData?.serialNumberOld || '',
            homologatedName: formattedService.reportData?.homologatedName || '',
            compliesWithNBR17019: formattedService.reportData?.compliesWithNBR17019 || false,
            homologatedInstallation: formattedService.reportData?.homologatedInstallation || false,
            requiredAdjustment: formattedService.reportData?.requiredAdjustment || false,
            adjustmentDescription: formattedService.reportData?.adjustmentDescription || '',
            validWarranty: formattedService.reportData?.validWarranty || false,
            circuitBreakerEntry: formattedService.reportData?.circuitBreakerEntry || '',
            chargerCircuitBreaker: formattedService.reportData?.chargerCircuitBreaker || '',
            cableGauge: formattedService.reportData?.cableGauge || '',
            chargerStatus: formattedService.reportData?.chargerStatus || '',
            technicalComments: formattedService.reportData?.technicalComments || ''
          });
        } else {
          uiToast({
            description: `Demanda #${id} não encontrada.`,
            variant: "destructive",
          });
          navigate('/demandas');
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes da demanda:", error);
        uiToast({
          description: "Erro ao carregar detalhes da demanda.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceDetails();
  }, [id, navigate, uiToast]);

  const handleFormChange = (field: string, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const contextValue: ServiceDetailContextType = {
    service,
    isLoading,
    selectedPhotos,
    setSelectedPhotos,
    isSubmitting,
    setIsSubmitting,
    pdfGenerated,
    setPdfGenerated,
    activeTab,
    setActiveTab,
    formState,
    handleFormChange,
    fileInputRef
  };

  return (
    <ServiceDetailContext.Provider value={contextValue}>
      {children}
    </ServiceDetailContext.Provider>
  );
};

export const useServiceDetail = () => {
  const context = useContext(ServiceDetailContext);
  if (context === undefined) {
    throw new Error('useServiceDetail must be used within a ServiceDetailProvider');
  }
  return context;
};
