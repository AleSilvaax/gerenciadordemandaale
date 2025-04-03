
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  CheckCircle,
  Calendar,
  Camera,
  Download,
  ArrowLeft,
  Edit,
  User,
  MapPin,
  ClipboardCheck,
  X,
  MessageCircle,
  Send,
  Star,
  StarHalf,
  Clock,
  FileSpreadsheet,
  FilePdf
} from "lucide-react";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { Separator } from "@/components/ui/separator";
import { SignatureCapture } from "@/components/ui-custom/SignatureCapture";
import { PhotoUploader } from "@/components/ui-custom/PhotoUploader";
import { getService, updateService, addServiceMessage, addServiceFeedback } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { downloadPDF, downloadInspectionPDF, downloadInstallationPDF } from "@/utils/pdfGenerator";
import { Service, ServiceMessage } from "@/types/serviceTypes";
import { CustomFieldRenderer } from "@/components/ui-custom/CustomFieldRenderer";
import { useIsMobile } from "@/hooks/use-mobile";

interface ServiceDetailProps {
  editMode?: boolean;
}

const ServiceDetail: React.FC<ServiceDetailProps> = ({ editMode = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [clientSignature, setClientSignature] = useState<string | null>(null);
  const [technicianSignature, setTechnicianSignature] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [clientRating, setClientRating] = useState(0);
  const [clientFeedback, setClientFeedback] = useState("");
  const [technicianFeedback, setTechnicianFeedback] = useState("");
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;
      
      try {
        const fetchedService = await getService(id);
        setService(fetchedService);
        
        // Initialize signatures if they exist
        if (fetchedService.reportData?.clientSignature) {
          setClientSignature(fetchedService.reportData.clientSignature);
        }
        
        if (fetchedService.technician?.signature) {
          setTechnicianSignature(fetchedService.technician.signature);
        }
        
        // Initialize client name and feedback
        if (fetchedService.reportData?.clientName) {
          setClientName(fetchedService.reportData.clientName);
        }
        
        if (fetchedService.feedback) {
          setClientRating(fetchedService.feedback.clientRating || 0);
          setClientFeedback(fetchedService.feedback.clientComment || "");
          setTechnicianFeedback(fetchedService.feedback.technicianFeedback || "");
        }
      } catch (error) {
        console.error("Error fetching service:", error);
        toast({
          title: "Erro ao carregar a demanda",
          description: "Não foi possível carregar os detalhes desta demanda.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id]);

  const handleStatusChange = async (newStatus: "pendente" | "concluido" | "cancelado") => {
    if (!service) return;
    
    try {
      let updatedService = { ...service, status: newStatus };
      
      // If moving from inspection to installation
      if (service.serviceType === 'inspection' && newStatus === 'concluido') {
        updatedService = {
          ...updatedService,
          serviceType: 'installation',
          title: service.title.replace('Vistoria', 'Instalação'),
          status: 'pendente' // Reset to pending for the installation phase
        };
      }
      
      const result = await updateService(updatedService);
      setService(result);
      
      let statusMessage = newStatus === "pendente" ? "pendente" :
                         newStatus === "concluido" ? "concluído" : "cancelado";
      
      toast({
        title: "Status atualizado",
        description: `O status da demanda foi alterado para ${statusMessage}.`,
      });
      
      // If service type changed, show additional message
      if (updatedService.serviceType !== service.serviceType) {
        toast({
          title: "Serviço atualizado",
          description: "A vistoria foi concluída e o fluxo avançou para a fase de instalação.",
        });
      }
    } catch (error) {
      console.error("Error updating service status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status da demanda.",
        variant: "destructive"
      });
    }
  };

  const saveSignatures = async () => {
    if (!service) return;
    
    try {
      // Update reportData with clientSignature and clientName
      const updatedReportData = {
        ...service.reportData,
        clientSignature,
        clientName
      };
      
      // Update the technician's signature and the reportData
      const updatedService = {
        ...service,
        technician: {
          ...service.technician,
          signature: technicianSignature
        },
        reportData: updatedReportData
      };
      
      const result = await updateService(updatedService);
      setService(result);
      
      toast({
        title: "Assinaturas salvas",
        description: "As assinaturas foram salvas com sucesso."
      });
    } catch (error) {
      console.error("Error saving signatures:", error);
      toast({
        title: "Erro ao salvar assinaturas",
        description: "Não foi possível salvar as assinaturas.",
        variant: "destructive"
      });
    }
  };

  const handleClientSignatureChange = (dataUrl: string) => {
    setClientSignature(dataUrl);
  };

  const handleTechnicianSignatureChange = (dataUrl: string) => {
    setTechnicianSignature(dataUrl);
  };

  const handleAddPhoto = async (file: File, title: string) => {
    if (!service) return "";
    
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (!event.target?.result) {
          reject("Failed to read file");
          return;
        }
        
        const photoUrl = event.target.result as string;
        
        try {
          // Create updated photos and photoTitles arrays
          const updatedPhotos = [...(service.photos || []), photoUrl];
          const updatedPhotoTitles = [...(service.photoTitles || []), title];
          
          // Update the service
          const updatedService = {
            ...service,
            photos: updatedPhotos,
            photoTitles: updatedPhotoTitles
          };
          
          const result = await updateService(updatedService);
          setService(result);
          
          toast({
            title: "Foto adicionada",
            description: "A foto foi adicionada com sucesso."
          });
          
          resolve(photoUrl);
        } catch (error) {
          console.error("Error adding photo:", error);
          reject("Failed to add photo");
        }
      };
      
      reader.onerror = () => {
        reject("Failed to read file");
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = async (index: number) => {
    if (!service) return;
    
    try {
      // Create updated photos and photoTitles arrays
      const updatedPhotos = [...(service.photos || [])];
      const updatedPhotoTitles = [...(service.photoTitles || [])];
      
      // Remove the photo and its title at the specified index
      updatedPhotos.splice(index, 1);
      updatedPhotoTitles.splice(index, 1);
      
      // Update the service
      const updatedService = {
        ...service,
        photos: updatedPhotos,
        photoTitles: updatedPhotoTitles
      };
      
      const result = await updateService(updatedService);
      setService(result);
      
      toast({
        title: "Foto removida",
        description: "A foto foi removida com sucesso."
      });
    } catch (error) {
      console.error("Error removing photo:", error);
      toast({
        title: "Erro ao remover foto",
        description: "Não foi possível remover a foto.",
        variant: "destructive"
      });
    }
  };

  const handleUpdatePhotoTitle = async (index: number, newTitle: string) => {
    if (!service) return;
    
    try {
      // Create updated photoTitles array
      const updatedPhotoTitles = [...(service.photoTitles || [])];
      
      // Update the title at the specified index
      updatedPhotoTitles[index] = newTitle;
      
      // Update the service
      const updatedService = {
        ...service,
        photoTitles: updatedPhotoTitles
      };
      
      const result = await updateService(updatedService);
      setService(result);
      
      toast({
        title: "Título atualizado",
        description: "O título da foto foi atualizado com sucesso."
      });
    } catch (error) {
      console.error("Error updating photo title:", error);
      toast({
        title: "Erro ao atualizar título",
        description: "Não foi possível atualizar o título da foto.",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!service || !newMessage.trim()) return;
    
    try {
      // Simulating current user as a technician
      const messageData = {
        senderId: service.technician.id,
        senderName: service.technician.name,
        senderRole: service.technician.role || "tecnico",
        message: newMessage
      };
      
      const updatedService = await addServiceMessage(service.id, messageData);
      setService(updatedService);
      setNewMessage("");
      
      toast({
        title: "Mensagem enviada",
        description: "Sua mensagem foi enviada com sucesso."
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive"
      });
    }
  };

  const handleSaveFeedback = async () => {
    if (!service) return;
    
    try {
      const feedbackData = {
        clientRating,
        clientComment: clientFeedback,
        technicianFeedback
      };
      
      const updatedService = await addServiceFeedback(service.id, feedbackData);
      setService(updatedService);
      
      toast({
        title: "Feedback salvo",
        description: "Os feedbacks foram salvos com sucesso."
      });
    } catch (error) {
      console.error("Error saving feedback:", error);
      toast({
        title: "Erro ao salvar feedback",
        description: "Não foi possível salvar os feedbacks.",
        variant: "destructive"
      });
    }
  };

  const handleExportReport = (format: 'pdf' | 'excel') => {
    if (!service) return;
    
    if (format === 'pdf') {
      downloadPDF(service);
      toast({
        title: "Relatório exportado",
        description: "O relatório em PDF foi gerado com sucesso."
      });
    } else {
      // Placeholder for Excel export
      toast({
        title: "Exportação em Excel",
        description: "A exportação em Excel será implementada em breve."
      });
    }
  };

  if (loading) {
    return (
      <div className="container py-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-4">Demanda não encontrada</h1>
        <p className="mb-4">A demanda solicitada não foi encontrada.</p>
        <Button onClick={() => navigate("/demandas")}>Voltar para Demandas</Button>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não especificado";
    
    try {
      return new Date(dateString).toLocaleDateString("pt-BR", {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const photos = service.photos || [];
  const photoDetails = photos.map((url, index) => ({
    url,
    title: service.photoTitles?.[index] || `Foto ${index + 1}`
  }));

  const renderStarRating = (value: number, onChange?: (value: number) => void) => {
    const stars = [];
    const isEditable = !!onChange;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= value) {
        stars.push(
          <button 
            key={i}
            onClick={() => onChange && onChange(i)}
            disabled={!isEditable}
            className={`text-yellow-500 ${isEditable ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <Star className="h-6 w-6 fill-yellow-500" />
          </button>
        );
      } else if (i - 0.5 <= value) {
        stars.push(
          <button 
            key={i}
            onClick={() => onChange && onChange(i)}
            disabled={!isEditable}
            className={`text-yellow-500 ${isEditable ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <StarHalf className="h-6 w-6 fill-yellow-500" />
          </button>
        );
      } else {
        stars.push(
          <button 
            key={i}
            onClick={() => onChange && onChange(i)}
            disabled={!isEditable}
            className={`text-muted-foreground ${isEditable ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <Star className="h-6 w-6" />
          </button>
        );
      }
    }
    
    return <div className="flex">{stars}</div>;
  };

  return (
    <div className={`container py-4 space-y-6 ${isMobile ? 'pb-28' : 'pb-8'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Detalhes da Demanda</h1>
        </div>
        
        <div className="flex space-x-2">
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
            <FilePdf className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold">{service.title}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <StatusBadge status={service.status} />
                    <span className="text-sm text-muted-foreground">ID: {service.id}</span>
                    {service.serviceType && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        service.serviceType === 'inspection' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {service.serviceType === 'inspection' ? 'Vistoria' : 'Instalação'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/demandas/${service.id}/edit`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-start md:items-center text-sm flex-col md:flex-row">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Data da demanda:</span>
                    </div>
                    <span className="ml-0 md:ml-2">{formatDate(service.date)}</span>
                  </div>
                  
                  <div className="flex items-start md:items-center text-sm flex-col md:flex-row">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Data de vencimento:</span>
                    </div>
                    <span className="ml-0 md:ml-2">{formatDate(service.dueDate)}</span>
                  </div>
                  
                  <div className="flex items-start md:items-center text-sm flex-col md:flex-row">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Cliente:</span>
                    </div>
                    <span className="ml-0 md:ml-2">{service.client || "Não especificado"}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-start md:items-center text-sm flex-col md:flex-row">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Endereço:</span>
                    </div>
                    <span className="ml-0 md:ml-2">{service.address || "Não especificado"}</span>
                  </div>
                  
                  <div className="flex items-start md:items-center text-sm flex-col md:flex-row">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Cidade:</span>
                    </div>
                    <span className="ml-0 md:ml-2">{service.city || "Não especificado"}</span>
                  </div>
                  
                  <div className="flex items-start md:items-center text-sm flex-col md:flex-row">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Local:</span>
                    </div>
                    <span className="ml-0 md:ml-2">{service.location || "Não especificado"}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Notas:</h3>
                <p className="text-sm text-left">{service.notes || "Nenhuma nota adicional."}</p>
              </div>
            </CardContent>
            
            <CardFooter className="pt-0 flex-col items-start">
              <Separator className="my-4 w-full" />
              
              <div className="flex flex-wrap gap-3 w-full">
                <Button 
                  className={`${service.status === "pendente" ? "bg-green-600 hover:bg-green-700" : ""}`}
                  disabled={service.status === "concluido"}
                  onClick={() => handleStatusChange("concluido")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como Concluído
                </Button>
                
                <Button 
                  variant={service.status === "pendente" ? "outline" : "default"}
                  disabled={service.status === "pendente"}
                  onClick={() => handleStatusChange("pendente")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Marcar como Pendente
                </Button>
                
                <Button 
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  disabled={service.status === "cancelado"}
                  onClick={() => handleStatusChange("cancelado")}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar Demanda
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="details">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Detalhes</span>
                <span className="inline md:hidden">Det.</span>
              </TabsTrigger>
              <TabsTrigger value="photos">
                <Camera className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Fotos</span>
                <span className="inline md:hidden">Fotos</span>
              </TabsTrigger>
              <TabsTrigger value="chat">
                <MessageCircle className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Chat</span>
                <span className="inline md:hidden">Chat</span>
              </TabsTrigger>
              <TabsTrigger value="feedback">
                <Star className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Feedback</span>
                <span className="inline md:hidden">Feed.</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dados do Relatório</CardTitle>
                </CardHeader>
                <CardContent>
                  {service.reportData ? (
                    <div className="space-y-6">
                      {/* Render custom fields if any */}
                      {service.reportData.customFields && service.reportData.customFields.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg">Campos Personalizados</h3>
                          <CustomFieldRenderer fields={service.reportData.customFields} disabled={true} />
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button 
                          variant="outline" 
                          className="w-full sm:w-auto"
                          onClick={() => downloadInspectionPDF(service)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Relatório de Vistoria
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full sm:w-auto"
                          onClick={() => downloadInstallationPDF(service)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Relatório de Instalação
                        </Button>
                        
                        <Button 
                          className="w-full sm:w-auto"
                          onClick={() => downloadPDF(service)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Relatório Completo
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">Nenhum dado de relatório disponível.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="photos" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fotos do Serviço</CardTitle>
                </CardHeader>
                <CardContent>
                  <PhotoUploader
                    photos={photoDetails}
                    onAddPhoto={handleAddPhoto}
                    onRemovePhoto={handleRemovePhoto}
                    onUpdateTitle={handleUpdatePhotoTitle}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="chat" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Chat da Demanda</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col h-[300px]">
                    <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-2">
                      {service.messages && service.messages.length > 0 ? (
                        service.messages.map((message: ServiceMessage) => (
                          <div 
                            key={message.id} 
                            className={`flex ${message.senderId === service.technician.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-[80%] rounded-lg p-3 ${
                                message.senderId === service.technician.id 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-secondary'
                              }`}
                            >
                              <div className="text-xs font-medium mb-1">{message.senderName} ({message.senderRole})</div>
                              <div>{message.message}</div>
                              <div className="text-right text-xs mt-1">
                                {new Date(message.timestamp).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">Nenhuma mensagem enviada ainda.</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Digite sua mensagem..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="feedback" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Feedback e Avaliação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Avaliação do Cliente</h3>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-sm">Nota:</label>
                        {renderStarRating(clientRating, setClientRating)}
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-sm">Comentário:</label>
                        <Textarea 
                          placeholder="Digite o comentário do cliente..."
                          value={clientFeedback}
                          onChange={(e) => setClientFeedback(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Feedback do Técnico</h3>
                    <div className="space-y-1">
                      <Textarea 
                        placeholder="Digite feedback, sugestões ou melhorias..."
                        value={technicianFeedback}
                        onChange={(e) => setTechnicianFeedback(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button className="w-full" onClick={handleSaveFeedback}>
                    Salvar Feedback
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="lg:w-1/3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Técnico Responsável</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TeamMemberAvatar
                  src={service.technician.avatar}
                  name={service.technician.name}
                  size="lg"
                  className="mr-4"
                />
                <div>
                  <h3 className="font-semibold">{service.technician.name}</h3>
                  <p className="text-sm text-muted-foreground">{service.technician.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assinaturas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="clientName" className="text-sm font-medium">
                  Nome do Cliente
                </label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Digite o nome do cliente"
                />
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Assinatura do Cliente</h3>
                <SignatureCapture
                  onSave={handleClientSignatureChange}
                  onChange={handleClientSignatureChange}
                  initialValue={clientSignature || ''}
                  height={150}
                />
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Assinatura do Técnico</h3>
                <SignatureCapture
                  onSave={handleTechnicianSignatureChange}
                  onChange={handleTechnicianSignatureChange}
                  initialValue={technicianSignature || ''}
                  height={150}
                />
              </div>
              
              <Button className="w-full" onClick={saveSignatures}>
                Salvar Assinaturas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
