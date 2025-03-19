
import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Service, ServiceStatus, TeamMember } from "@/types/service";

import ServiceForm from "./components/ServiceForm";
import ReportForm from "./components/ReportForm";
import PhotosTab from "./components/PhotosTab";
import BottomActionBar from "./components/BottomActionBar";
import { 
  getServiceById, 
  updateService, 
  convertDbServiceToAppService, 
  updateReportData, 
  addServicePhoto
} from "@/services/api";
import { supabase } from "@/integrations/supabase/client";

const StatusBadge = React.lazy(() => import("@/components/ui-custom/StatusBadge"));

const ServiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast: uiToast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [service, setService] = useState<Service | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const emptyService: Service = {
    id: "",
    title: "",
    status: "pendente",
    location: "",
    technicians: [],
    reportData: {
      client: "",
      address: "",
      city: "",
      executedBy: "",
      installationDate: "",
      modelNumber: "",
      serialNumberNew: "",
      serialNumberOld: "",
      homologatedName: "",
      compliesWithNBR17019: false,
      homologatedInstallation: false,
      requiredAdjustment: false,
      adjustmentDescription: "",
      validWarranty: false,
      circuitBreakerEntry: "",
      chargerCircuitBreaker: "",
      cableGauge: "",
      chargerStatus: "",
      technicalComments: ""
    },
    photos: []
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto animate-spin mb-4" />
          <p className="text-muted-foreground">Carregando dados da demanda...</p>
        </div>
      </div>
    );
  }

  const currentService = service || emptyService;
  
  const ServiceStatus = ({ status }: { status: ServiceStatus }) => {
    return (
      <div className="flex items-center mt-1">
        <span className="text-sm text-muted-foreground mr-2">Status:</span>
        <React.Suspense fallback={<span className="text-sm">Carregando...</span>}>
          <StatusBadge status={status} />
        </React.Suspense>
      </div>
    )
  };

  const ServiceDetailTabs = () => {
    const [formState, setFormState] = useState({
      title: currentService.title,
      status: currentService.status,
      location: currentService.location,
      technicianIds: currentService.technicians.map(tech => tech.id),
      client: currentService.reportData?.client || "",
      address: currentService.reportData?.address || "",
      city: currentService.reportData?.city || "",
      executedBy: currentService.reportData?.executedBy || "",
      installationDate: currentService.reportData?.installationDate || "",
      modelNumber: currentService.reportData?.modelNumber || "",
      serialNumberNew: currentService.reportData?.serialNumberNew || "",
      serialNumberOld: currentService.reportData?.serialNumberOld || "",
      homologatedName: currentService.reportData?.homologatedName || "",
      compliesWithNBR17019: currentService.reportData?.compliesWithNBR17019 || false,
      homologatedInstallation: currentService.reportData?.homologatedInstallation || false,
      requiredAdjustment: currentService.reportData?.requiredAdjustment || false,
      adjustmentDescription: currentService.reportData?.adjustmentDescription || "",
      validWarranty: currentService.reportData?.validWarranty || false,
      circuitBreakerEntry: currentService.reportData?.circuitBreakerEntry || "",
      chargerCircuitBreaker: currentService.reportData?.chargerCircuitBreaker || "",
      cableGauge: currentService.reportData?.cableGauge || "",
      chargerStatus: currentService.reportData?.chargerStatus || "",
      technicalComments: currentService.reportData?.technicalComments || ""
    });

    const handleFormChange = (field: string, value: any) => {
      setFormState(prev => ({ ...prev, [field]: value }));
    };
  
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
                <Button variant="default" size="sm" onClick={handleGeneratePDF}>
                  Gerar PDF
                </Button>
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

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0 || !id) {
        return;
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `services/${id}/${fileName}`;

      try {
        toast.loading("Enviando foto...");

        // Check if the bucket exists, create if it doesn't
        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets?.find(b => b.name === 'service-photos')) {
          await supabase.storage.createBucket('service-photos', { public: true });
        }

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('service-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('service-photos')
          .getPublicUrl(filePath);

        if (!publicUrlData) throw new Error("Failed to get public URL");

        const photoUrl = publicUrlData.publicUrl;
        const success = await addServicePhoto(id, photoUrl);
        
        if (success) {
          setSelectedPhotos([...selectedPhotos, photoUrl]);
          toast.success("Foto adicionada com sucesso!");
        } else {
          throw new Error("Failed to add photo to service");
        }
      } catch (error) {
        console.error("Error uploading photo:", error);
        toast.error("Erro ao adicionar foto. Por favor, tente novamente.");
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    const handleRemovePhoto = async (photoUrl: string) => {
      if (!id) return;

      try {
        // Extract the path from the URL
        const urlParts = photoUrl.split('/service-photos/');
        if (urlParts.length < 2) {
          throw new Error("Invalid photo URL format");
        }
        
        const filePath = urlParts[1];
        
        // First remove from database
        const { data: photoData, error: fetchError } = await supabase
          .from('service_photos')
          .select('id')
          .eq('photo_url', photoUrl)
          .eq('service_id', id)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        // If found in database, delete the record
        if (photoData) {
          const { error: deleteError } = await supabase
            .from('service_photos')
            .delete()
            .eq('id', photoData.id);
          
          if (deleteError) throw deleteError;
        }
        
        // Also try to remove from storage
        const { error: storageError } = await supabase.storage
          .from('service-photos')
          .remove([filePath]);
        
        // This might fail if file doesn't exist, but we still want to remove from UI
        if (storageError) {
          console.warn("Could not delete file from storage:", storageError);
        }
        
        // Update UI state regardless of storage deletion outcome
        setSelectedPhotos(selectedPhotos.filter(photo => photo !== photoUrl));
        toast.success("Foto removida com sucesso!");
        
      } catch (error) {
        console.error("Erro ao remover foto:", error);
        toast.error("Erro ao remover foto. Por favor, tente novamente.");
      }
    };

    const [pdfUtils, setPdfUtils] = useState<{
      generatePDF: (service: Service) => boolean;
      downloadPDF: (service: Service) => void;
    } | null>(null);

    useEffect(() => {
      import("@/utils/pdfGenerator").then(module => {
        setPdfUtils({
          generatePDF: module.generatePDF,
          downloadPDF: module.downloadPDF
        });
      });
    }, []);

    const handleGeneratePDF = () => {
      if (!pdfUtils || !currentService) return;
      
      const updatedService = {
        ...currentService,
        title: formState.title,
        status: formState.status as ServiceStatus,
        location: formState.location,
        technicians: formState.technicianIds.map(id => {
          const tech = currentService.technicians.find(t => t.id === id);
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
      if (!pdfUtils || !currentService) return;
      
      const updatedService = {
        ...currentService,
        title: formState.title,
        status: formState.status as ServiceStatus,
        location: formState.location,
        technicians: formState.technicianIds.map(id => {
          const tech = currentService.technicians.find(t => t.id === id);
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
              onSave={handleSubmit}
            />
          </form>
        </Tabs>
      </>
    );
  };

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
          {currentService.status && (
            <ServiceStatus status={currentService.status} />
          )}
        </div>
      </div>

      <ServiceDetailTabs />
    </div>
  );
};

export default ServiceDetailPage;
