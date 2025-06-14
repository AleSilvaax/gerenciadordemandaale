import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileSpreadsheet, FilePenLine, Camera, MessageSquare, Star, CheckCircle2, ClipboardCheck, Download, Send, Plus } from "lucide-react";
import { 
  getService, 
  updateService 
} from '@/services/api';
import { 
  addServiceMessage,
  addServiceFeedback
} from '@/services/servicesDataService';
import { Service, ServiceMessage, ServiceFeedback } from '@/types/serviceTypes';
import { toast } from "sonner";
import { exportServicesToExcel, exportServicesToPDF } from '@/utils/reportExport';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhotoUploader } from "@/components/ui-custom/PhotoUploader";
import { SignatureCapture } from "@/components/ui-custom/SignatureCapture";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm } from "react-hook-form";
import { generatePDF } from "@/utils/pdfGenerator";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import ServiceSignatureSection from "./components/ServiceSignatureSection";
import ServicePhotosSection from "./components/ServicePhotosSection";
import DetailsFormSection from "./components/DetailsFormSection";
import ServiceFlowSection from "./components/ServiceFlowSection";
import PhotosSection from "./components/PhotosSection";
import ChatSection from "./components/ChatSection";
import FeedbackSection from "./components/FeedbackSection";
import { supabase } from '@/integrations/supabase/client';
import { useReportData } from "@/hooks/useReportData";

