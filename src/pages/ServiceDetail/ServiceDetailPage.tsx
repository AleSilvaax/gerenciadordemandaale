
import React, { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Service, TeamMember, services, teamMembers } from "@/data/mockData";
import { toast } from "sonner";

import ServiceForm from "./components/ServiceForm";
import ReportForm from "./components/ReportForm";
import PhotosTab from "./components/PhotosTab";
import BottomActionBar from "./components/BottomActionBar";

const ServiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Find the service by ID
  const service = services.find(s => s.id === id) || {
    id: "",
    title: "",
    status: "pendente" as const,
    location: "",
    technician: teamMembers[0],
    reportData: {},
    photos: []
  };

  // Initialize selected photos
  React.useEffect(() => {
    if (service.photos) {
      setSelectedPhotos(service.photos);
    }
  }, [service.photos]);
  
  // Use the refactored components to handle form logic and rendering

  return (
    <div className="min-h-screen p-4 pb-20 page-transition">
      <div className="flex items-center mb-6">
        <Link to="/demandas" className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary border border-white/10 mr-4">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">
            {id ? `Demanda #${id}` : "Nova Demanda"}
          </h1>
          {service.status && (
            <ServiceStatus status={service.status} />
          )}
        </div>
      </div>

      <ServiceDetailTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        service={service}
        selectedPhotos={selectedPhotos}
        setSelectedPhotos={setSelectedPhotos}
        fileInputRef={fileInputRef}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
        pdfGenerated={pdfGenerated}
        setPdfGenerated={setPdfGenerated}
        navigate={navigate}
      />
    </div>
  );
};

const ServiceStatus = ({ status }: { status: Service["status"] }) => {
  const StatusBadge = React.lazy(() => import("@/components/ui-custom/StatusBadge"));
  
  return (
    <div className="flex items-center mt-1">
      <span className="text-sm text-muted-foreground mr-2">Status:</span>
      <React.Suspense fallback={<span className="text-sm">Carregando...</span>}>
        <StatusBadge status={status} />
      </React.Suspense>
    </div>
  )
};

