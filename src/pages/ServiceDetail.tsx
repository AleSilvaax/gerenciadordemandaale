
import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, Save, Camera, Upload, Image, File, X, FileText,
  Check, CheckCircle2, XCircle, Download, Clipboard, Zap, Wrench, FileDown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { SignatureCanvas } from "@/components/ui-custom/SignatureCanvas";
import { PhotoUploader } from "@/components/ui-custom/PhotoUploader";
import { Service, ServiceStatus, TeamMember, teamMembers } from "@/data/mockData";
import { 
  generatePDF, 
  downloadPDF, 
  downloadInspectionPDF,
  downloadInstallationPDF 
} from "@/utils/pdfGenerator";
import { 
  getServiceById, 
  updateService, 
  updateReportData, 
  updateServicePhotos,
  addPhotoToService
} from "@/services/api";

interface FormValues {
  title: string;
  status: ServiceStatus;
  servicePhase: "inspection" | "installation";
  location: string;
  technician: string;
  client: string;
  clientName: string;
  address: string;
  city: string;
  executedBy: string;
  inspectionDate: string;
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
  chargerLoad: string;
  voltage: string;
  supplyType: string;
  installationDistance: string;
  installationObstacles: string;
  existingPanel: boolean;
  panelType: string;
  panelAmps: string;
  voltageBetweenPhases: string;
  voltageBetweenPhaseAndNeutral: string;
  hasThreePhase: boolean;
  groundingSystem: string;
  wallboxBrand: string;
  wallboxPower: string;
  powerSupplyType: string;
  needsInfrastructure: boolean;
  needsScaffolding: boolean;
  needsTechnicalHole: boolean;
  needsMasonry: boolean;
  artNumber: string;
  technicalComments: string;
}