const ServiceDetail: React.FC<{ editMode?: boolean }> = ({ editMode = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);
  const [newMessage, setNewMessage] = useState<string>("");
  const [photoUploadUrl, setPhotoUploadUrl] = useState<string>("");
  const [photoTitle, setPhotoTitle] = useState<string>("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Forms
  const detailsForm = useForm();
  const reportForm = useForm();
  const feedbackForm = useForm();

  useEffect(() => {
    if (!id) return;
    
    const fetchServiceDetails = async () => {
      setIsLoading(true);
      try {
        const data = await getService(id);
        setService(data);
        
        // Set active tab based on service status
        if (data?.status === "concluido") {
          setActiveTab("feedback");
        } else if (data?.status === "pendente" && data?.serviceType === "Instalação") {
          setActiveTab("report");
        }
      } catch (error) {
        console.error('Error fetching service details:', error);
        toast.error('Erro ao carregar detalhes da demanda');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServiceDetails();
  }, [id]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [service?.messages]);

  const handleExportReport = (type: 'excel' | 'pdf') => {
    if (!service) return;
    
    try {
      if (type === 'excel') {
        exportServicesToExcel([service]);
        toast.success('Relatório Excel gerado com sucesso');
      } else {
        exportServicesToPDF([service]);
        toast.success('Relatório PDF gerado com sucesso');
      }
    } catch (error) {
      console.error(`Error exporting ${type} report:`, error);
      toast.error(`Erro ao gerar relatório ${type.toUpperCase()}`);
    }
  };

  const handleGenerateDetailedReport = () => {
    if (!service) {
      toast.error("Serviço não encontrado.");
      return;
    }

    const getServicePhase = (type: string | undefined): "inspection" | "installation" => {
      return type === "Vistoria" ? "inspection" : "installation";
    };

    // Forçar campos obrigatórios para evitar undefined
    // Força todas as listas e booleans essenciais
    const safeService: Service = {
      ...service,
      client: service.client || service.reportData?.client || "Não informado",
      reportData: {
        ...service.reportData,
        // Garantia de tipo booleano para os campos obrigatórios do relatório de instalação
        compliesWithNBR17019: typeof service.reportData?.compliesWithNBR17019 === "boolean"
          ? service.reportData.compliesWithNBR17019
          : String(service.reportData?.compliesWithNBR17019).toLowerCase() === "sim",
        homologatedInstallation: typeof service.reportData?.homologatedInstallation === "boolean"
          ? service.reportData.homologatedInstallation
          : String(service.reportData?.homologatedInstallation).toLowerCase() === "sim",
        requiredAdjustment: typeof service.reportData?.requiredAdjustment === "boolean"
          ? service.reportData.requiredAdjustment
          : String(service.reportData?.requiredAdjustment).toLowerCase() === "sim",
        validWarranty: typeof service.reportData?.validWarranty === "boolean"
          ? service.reportData.validWarranty
          : String(service.reportData?.validWarranty).toLowerCase() === "sim",
        servicePhase: getServicePhase(service.serviceType), // fix: assign as literal union
        client: service.reportData?.client || service.client || "Não informado",
        address: service.reportData?.address || service.address || "Não informado",
        city: service.reportData?.city || service.city || "Não informado",
        // Fallback para assinatura
        clientSignature: service.reportData?.clientSignature || "",
      },
      technician: service.technician || {
        id: "0",
        name: "Não atribuído",
        avatar: "",
        role: "tecnico",
        signature: "",
        email: "",
        phone: "",
      },
      photos: Array.isArray(service.photos) ? service.photos : [],
      photoTitles: Array.isArray(service.photoTitles)
        ? service.photoTitles
        : [],
    };

    try {
      console.log("Dados enviados para generatePDF:", safeService);
      const ok = generatePDF(safeService);
      if (!ok) {
        toast.error(
          "Erro ao gerar o relatório detalhado. Verifique se todos os campos obrigatórios estão preenchidos."
        );
      } else {
        toast.success("Relatório detalhado gerado com sucesso");
      }
    } catch (error) {
      // Adiciona log detalhado para debug
      console.error(
        "Erro inesperado ao gerar relatório detalhado:",
        error,
        safeService
      );
      toast.error(
        "Erro inesperado ao gerar o relatório. Verifique as informações preenchidas e tente novamente."
      );
    }
  };

  const updateServiceStatus = async (newStatus: 'pendente' | 'concluido' | 'cancelado', serviceType?: 'Vistoria' | 'Instalação') => {
    if (!service || !id) return;
    
    setStatusUpdating(true);
    
    try {
      const updatedService = await updateService({ 
        id,
        status: newStatus,
        serviceType: serviceType || service.serviceType
      });
      
      setService(updatedService);
      
      toast.success(`Status da demanda atualizado para ${newStatus}`);
      
      // If transitioning from inspection to installation
      if (service.serviceType === 'Vistoria' && serviceType === 'Instalação') {
        toast.info('Demanda convertida de Vistoria para Instalação');
        setActiveTab('report');
      }
      
      // If completing the service
      if (newStatus === 'concluido') {
        setActiveTab('feedback');
      }
    } catch (error) {
      console.error('Error updating service status:', error);
      toast.error('Erro ao atualizar status da demanda');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Função que salva detalhes da demanda
  const handleSaveServiceDetails = async (data: any) => {
    if (!service || !id) return;

    setDetailsSaving(true);
    try {
      // Mescla dados editados com existentes para não sobrescrever campos não exibidos
      const updatedService = await updateService({
        id,
        ...service,
        ...data,
      });
      setService(updatedService);
      toast.success('Detalhes da demanda salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar detalhes:', error);
      toast.error('Erro ao salvar detalhes da demanda');
    } finally {
      setDetailsSaving(false);
    }
  };

  // Nova forma de update otimista do reportData local, passado para hook.
  const updateLocalReportData = (mergedReportData: any) => {
    if (!service) return;
    setService({ ...service, reportData: mergedReportData });
  };

  // Usa hook para lidar com saving e submit do relatório.
  const { saving, handleSaveReportData } = useReportData(service, id, updateLocalReportData);

  const handleAddMessage = async () => {
    if (!service || !id || !newMessage.trim()) return;
    
    try {
      // Just a mock user for now - in a real app this would come from authentication
      const newMessageData = {
        senderId: "user-1",
        senderName: "Usuário Atual",
        senderRole: "administrador",
        message: newMessage
      };
      
      const updatedService = await addServiceMessage(id, newMessageData);
      setService(updatedService);
      setNewMessage("");
      toast.success('Mensagem enviada');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleAddPhoto = async (file: File, title: string): Promise<string> => {
    if (!service || !id) {
      toast.error('Não foi possível adicionar a foto');
      return "";
    }
    
    // In a real app, this would upload to a server
    // For now, we'll create a local data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const newPhotos = [...(service.photos || []), reader.result as string];
          const newPhotoTitles = [...(service.photoTitles || []), title];
          
          const updatedService = await updateService({
            id,
            photos: newPhotos,
            photoTitles: newPhotoTitles
          });
          
          setService(updatedService);
          resolve(reader.result as string);
          toast.success('Foto adicionada com sucesso');
        } catch (error) {
          reject(error);
          toast.error('Erro ao adicionar foto');
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleRemovePhoto = async (index: number): Promise<void> => {
    if (!service || !id) return;
    
    try {
      const newPhotos = [...(service.photos || [])];
      const newPhotoTitles = [...(service.photoTitles || [])];
      
      newPhotos.splice(index, 1);
      newPhotoTitles.splice(index, 1);
      
      const updatedService = await updateService({
        id,
        photos: newPhotos,
        photoTitles: newPhotoTitles
      });
      
      setService(updatedService);
      toast.success('Foto removida com sucesso');
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error('Erro ao remover foto');
    }
  };

  const handleUpdatePhotoTitle = async (index: number, title: string): Promise<void> => {
    if (!service || !id) return;
    
    try {
      const newPhotoTitles = [...(service.photoTitles || [])];
      newPhotoTitles[index] = title;
      
      const updatedService = await updateService({
        id,
        photoTitles: newPhotoTitles
      });
      
      setService(updatedService);
      toast.success('Título da foto atualizado');
    } catch (error) {
      console.error('Error updating photo title:', error);
      toast.error('Erro ao atualizar título da foto');
    }
  };

  const handleSaveSignature = async (role: 'client' | 'technician', signatureData: string) => {
    if (!service || !id) return;
    
    try {
      if (role === 'client') {
        const updatedReportData = {
          ...service.reportData,
          clientSignature: signatureData
        };
        
        const updatedService = await updateService({
          id,
          reportData: updatedReportData
        });
        
        setService(updatedService);
      } else {
        // In a real app, updating the technician signature would be done differently
        // For now, we'll just add it to the service
        const updatedService = await updateService({
          id,
          technician: {
            ...service.technician,
            signature: signatureData
          }
        });
        
        setService(updatedService);
      }
      
      toast.success(`Assinatura ${role === 'client' ? 'do cliente' : 'do técnico'} salva com sucesso`);
    } catch (error) {
      console.error('Error saving signature:', error);
      toast.error(`Erro ao salvar assinatura ${role === 'client' ? 'do cliente' : 'do técnico'}`);
    }
  };

  // Função que salva feedback (estrutura semelhante)
  const handleSubmitFeedback = async (data: any) => {
    if (!service || !id) return;
    try {
      const feedbackData: ServiceFeedback = {
        clientRating: parseInt(data.clientRating),
        clientComment: data.clientComment,
        technicianFeedback: data.technicianFeedback
      };
      const updatedService = await updateService({
        id,
        feedback: feedbackData,
      });
      setService(updatedService);
      toast.success('Feedback salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      toast.error('Erro ao enviar feedback');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <span className="ml-3 text-lg">Carregando detalhes...</span>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Demanda não encontrada</h2>
          <p className="mb-6 text-gray-600">Não foi possível encontrar os detalhes da demanda solicitada.</p>
          <Button onClick={() => navigate('/demandas')}>Voltar para lista de demandas</Button>
        </div>
      </div>
    );
  }

  // Garante que sempre temos um technician válido, do mock (da camada de dados) ou adaptável
  const safeTechnician = service?.technician ?? {
    id: "0",
    name: "Não atribuído",
    avatar: "",
    role: "tecnico",
    signature: "",
    email: "",
    phone: ""
  };

  const photosWithTitles = (service.photos || []).map((url, index) => ({
    url,
    title: (service.photoTitles && service.photoTitles[index]) || `Foto ${index + 1}`
  }));

  // HANDLERS para assinatura - aceitar apenas 1 argumento
  // (garante que são passados corretamente para filhos que esperam só 1 argumento)
  const handleClientSignature = (signature: string) => {
    handleSaveSignature('client', signature);
  };
  const handleTechnicianSignature = (signature: string) => {
    handleSaveSignature('technician', signature);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {service.serviceType === 'Instalação' ? 'Instalação' : 'Vistoria'}: {service.title}
            </h1>
            <div className="flex items-center mt-1 text-sm text-muted-foreground">
              <Badge 
                className={`mr-2 ${
                  service.status === 'concluido' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : service.status === 'cancelado'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}
              >
                {service.status === 'concluido' 
                  ? 'Concluído' 
                  : service.status === 'cancelado' 
                  ? 'Cancelado' 
                  : 'Pendente'}
              </Badge>
              {service.date && (
                <span>
                  Criado em: {format(new Date(service.date), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExportReport('excel')}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExportReport('pdf')}
          >
            <FilePenLine className="h-4 w-4 mr-2" />
            PDF
          </Button>

          <Button 
            variant="default" 
            size="sm" 
            onClick={handleGenerateDetailedReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Relatório Detalhado
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="report">Dados do Relatório</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <DetailsFormSection
                service={service}
                saving={detailsSaving} // <-- Corrigido: agora existe o detailsSaving!
                statusUpdating={statusUpdating}
                onSubmit={handleSaveServiceDetails}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <ServiceFlowSection
                service={service}
                statusUpdating={statusUpdating}
                onConvertToInstallation={() => updateServiceStatus('pendente', 'Instalação')}
                onFinalize={() => updateServiceStatus('concluido')}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <PhotosSection
                photos={photosWithTitles}
                onAddPhoto={handleAddPhoto}
                onRemovePhoto={handleRemovePhoto}
                onUpdateTitle={handleUpdatePhotoTitle}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="mt-4 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">
                Dados para o Relatório de {service.serviceType === 'Instalação' ? 'Instalação' : 'Vistoria'}
              </h3>
              
              <Form {...reportForm}>
                {/* handleSubmit espera só um argumento: a função de submit */}
                <form className="space-y-6" onSubmit={reportForm.handleSubmit(handleSaveReportData)}>
                  {service.serviceType === 'Vistoria' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={reportForm.control}
                        name="inspectionDate"
                        defaultValue={service.reportData?.inspectionDate || ""}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data da Vistoria</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={reportForm.control}
                        name="voltage"
                        defaultValue={service.reportData?.voltage || ""}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tensão do Local</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ex: 220V" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={reportForm.control}
                        name="supplyType"
                        defaultValue={service.reportData?.supplyType || ""}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Alimentação</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ex: Monofásico, Bifásico, Trifásico" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={reportForm.control}
                        name="installationDistance"
                        defaultValue={service.reportData?.installationDistance || ""}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Distância até o ponto (metros)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" step="0.1" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={reportForm.control}
                        name="wallboxBrand"
                        defaultValue={service.reportData?.wallboxBrand || ""}
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
                        control={reportForm.control}
                        name="wallboxPower"
                        defaultValue={service.reportData?.wallboxPower || ""}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Potência do Wallbox</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ex: 7,4kW" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={reportForm.control}
                        name="groundingSystem"
                        defaultValue={service.reportData?.groundingSystem || ""}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sistema de Aterramento</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={reportForm.control}
                        name="artNumber"
                        defaultValue={service.reportData?.artNumber || ""}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número da ART</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <div className="col-span-1 md:col-span-2">
                        <FormField
                          control={reportForm.control}
                          name="installationObstacles"
                          defaultValue={service.reportData?.installationObstacles || ""}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Obstáculos no percurso</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={3} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={reportForm.control}
                        name="installationDate"
                        defaultValue={service.reportData?.installationDate || ""}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data da Instalação</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={reportForm.control}
                        name="modelNumber"
                        defaultValue={service.reportData?.modelNumber || ""}
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
                        control={reportForm.control}
                        name="serialNumberNew"
                        defaultValue={service.reportData?.serialNumberNew || ""}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de Série</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={reportForm.control}
                        name="chargerLoad"
                        defaultValue={service.reportData?.chargerLoad || ""}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Potência do Carregador</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={reportForm.control}
                        name="cableGauge"
                        defaultValue={service.reportData?.cableGauge || ""}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bitola do Cabo</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={reportForm.control}
                        name="chargerCircuitBreaker"
                        defaultValue={service.reportData?.chargerCircuitBreaker || ""}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Disjuntor do Carregador</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={reportForm.control}
                        name="compliesWithNBR17019"
                        defaultValue={service.reportData?.compliesWithNBR17019 || ""}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instalação atende NBR17019</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="sim">Sim</SelectItem>
                                <SelectItem value="nao">Não</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={reportForm.control}
                        name="homologatedInstallation"
                        defaultValue={service.reportData?.homologatedInstallation || ""}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instalação Homologada</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="sim">Sim</SelectItem>
                                <SelectItem value="nao">Não</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  <div className="col-span-1 md:col-span-2 pt-4">
                    <FormField
                      control={reportForm.control}
                      name="technicalComments"
                      defaultValue={service.reportData?.technicalComments || ""}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comentários Técnicos</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* --- ASSINATURAS AGORA ESTÃO NO COMPONENTE DEDICADO --- */}
                  <ServiceSignatureSection
                    clientSignature={service.reportData?.clientSignature}
                    technicianSignature={safeTechnician.signature || ""}
                    clientName={service.reportData?.clientName || service.client || ""}
                    technicianName={safeTechnician.name}
                    onClientSignature={handleClientSignature}
                    onTechnicianSignature={handleTechnicianSignature}
                  />
                  {/* ----------------------------------------------- */}
                  
                  <div className="flex justify-end gap-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Salvando..." : "Salvar Dados do Relatório"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="chat" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <ChatSection
                // Ensure every message has a timestamp string (empty string as fallback)
                messages={(service.messages || []).map((msg) => ({
                  ...msg,
                  timestamp: msg.timestamp ?? "",
                }))}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                onSend={handleAddMessage}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="feedback" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <FeedbackSection
                service={service}
                feedbackForm={feedbackForm}
                statusUpdating={statusUpdating}
                onFinalize={() => updateServiceStatus('concluido')}
                onSubmit={handleSubmitFeedback}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceDetail;