const ServiceDetailTabs = ({ 
  activeTab, 
  setActiveTab, 
  service, 
  selectedPhotos, 
  setSelectedPhotos,
  fileInputRef,
  isSubmitting,
  setIsSubmitting,
  pdfGenerated,
  setPdfGenerated,
  navigate
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  service: Service;
  selectedPhotos: string[];
  setSelectedPhotos: React.Dispatch<React.SetStateAction<string[]>>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  pdfGenerated: boolean;
  setPdfGenerated: React.Dispatch<React.SetStateAction<boolean>>;
  navigate: ReturnType<typeof useNavigate>;
}) => {
  const [formState, setFormState] = useState({
    title: service.title,
    status: service.status,
    location: service.location,
    technician: service.technician.id,
    client: service.reportData?.client || "",
    address: service.reportData?.address || "",
    city: service.reportData?.city || "",
    executedBy: service.reportData?.executedBy || "",
    installationDate: service.reportData?.installationDate || "",
    modelNumber: service.reportData?.modelNumber || "",
    serialNumberNew: service.reportData?.serialNumberNew || "",
    serialNumberOld: service.reportData?.serialNumberOld || "",
    homologatedName: service.reportData?.homologatedName || "",
    compliesWithNBR17019: service.reportData?.compliesWithNBR17019 || false,
    homologatedInstallation: service.reportData?.homologatedInstallation || false,
    requiredAdjustment: service.reportData?.requiredAdjustment || false,
    adjustmentDescription: service.reportData?.adjustmentDescription || "",
    validWarranty: service.reportData?.validWarranty || false,
    circuitBreakerEntry: service.reportData?.circuitBreakerEntry || "",
    chargerCircuitBreaker: service.reportData?.chargerCircuitBreaker || "",
    cableGauge: service.reportData?.cableGauge || "",
    chargerStatus: service.reportData?.chargerStatus || "",
    technicalComments: service.reportData?.technicalComments || ""
  });

  const handleFormChange = (field: string, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // In a real application, this would update the service data in the backend
    // For this mock version, we'll just show a success toast
    setTimeout(() => {
      setIsSubmitting(false);
      
      toast({
        title: "Demanda atualizada",
        description: `As alterações na demanda ${service.id} foram salvas com sucesso.`,
      });
      
      // If status is completed, ask if the user wants to generate a PDF
      if (formState.status === "concluido" && !pdfGenerated) {
        setTimeout(() => {
          toast({
            title: "Relatório disponível",
            description: "O serviço foi concluído. Deseja gerar o PDF do relatório?",
            action: (
              <Button variant="default" size="sm" onClick={() => handleGeneratePDF()}>
                Gerar PDF
              </Button>
            ),
          });
        }, 500);
      }
    }, 1000);
  };

  // Handle photo uploads
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Mock photo upload - in a real application, this would upload the photos to a server
    // and return URLs. For this example, we'll use the photos from the data.
    const mockPhotoURLs = [
      "/lovable-uploads/bd3b11fc-9a17-4507-b28b-d47cf1678ad8.png",
      "/lovable-uploads/86cd5924-e313-4335-8a20-13c65aedd078.png",
      "/lovable-uploads/4efdaad5-6ec2-44d7-9128-ce9b043b4377.png",
      "/lovable-uploads/a333754c-948f-42e3-b154-d1468a519a75.png",
      "/lovable-uploads/4df72a6d-1dc8-44c2-b61d-cb6504af2b1f.png",
      "/lovable-uploads/3c26bd66-6e28-4b07-a3ca-e80a3a92ae06.png",
      "/lovable-uploads/6bfabcbb-e3dc-46e9-985a-ef6610069890.png"
    ];
    
    // Add a random photo from the mock list
    const randomPhoto = mockPhotoURLs[Math.floor(Math.random() * mockPhotoURLs.length)];
    
    if (!selectedPhotos.includes(randomPhoto)) {
      setSelectedPhotos([...selectedPhotos, randomPhoto]);
      toast({
        title: "Foto adicionada",
        description: "A foto foi adicionada ao relatório com sucesso.",
      });
    }
  };

  // Handle photo removal
  const handleRemovePhoto = (photoUrl: string) => {
    setSelectedPhotos(selectedPhotos.filter(photo => photo !== photoUrl));
    toast({
      title: "Foto removida",
      description: "A foto foi removida do relatório.",
      variant: "destructive",
    });
  };

  // Import PDF generation utilities
  const { generatePDF, downloadPDF } = React.useMemo(() => {
    return import("@/utils/pdfGenerator").then(module => ({
      generatePDF: module.generatePDF,
      downloadPDF: module.downloadPDF
    }));
  }, []);

  // Handle PDF generation
  const handleGeneratePDF = () => {
    // Create updated service object with form data
    const updatedService = {
      ...service,
      title: formState.title,
      status: formState.status as any,
      location: formState.location,
      technician: teamMembers.find(t => t.id === formState.technician) || service.technician,
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
    
    // Call the PDF generator utility with updated service
    const result = generatePDF(updatedService);
    
    if (result) {
      setPdfGenerated(true);
    }
  };

  // Handle PDF download
  const handleDownloadPDF = () => {
    // Create updated service object with form data
    const updatedService = {
      ...service,
      title: formState.title,
      status: formState.status as any,
      location: formState.location,
      technician: teamMembers.find(t => t.id === formState.technician) || service.technician,
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
    
    // Call the PDF download utility
    downloadPDF(updatedService);
  };

  return (
    <>
      <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="report">Relatório</TabsTrigger>
          <TabsTrigger value="photos">Fotos</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TabsContent value="general" className="space-y-4">
            <ServiceForm 
              formState={formState}
              onChange={handleFormChange}
            />
          </TabsContent>

          <TabsContent value="report" className="space-y-4">
            <ReportForm 
              formState={formState}
              onChange={handleFormChange}
            />
          </TabsContent>

          <TabsContent value="photos" className="space-y-4">
            <PhotosTab
              selectedPhotos={selectedPhotos}
              handlePhotoUpload={handlePhotoUpload}
              handleRemovePhoto={handleRemovePhoto}
              fileInputRef={fileInputRef}
            />
          </TabsContent>

          <BottomActionBar
            isSubmitting={isSubmitting}
            pdfGenerated={pdfGenerated}
            status={formState.status}
            onCancel={() => navigate('/demandas')}
            onGeneratePDF={handleGeneratePDF}
            onDownloadPDF={handleDownloadPDF}
          />
        </form>
      </Tabs>
    </>
  );
};

export default ServiceDetailPage;