interface PhotoDetails {
  url: string;
  title: string;
}

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [photoDetails, setPhotoDetails] = useState<PhotoDetails[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [service, setService] = useState<Service | null>(null);
  const [clientSignature, setClientSignature] = useState<string>("");
  const [technicianSignature, setTechnicianSignature] = useState<string>("");
  
  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const fetchedService = await getServiceById(id);
        
        if (fetchedService) {
          setService(fetchedService);
          
          // Initialize photo details if available
          if (fetchedService.photos && fetchedService.photos.length > 0) {
            const photos = fetchedService.photos.map((url, index) => ({
              url,
              title: fetchedService.photoTitles?.[index] || `Foto ${index + 1}`
            }));
            setPhotoDetails(photos);
          }
          
          // Initialize signatures if available
          if (fetchedService.reportData?.clientSignature) {
            setClientSignature(fetchedService.reportData.clientSignature);
          }
          
          if (fetchedService.technician.signature) {
            setTechnicianSignature(fetchedService.technician.signature);
          }
        } else {
          toast({
            title: "Erro",
            description: "Demanda não encontrada",
            variant: "destructive",
          });
          navigate('/demandas');
        }
      } catch (error) {
        console.error("Error fetching service:", error);
        toast({
          title: "Erro",
          description: "Falha ao carregar os dados da demanda",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchService();
  }, [id, navigate, toast]);
  
  const form = useForm<FormValues>({
    defaultValues: {
      title: "",
      status: "pendente",
      servicePhase: "inspection",
      location: "",
      technician: "",
      client: "",
      clientName: "",
      address: "",
      city: "",
      executedBy: "",
      inspectionDate: "",
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
      chargerLoad: "",
      voltage: "",
      supplyType: "",
      installationDistance: "",
      installationObstacles: "",
      existingPanel: false,
      panelType: "",
      panelAmps: "",
      voltageBetweenPhases: "",
      voltageBetweenPhaseAndNeutral: "",
      hasThreePhase: false,
      groundingSystem: "",
      wallboxBrand: "",
      wallboxPower: "",
      powerSupplyType: "",
      needsInfrastructure: false,
      needsScaffolding: false,
      needsTechnicalHole: false,
      needsMasonry: false,
      artNumber: "",
      technicalComments: ""
    }
  });

  useEffect(() => {
    if (service) {
      form.reset({
        title: service.title || "",
        status: service.status || "pendente",
        servicePhase: service.reportData?.servicePhase || "inspection",
        location: service.location || "",
        technician: service.technician?.id || "",
        client: service.reportData?.client || "",
        clientName: service.reportData?.clientName || "",
        address: service.reportData?.address || "",
        city: service.reportData?.city || "",
        executedBy: service.reportData?.executedBy || "",
        inspectionDate: service.reportData?.inspectionDate || "",
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
        chargerLoad: service.reportData?.chargerLoad || "",
        voltage: service.reportData?.voltage || "",
        supplyType: service.reportData?.supplyType || "",
        installationDistance: service.reportData?.installationDistance || "",
        installationObstacles: service.reportData?.installationObstacles || "",
        existingPanel: service.reportData?.existingPanel || false,
        panelType: service.reportData?.panelType || "",
        panelAmps: service.reportData?.panelAmps || "",
        voltageBetweenPhases: service.reportData?.voltageBetweenPhases || "",
        voltageBetweenPhaseAndNeutral: service.reportData?.voltageBetweenPhaseAndNeutral || "",
        hasThreePhase: service.reportData?.hasThreePhase || false,
        groundingSystem: service.reportData?.groundingSystem || "",
        wallboxBrand: service.reportData?.wallboxBrand || "",
        wallboxPower: service.reportData?.wallboxPower || "",
        powerSupplyType: service.reportData?.powerSupplyType || "",
        needsInfrastructure: service.reportData?.needsInfrastructure || false,
        needsScaffolding: service.reportData?.needsScaffolding || false,
        needsTechnicalHole: service.reportData?.needsTechnicalHole || false,
        needsMasonry: service.reportData?.needsMasonry || false,
        artNumber: service.reportData?.artNumber || "",
        technicalComments: service.reportData?.technicalComments || ""
      });
    }
  }, [service, form]);

  const onSubmit = async (data: FormValues) => {
    if (!id || !service) return;
    
    setIsSubmitting(true);
    toast({
      title: "Salvando alterações",
      description: "Por favor aguarde enquanto salvamos as informações..."
    });
    
    try {
      const selectedTechnician = teamMembers.find(t => t.id === data.technician) || service.technician;
      
      // Update technician signature if changed
      if (technicianSignature !== service.technician.signature) {
        selectedTechnician.signature = technicianSignature;
      }
      
      const serviceUpdated = await updateService(id, {
        title: data.title,
        status: data.status,
        location: data.location,
        technician: selectedTechnician
      });
      
      // Extract photo URLs and titles
      const photoUrls = photoDetails.map(p => p.url);
      const photoTitles = photoDetails.map(p => p.title);
      
      const reportUpdated = await updateReportData(id, {
        servicePhase: data.servicePhase,
        client: data.client,
        clientName: data.clientName,
        clientSignature: clientSignature,
        address: data.address,
        city: data.city,
        executedBy: data.executedBy,
        inspectionDate: data.inspectionDate,
        installationDate: data.installationDate,
        modelNumber: data.modelNumber,
        serialNumberNew: data.serialNumberNew,
        serialNumberOld: data.serialNumberOld,
        homologatedName: data.homologatedName,
        compliesWithNBR17019: data.compliesWithNBR17019,
        homologatedInstallation: data.homologatedInstallation,
        requiredAdjustment: data.requiredAdjustment,
        adjustmentDescription: data.adjustmentDescription,
        validWarranty: data.validWarranty,
        circuitBreakerEntry: data.circuitBreakerEntry,
        chargerCircuitBreaker: data.chargerCircuitBreaker,
        cableGauge: data.cableGauge,
        chargerStatus: data.chargerStatus,
        chargerLoad: data.chargerLoad,
        voltage: data.voltage,
        supplyType: data.supplyType,
        installationDistance: data.installationDistance,
        installationObstacles: data.installationObstacles,
        existingPanel: data.existingPanel,
        panelType: data.panelType,
        panelAmps: data.panelAmps,
        voltageBetweenPhases: data.voltageBetweenPhases,
        voltageBetweenPhaseAndNeutral: data.voltageBetweenPhaseAndNeutral,
        hasThreePhase: data.hasThreePhase,
        groundingSystem: data.groundingSystem,
        wallboxBrand: data.wallboxBrand,
        wallboxPower: data.wallboxPower,
        powerSupplyType: data.powerSupplyType,
        needsInfrastructure: data.needsInfrastructure,
        needsScaffolding: data.needsScaffolding,
        needsTechnicalHole: data.needsTechnicalHole,
        needsMasonry: data.needsMasonry,
        artNumber: data.artNumber,
        technicalComments: data.technicalComments
      });
      
      // Update photos and titles
      let photosUpdated = true;
      if (JSON.stringify(service.photos) !== JSON.stringify(photoUrls) || 
          JSON.stringify(service.photoTitles) !== JSON.stringify(photoTitles)) {
        photosUpdated = await updateServicePhotos(id, photoUrls, photoTitles);
      }
      
      if (serviceUpdated && reportUpdated && photosUpdated) {
        const updatedService = await getServiceById(id);
        if (updatedService) {
          setService(updatedService);
        }
        
        toast({
          title: "Demanda atualizada",
          description: `As alterações na demanda ${id} foram salvas com sucesso.`,
        });
        
        if (data.status === "concluido" && !pdfGenerated) {
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
      } else {
        throw new Error("Falha ao salvar alguma das informações");
      }
    } catch (error) {
      console.error("Error updating service:", error);
      toast({
        title: "Erro",
        description: "Falha ao salvar as alterações da demanda",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPhoto = async (file: File, title: string) => {
    if (!id) return;
    
    try {
      const photoUrl = await addPhotoToService(id, file);
      
      // Add new photo with title
      const newPhotoDetails = [...photoDetails, { url: photoUrl, title }];
      setPhotoDetails(newPhotoDetails);
      
      toast({
        title: "Foto adicionada",
        description: "A foto foi adicionada ao relatório com sucesso.",
      });
      
      return photoUrl;
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar a foto. Por favor, tente novamente.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleRemovePhoto = async (index: number) => {
    if (!id) return;
    
    try {
      const updatedPhotoDetails = [...photoDetails];
      updatedPhotoDetails.splice(index, 1);
      setPhotoDetails(updatedPhotoDetails);
      
      // Extract URLs and titles
      const photoUrls = updatedPhotoDetails.map(p => p.url);
      const photoTitles = updatedPhotoDetails.map(p => p.title);
      
      const success = await updateServicePhotos(id, photoUrls, photoTitles);
      
      if (success) {
        toast({
          title: "Foto removida",
          description: "A foto foi removida do relatório.",
        });
      } else {
        // Revert if update failed
        setPhotoDetails(photoDetails);
        toast({
          title: "Erro",
          description: "Falha ao remover a foto do relatório",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error removing photo:", error);
      toast({
        title: "Erro",
        description: "Falha ao remover a foto",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePhotoTitle = async (index: number, newTitle: string) => {
    if (!id) return;
    
    try {
      const updatedPhotoDetails = [...photoDetails];
      updatedPhotoDetails[index].title = newTitle;
      setPhotoDetails(updatedPhotoDetails);
      
      // Extract URLs and titles
      const photoUrls = updatedPhotoDetails.map(p => p.url);
      const photoTitles = updatedPhotoDetails.map(p => p.title);
      
      const success = await updateServicePhotos(id, photoUrls, photoTitles);
      
      if (!success) {
        // Revert if update failed
        setPhotoDetails(photoDetails);
        toast({
          title: "Erro",
          description: "Falha ao atualizar o título da foto",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating photo title:", error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar o título da foto",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePDF = () => {
    if (!service) return;
    
    const updatedService = prepareServiceForPDF();
    
    const result = generatePDF(updatedService);
    
    if (result) {
      setPdfGenerated(true);
      toast({
        title: "PDF gerado",
        description: "O PDF do relatório foi gerado com sucesso.",
      });
    } else {
      toast({
        title: "Erro",
        description: "Falha ao gerar o PDF do relatório",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = () => {
    if (!service) return;
    
    const updatedService = prepareServiceForPDF();
    downloadPDF(updatedService);
  };

  const handleDownloadInspectionPDF = () => {
    if (!service) return;
    
    const updatedService = prepareServiceForPDF();
    downloadInspectionPDF(updatedService);
  };

  const handleDownloadInstallationPDF = () => {
    if (!service) return;
    
    const updatedService = prepareServiceForPDF();
    downloadInstallationPDF(updatedService);
  };

  const prepareServiceForPDF = () => {
    // Prepare updated service with all current data for PDF generation
    return {
      ...service,
      title: form.getValues("title"),
      status: form.getValues("status") as ServiceStatus,
      location: form.getValues("location"),
      technician: {
        ...service.technician,
        signature: technicianSignature
      },
      reportData: {
        servicePhase: form.getValues("servicePhase"),
        client: form.getValues("client"),
        clientName: form.getValues("clientName"),
        clientSignature: clientSignature,
        address: form.getValues("address"),
        city: form.getValues("city"),
        executedBy: form.getValues("executedBy"),
        inspectionDate: form.getValues("inspectionDate"),
        installationDate: form.getValues("installationDate"),
        modelNumber: form.getValues("modelNumber"),
        serialNumberNew: form.getValues("serialNumberNew"),
        serialNumberOld: form.getValues("serialNumberOld"),
        homologatedName: form.getValues("homologatedName"),
        compliesWithNBR17019: form.getValues("compliesWithNBR17019"),
        homologatedInstallation: form.getValues("homologatedInstallation"),
        requiredAdjustment: form.getValues("requiredAdjustment"),
        adjustmentDescription: form.getValues("adjustmentDescription"),
        validWarranty: form.getValues("validWarranty"),
        circuitBreakerEntry: form.getValues("circuitBreakerEntry"),
        chargerCircuitBreaker: form.getValues("chargerCircuitBreaker"),
        cableGauge: form.getValues("cableGauge"),
        chargerStatus: form.getValues("chargerStatus"),
        chargerLoad: form.getValues("chargerLoad"),
        voltage: form.getValues("voltage"),
        supplyType: form.getValues("supplyType"),
        installationDistance: form.getValues("installationDistance"),
        installationObstacles: form.getValues("installationObstacles"),
        existingPanel: form.getValues("existingPanel"),
        panelType: form.getValues("panelType"),
        panelAmps: form.getValues("panelAmps"),
        voltageBetweenPhases: form.getValues("voltageBetweenPhases"),
        voltageBetweenPhaseAndNeutral: form.getValues("voltageBetweenPhaseAndNeutral"),
        hasThreePhase: form.getValues("hasThreePhase"),
        groundingSystem: form.getValues("groundingSystem"),
        wallboxBrand: form.getValues("wallboxBrand"),
        wallboxPower: form.getValues("wallboxPower"),
        powerSupplyType: form.getValues("powerSupplyType"),
        needsInfrastructure: form.getValues("needsInfrastructure"),
        needsScaffolding: form.getValues("needsScaffolding"),
        needsTechnicalHole: form.getValues("needsTechnicalHole"),
        needsMasonry: form.getValues("needsMasonry"),
        artNumber: form.getValues("artNumber"),
        technicalComments: form.getValues("technicalComments")
      },
      photos: photoDetails.map(p => p.url),
      photoTitles: photoDetails.map(p => p.title)
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="32" strokeDashoffset="10" />
            </svg>
          </div>
          <p className="text-muted-foreground">Carregando dados da demanda...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Demanda não encontrada</h2>
          <p className="text-muted-foreground mb-4">A demanda solicitada não existe ou foi removida.</p>
          <Button onClick={() => navigate('/demandas')}>Voltar para Demandas</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-32 page-transition">
      <div className="flex items-center mb-6">
        <Link to="/demandas" className="h-10 w-10 rounded-full flex items-center justify-center bg-secondary border border-white/10 mr-4">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">
            {id ? `Demanda #${id}` : "Nova Demanda"}
          </h1>
          {service?.status && (
            <div className="flex items-center mt-1">
              <span className="text-sm text-muted-foreground mr-2">Status:</span>
              <StatusBadge status={service.status} />
              {service.reportData?.servicePhase && (
                <span className="ml-2 text-sm bg-secondary/60 text-primary px-2 py-0.5 rounded">
                  {service.reportData.servicePhase === "inspection" ? "Vistoria" : "Instalação"}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="inspection">Vistoria</TabsTrigger>
          <TabsTrigger value="installation">Instalação</TabsTrigger>
          <TabsTrigger value="photos">Fotos</TabsTrigger>
          <TabsTrigger value="signatures">Assinaturas</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <TabsContent value="general" className="space-y-4">
              <FormField
                control={form.control}
                name="servicePhase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fase do Serviço</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a fase" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="inspection">Vistoria</SelectItem>
                        <SelectItem value="installation">Instalação</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="technician"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Técnico Responsável</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o técnico" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teamMembers
                          .filter(member => member.role === "tecnico")
                          .map(technician => (
                            <SelectItem 
                              key={technician.id} 
                              value={technician.id}
                              className="flex items-center"
                            >
                              <div className="flex items-center">
                                <TeamMemberAvatar
                                  src={technician.avatar}
                                  name={technician.name}
                                  size="sm"
                                  className="mr-2"
                                />
                                {technician.name}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo do Cliente</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="executedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Executante</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="inspection" className="space-y-4">
              <div className="flex items-center space-x-2 p-3 rounded-md bg-secondary/30 mb-4">
                <Clipboard className="h-5 w-5 text-primary" />
                <h3 className="text-md font-medium">Levantamento Infraestrutural e Elétrico</h3>
              </div>

              <FormField
                control={form.control}
                name="inspectionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Vistoria</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" placeholder="DD/MM/AAAA" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="voltage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tensão do local (V)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supplyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de alimentação</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monofasico">Monofásico</SelectItem>
                          <SelectItem value="bifasico">Bifásico</SelectItem>
                          <SelectItem value="trifasico">Trifásico</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="installationDistance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distância até o ponto de instalação (m)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="installationObstacles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Obstáculos no percurso</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 mt-4">
                <h3 className="text-lg font-medium">Wallbox</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="wallboxBrand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca do Wallbox</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="wallboxPower"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Potência do Wallbox (kW)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="powerSupplyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Alimentação</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="existingPanel"
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="existingPanel" 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="existingPanel">Possui quadro elétrico existente</Label>
                    </div>
                  )}
                />

                {form.watch("existingPanel") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6 pl-2 border-l-2 border-secondary/50">
                    <FormField
                      control={form.control}
                      name="panelType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de quadro</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="panelAmps"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Corrente do quadro (A)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="voltageBetweenPhases"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tensão entre fases (V)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="voltageBetweenPhaseAndNeutral"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tensão fase/neutro (V)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="hasThreePhase"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="hasThreePhase" 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <Label htmlFor="hasThreePhase">Trifásico</Label>
                        </div>
                      )}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 mt-4">
                <h3 className="text-lg font-medium">Infraestrutura Necessária</h3>
                
                <FormField
                  control={form.control}
                  name="needsInfrastructure"
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="needsInfrastructure" 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="needsInfrastructure">Necessita de infraestrutura</Label>
                    </div>
                  )}
                />
                
                {form.watch("needsInfrastructure") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6 pl-2 border-l-2 border-secondary/50">
                    <FormField
                      control={form.control}
                      name="needsScaffolding"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="needsScaffolding" 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <Label htmlFor="needsScaffolding">Necessita andaime</Label>
                        </div>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="needsTechnicalHole"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="needsTechnicalHole" 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <Label htmlFor="needsTechnicalHole">Necessita furo técnico</Label>
                        </div>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="needsMasonry"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="needsMasonry" 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <Label htmlFor="needsMasonry">Necessita alvenaria</Label>
                        </div>
                      )}
                    />
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="groundingSystem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sistema de aterramento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o sistema" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="TN-S">TN-S</SelectItem>
                        <SelectItem value="TN-C">TN-C</SelectItem>
                        <SelectItem value="TN-C-S">TN-C-S</SelectItem>
                        <SelectItem value="TT">TT</SelectItem>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="Inexistente">Inexistente</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="artNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da ART</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="technicalComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações da vistoria</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[100px]" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent value="installation" className="space-y-4">
              <div className="flex items-center space-x-2 p-3 rounded-md bg-secondary/30 mb-4">
                <Zap className="h-5 w-5 text-primary" />
                <h3 className="text-md font-medium">Detalhes da Instalação</h3>
              </div>

              <FormField
                control={form.control}
                name="installationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Instalação</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" placeholder="DD/MM/AAAA" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="modelNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca e Modelo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNumberNew"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Série (novo)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNumberOld"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Série (antigo)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="homologatedName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Homologado</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chargerLoad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Potência do carregador (kW)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 mt-4">
                <h3 className="text-lg font-medium">Características da Instalação</h3>
                
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="compliesWithNBR17019"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="compliesWithNBR17019" 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="compliesWithNBR17019">Instalação existente atende NBR17019</Label>
                      </div>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="homologatedInstallation"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="homologatedInstallation" 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="homologatedInstallation">Foi realizada com homologado</Label>
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requiredAdjustment"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="requiredAdjustment" 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="requiredAdjustment">Foi necessário adequação</Label>
                      </div>
                    )}
                  />

                  {form.watch("requiredAdjustment") && (
                    <FormField
                      control={form.control}
                      name="adjustmentDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descreva a adequação realizada</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="validWarranty"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="validWarranty" 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="validWarranty">Garantia Procede</Label>
                      </div>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="circuitBreakerEntry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disjuntor de entrada</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="chargerCircuitBreaker"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disjuntor do carregador</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cableGauge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bitola do cabo</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="chargerStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status do carregador</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="photos" className="space-y-4">
              <div className="flex items-center space-x-2 p-3 rounded-md bg-secondary/30 mb-4">
                <Image className="h-5 w-5 text-primary" />
                <h3 className="text-md font-medium">Registros Fotográficos</h3>
              </div>
              
              <PhotoUploader
                photos={photoDetails}
                onAddPhoto={handleAddPhoto}
                onRemovePhoto={handleRemovePhoto}
                onUpdateTitle={handleUpdatePhotoTitle}
                className="mt-4"
              />
            </TabsContent>

            <TabsContent value="signatures" className="space-y-4">
              <div className="flex items-center space-x-2 p-3 rounded-md bg-secondary/30 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-md font-medium">Assinaturas Digitais</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <SignatureCanvas
                  id="client-signature"
                  label="Assinatura do Cliente"
                  value={clientSignature}
                  onChange={setClientSignature}
                />
                
                <SignatureCanvas
                  id="technician-signature"
                  label="Assinatura do Técnico"
                  value={technicianSignature}
                  onChange={setTechnicianSignature}
                />
              </div>
            </TabsContent>

            <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50 shadow-lg">
              <div className="container flex justify-between items-center max-w-5xl mx-auto">
                <Button type="button" variant="outline" onClick={() => navigate('/demandas')}>
                  Cancelar
                </Button>
                <div className="flex gap-2">
                  {(form.watch("status") === "concluido" || service?.status === "concluido") && (
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleDownloadInspectionPDF}
                      >
                        <FileDown size={16} className="mr-2" />
                        Baixar PDF Vistoria
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleDownloadInstallationPDF}
                      >
                        <FileDown size={16} className="mr-2" />
                        Baixar PDF Instalação
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="secondary"
                        onClick={handleGeneratePDF}
                      >
                        <FileText size={16} className="mr-2" />
                        Gerar PDF Atual
                      </Button>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin mr-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="32" strokeDashoffset="10" />
                          </svg>
                        </span>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  );
};

export default ServiceDetail;
