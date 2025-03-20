import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, Save, Camera, Upload, Image, File, X, FileText,
  Check, CheckCircle2, XCircle, Download 
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
import { useToast } from "@/components/ui/use-toast";
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
import { useForm } from "react-hook-form";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { Service, ServiceStatus, TeamMember, teamMembers } from "@/data/mockData";
import { generatePDF, downloadPDF } from "@/utils/pdfGenerator";
import { toast } from "sonner";
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
  location: string;
  technician: string;
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

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [service, setService] = useState<Service | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const fetchedService = await getServiceById(id);
        
        if (fetchedService) {
          setService(fetchedService);
          if (fetchedService.photos) {
            setSelectedPhotos(fetchedService.photos);
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
      location: "",
      technician: "",
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
    }
  });

  useEffect(() => {
    if (service) {
      form.reset({
        title: service.title || "",
        status: service.status || "pendente",
        location: service.location || "",
        technician: service.technician?.id || "",
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
    }
  }, [service, form]);

  const onSubmit = async (data: FormValues) => {
    if (!id || !service) return;
    
    setIsSubmitting(true);
    
    try {
      const selectedTechnician = teamMembers.find(t => t.id === data.technician) || service.technician;
      
      const serviceUpdated = await updateService(id, {
        title: data.title,
        status: data.status,
        location: data.location,
        technician: selectedTechnician
      });
      
      const reportUpdated = await updateReportData(id, {
        client: data.client,
        address: data.address,
        city: data.city,
        executedBy: data.executedBy,
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
        technicalComments: data.technicalComments
      });
      
      if (JSON.stringify(service.photos) !== JSON.stringify(selectedPhotos)) {
        await updateServicePhotos(id, selectedPhotos);
      }
      
      if (serviceUpdated && reportUpdated) {
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    try {
      setIsSubmitting(true);
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo de imagem válido",
          variant: "destructive",
        });
        return;
      }
      
      const photoUrl = await addPhotoToService(id, file);
      
      const newPhotos = [...selectedPhotos, photoUrl];
      setSelectedPhotos(newPhotos);
      
      toast({
        title: "Foto adicionada",
        description: "A foto foi adicionada ao relatório com sucesso.",
      });
      
      const updatedService = await getServiceById(id);
      if (updatedService) {
        setService(updatedService);
      }
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar a foto. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async (photoUrl: string) => {
    if (!id) return;
    
    try {
      const updatedPhotos = selectedPhotos.filter(photo => photo !== photoUrl);
      setSelectedPhotos(updatedPhotos);
      
      const success = await updateServicePhotos(id, updatedPhotos);
      
      if (success) {
        toast({
          title: "Foto removida",
          description: "A foto foi removida do relatório.",
        });
        
        const updatedService = await getServiceById(id);
        if (updatedService) {
          setService(updatedService);
        }
      } else {
        setSelectedPhotos(selectedPhotos);
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

  const handleGeneratePDF = () => {
    if (!service) return;
    
    const updatedService = {
      ...service,
      title: form.getValues("title"),
      status: form.getValues("status") as any,
      location: form.getValues("location"),
      technician: teamMembers.find(t => t.id === form.getValues("technician")) || service.technician,
      reportData: {
        client: form.getValues("client"),
        address: form.getValues("address"),
        city: form.getValues("city"),
        executedBy: form.getValues("executedBy"),
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
        technicalComments: form.getValues("technicalComments")
      },
      photos: selectedPhotos
    };
    
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
    
    const updatedService = {
      ...service,
      title: form.getValues("title"),
      status: form.getValues("status") as any,
      location: form.getValues("location"),
      technician: teamMembers.find(t => t.id === form.getValues("technician")) || service.technician,
      reportData: {
        client: form.getValues("client"),
        address: form.getValues("address"),
        city: form.getValues("city"),
        executedBy: form.getValues("executedBy"),
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
        technicalComments: form.getValues("technicalComments")
      },
      photos: selectedPhotos
    };
    
    downloadPDF(updatedService);
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
            <div className="flex items-center mt-1">
              <span className="text-sm text-muted-foreground mr-2">Status:</span>
              <StatusBadge status={service.status} />
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="report">Relatório</TabsTrigger>
          <TabsTrigger value="photos">Fotos</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <TabsContent value="general" className="space-y-4">
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
            </TabsContent>

            <TabsContent value="report" className="space-y-4">
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

                <FormField
                  control={form.control}
                  name="technicalComments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comentários técnicos</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[100px]" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="photos" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Fotos do relatório</h3>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={16} className="mr-2" />
                    Adicionar fotos
                  </Button>
                </div>
              </div>

              {selectedPhotos.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {selectedPhotos.map((photo, index) => (
                    <div key={index} className="relative rounded-lg overflow-hidden">
                      <img 
                        src={photo} 
                        alt={`Foto ${index + 1}`} 
                        className="w-full h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo)}
                        className="absolute top-2 right-2 bg-black/70 rounded-full p-1 hover:bg-black/90"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-gray-300 rounded-lg bg-secondary/20">
                  <Image size={48} className="text-gray-400" />
                  <p className="text-muted-foreground text-center">
                    Nenhuma foto adicionada. Clique em "Adicionar fotos" para incluir imagens no relatório.
                  </p>
                </div>
              )}
            </TabsContent>

            <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-white/10 p-4 z-10">
              <div className="flex justify-between items-center max-w-md mx-auto">
                <Button type="button" variant="outline" onClick={() => navigate('/demandas')}>
                  Cancelar
                </Button>
                <div className="flex gap-2">
                  {form.watch("status") === "concluido" && (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleGeneratePDF}
                    >
                      <FileText size={16} className="mr-2" />
                      Gerar PDF
                    </Button>
                  )}
                  {pdfGenerated && (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleDownloadPDF}
                    >
                      <Download size={16} className="mr-2" />
                      Baixar PDF
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting}>
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
