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
    if (!service) return;
    
    try {
      generatePDF(service);
      toast.success('Relatório detalhado gerado com sucesso');
    } catch (error) {
      console.error('Error generating detailed report:', error);
      toast.error('Erro ao gerar relatório detalhado');
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

    setSaving(true);
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
      setSaving(false);
    }
  };

  // Função que salva dados do relatório
  const handleSaveReportData = async (data: any) => {
    if (!service || !id) return;
    setSaving(true);
    try {
      // Atualiza os dados aninhados dentro de reportData
      const mergedReportData = {
        ...service.reportData,
        ...data,
      };
      const updatedService = await updateService({
        id,
        reportData: mergedReportData,
      });
      setService(updatedService);
      toast.success('Dados do relatório salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
      toast.error('Erro ao salvar dados do relatório');
    } finally {
      setSaving(false);
    }
  };

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

  // Handler refinados para assinatura (garantem só 1 argumento!)
  const handleClientSignature = (signature: string) => handleSaveSignature('client', signature);
  const handleTechnicianSignature = (signature: string) => handleSaveSignature('technician', signature);

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
              <Form {...detailsForm}>
                <form className="space-y-4" onSubmit={detailsForm.handleSubmit(handleSaveServiceDetails)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={detailsForm.control}
                      name="title"
                      defaultValue={service.title}
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
                      control={detailsForm.control}
                      name="status"
                      defaultValue={service.status}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={statusUpdating}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um status" />
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
                      control={detailsForm.control}
                      name="serviceType"
                      defaultValue={service.serviceType || "inspection"}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Serviço</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um tipo" />
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
                      control={detailsForm.control}
                      name="client"
                      defaultValue={service.client || ""}
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
                      control={detailsForm.control}
                      name="location"
                      defaultValue={service.location}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Localidade</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={detailsForm.control}
                      name="address"
                      defaultValue={service.address || ""}
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
                      control={detailsForm.control}
                      name="city"
                      defaultValue={service.city || ""}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="col-span-1 md:col-span-2">
                      <FormField
                        control={detailsForm.control}
                        name="description"
                        defaultValue={service.description || ""}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field}
                                rows={3}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-1 md:col-span-2">
                      <FormField
                        control={detailsForm.control}
                        name="notes"
                        defaultValue={service.notes || ""}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notas Adicionais</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                rows={3} 
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-6">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Fluxo da Demanda</h3>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Status atual: <span className="font-semibold">
                      {service.status === 'concluido' 
                        ? 'Concluído' 
                        : service.status === 'cancelado' 
                        ? 'Cancelado' 
                        : 'Pendente'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Tipo de serviço: <span className="font-semibold">
                      {service.serviceType === 'Instalação' ? 'Instalação' : 'Vistoria'}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {service.serviceType === 'Vistoria' && service.status === 'pendente' && (
                    <Button 
                      onClick={() => updateServiceStatus('pendente', 'Instalação')}
                      disabled={statusUpdating}
                      variant="outline"
                    >
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Converter para Instalação
                    </Button>
                  )}
                  
                  {service.status === 'pendente' && (
                    <Button 
                      onClick={() => updateServiceStatus('concluido')}
                      disabled={statusUpdating}
                      variant="default"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Finalizar Demanda
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Anexos e Fotos</h3>
              
              <ServicePhotosSection
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
                        defaultValue={service.reportData?.compliesWithNBR17019 ? "sim" : "nao"}
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
                        defaultValue={service.reportData?.homologatedInstallation ? "sim" : "nao"}
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
                  
                  <div className="pt-4">
                    <h4 className="font-medium mb-4">Assinaturas</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="text-sm font-medium mb-2">Assinatura do Cliente</h5>
                        <FormField
                          control={reportForm.control}
                          name="clientName"
                          defaultValue={service.reportData?.clientName || service.client || ""}
                          render={({ field }) => (
                            <FormItem className="mb-4">
                              <FormLabel>Nome do Cliente</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-800">
                          <SignatureCapture
                            initialSignature={service.reportData?.clientSignature}
                            onChange={handleClientSignature}
                            label="Assinatura do Cliente"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-2">Assinatura do Técnico</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Técnico: {safeTechnician.name}
                        </p>
                        
                        <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-800">
                          <SignatureCapture
                            initialSignature={safeTechnician.signature || ""}
                            onChange={handleTechnicianSignature}
                            label="Assinatura do Técnico"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
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
              <h3 className="text-lg font-medium mb-4">Chat da Demanda</h3>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 h-96 overflow-y-auto mb-4">
                {service.messages && service.messages.length > 0 ? (
                  <div className="space-y-4">
                    {service.messages.map((msg, index) => (
                      <div key={index} className={`flex ${msg.senderId === 'user-1' ? 'justify-end' : 'justify-start'}`}>
                        <div 
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.senderId === 'user-1'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-100'
                          }`}
                        >
                          <div className="flex items-center mb-1">
                            <span className="font-medium text-sm">{msg.senderName}</span>
                            <span className="text-xs ml-2 opacity-75">
                              {msg.timestamp && format(new Date(msg.timestamp), 'dd/MM/yyyy HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messageEndRef} />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
                    <p>Nenhuma mensagem ainda...</p>
                    <p className="text-sm">Inicie a conversa abaixo!</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMessage()}
                />
                <Button onClick={handleAddMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="feedback" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Feedback e Avaliação</h3>
              
              {service.status !== 'concluido' ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    O feedback estará disponível quando a demanda for concluída.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => updateServiceStatus('concluido')}
                    className="mt-4"
                    disabled={statusUpdating}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Finalizar Demanda
                  </Button>
                </div>
              ) : service.feedback ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Avaliação do Cliente</h4>
                    <div className="flex items-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-6 w-6 ${
                            star <= (service.feedback?.clientRating || 0)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 font-medium">
                        {service.feedback.clientRating}/5
                      </span>
                    </div>
                    {service.feedback.clientComment && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-2">
                        <p className="text-sm">{service.feedback.clientComment}</p>
                      </div>
                    )}
                  </div>
                  
                  {service.feedback.technicianFeedback && (
                    <div>
                      <h4 className="font-medium mb-3">Feedback do Técnico</h4>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <p className="text-sm">{service.feedback.technicianFeedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Form {...feedbackForm}>
                  <form className="space-y-4" onSubmit={feedbackForm.handleSubmit(handleSubmitFeedback)}>
                    <FormField
                      control={feedbackForm.control}
                      name="clientRating"
                      defaultValue="5"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avaliação do Cliente (1-5 estrelas)</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma nota" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">★ - Muito Insatisfeito</SelectItem>
                              <SelectItem value="2">★★ - Insatisfeito</SelectItem>
                              <SelectItem value="3">★★★ - Neutro</SelectItem>
                              <SelectItem value="4">★★★★ - Satisfeito</SelectItem>
                              <SelectItem value="5">★★★★★ - Muito Satisfeito</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={feedbackForm.control}
                      name="clientComment"
                      defaultValue=""
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comentário do Cliente</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} placeholder="Comentários sobre o serviço..." />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={feedbackForm.control}
                      name="technicianFeedback"
                      defaultValue=""
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Feedback do Técnico</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={3} 
                              placeholder="Observações do técnico sobre o serviço..."
                            />
                          </FormControl>
                          <FormDescription>
                            Informações técnicas, dificuldades encontradas ou sugestões de melhoria.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button type="submit">Salvar Feedback</Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceDetail;
