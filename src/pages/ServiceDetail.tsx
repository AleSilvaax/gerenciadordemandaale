import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getServices,
  updateService,
  addServiceMessage,
} from "@/services/servicesDataService";
import { Service, ServiceMessage, ServiceFeedback, CustomField } from "@/types/serviceTypes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft, Calendar, MapPin, User, FileText, MessageSquare, Star, Edit, CheckCircle, XCircle, Clock, Camera, Trash2, Edit3 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rating } from "@/components/ui-custom/Rating";
import { TechnicianAssigner } from "@/components/ui-custom/TechnicianAssigner";
import { ServiceSignatureSection } from "@/components/ui-custom/ServiceSignatureSection";
import { TechnicalFieldsManager } from "@/components/ui-custom/TechnicalFieldsManager";
import { CustomFieldRenderer } from "@/components/ui-custom/CustomFieldRenderer";
import { PhotoUploader } from "@/components/ui-custom/PhotoUploader";
import { generateDetailedServiceReport } from "@/utils/detailedReportGenerator";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ServiceDetailProps {
  editMode?: boolean;
}

const ServiceDetail: React.FC<ServiceDetailProps> = ({ editMode = false }) => {
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [feedback, setFeedback] = useState<ServiceFeedback>({ clientRating: 5 });
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);
  const [editingPhotoTitle, setEditingPhotoTitle] = useState("");
  const [photos, setPhotos] = useState<any[]>([]);
  const { id } = useParams<{ id?: string }>();
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchService(id);
    }
  }, [id]);

  useEffect(() => {
    if (service) {
      // Converter fotos do serviço para o formato do PhotoUploader
      const uploaderPhotos = (service.photos || []).map((photoUrl, index) => ({
        id: `service-photo-${index}`,
        file: new File([], service.photoTitles?.[index] || `photo-${index}`, { type: 'image/jpeg' }),
        url: photoUrl,
        title: service.photoTitles?.[index] || `Foto ${index + 1}`,
        compressed: false
      }));
      setPhotos(uploaderPhotos);
    }
  }, [service]);

  const fetchService = async (serviceId: string) => {
    setIsLoading(true);
    try {
      console.log("Buscando serviço:", serviceId);
      const allServices = await getServices();
      const found = allServices.find(s => s.id === serviceId);
      if (found) {
        console.log("Serviço encontrado:", found);
        setService(found);
        if (found.feedback) {
          setFeedback(found.feedback);
        }
      } else {
        console.log("Serviço não encontrado");
        setService(null);
      }
    } catch (error) {
      console.error("Erro ao carregar serviço:", error);
      toast.error("Erro ao carregar detalhes do serviço");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: Service["status"]) => {
    if (!service) return;

    try {
      console.log("Atualizando status para:", newStatus);
      await updateService({ id: service.id, status: newStatus });
      toast.success("Status do serviço atualizado!");
      fetchService(id!);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar o status do serviço");
    }
  };

  const handleSendMessage = async () => {
    if (!service || !newMessage.trim() || !user) return;

    try {
      console.log("Enviando mensagem:", newMessage);
      const messageData: ServiceMessage = {
        senderId: user.id,
        senderName: user.name || "Usuário",
        senderRole: user.role || "tecnico",
        message: newMessage,
        timestamp: new Date().toISOString(),
      };
      
      await addServiceMessage(service.id, messageData);
      
      setNewMessage("");
      toast.success("Mensagem enviada!");
      fetchService(id!);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem");
    }
  };

  const handleSubmitFeedback = async () => {
    if (!service) return;

    try {
      console.log("Salvando feedback:", feedback);
      
      await updateService({ 
        id: service.id, 
        feedback: feedback 
      });
      
      toast.success("Feedback salvo com sucesso!");
      fetchService(id!);
    } catch (error) {
      console.error("Erro ao salvar feedback:", error);
      toast.error("Erro ao salvar feedback");
    }
  };

  const handleUpdateSignatures = async (signatures: { client?: string; technician?: string }) => {
    if (!service) return;

    try {
      console.log("Salvando assinaturas:", signatures);
      const updatedSignatures = {
        ...service.signatures,
        ...signatures
      };
      
      await updateService({ 
        id: service.id, 
        signatures: updatedSignatures
      });
      
      toast.success("Assinaturas salvas com sucesso!");
      fetchService(id!);
    } catch (error) {
      console.error("Erro ao salvar assinaturas:", error);
      toast.error("Erro ao salvar assinaturas");
    }
  };

  const handleGenerateReport = async () => {
    if (!service) return;
    
    try {
      console.log("Gerando relatório PDF para serviço:", service.id);
      await generateDetailedServiceReport(service);
      toast.success("Relatório PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório PDF");
    }
  };

  const handleUpdateCustomFields = async (fields: CustomField[]) => {
    if (!service) return;

    try {
      console.log("Salvando campos técnicos:", fields);
      
      await updateService({ 
        id: service.id, 
        customFields: fields
      });
      
      toast.success("Campos técnicos salvos com sucesso!");
      fetchService(id!);
    } catch (error) {
      console.error("Erro ao salvar campos técnicos:", error);
      toast.error("Erro ao salvar campos técnicos");
    }
  };

  const handlePhotosChange = async (newPhotos: any[]) => {
    if (!service) return;

    try {
      console.log("Atualizando fotos:", newPhotos);
      
      // Extrair URLs e títulos das fotos
      const photoUrls = newPhotos.map(photo => photo.url);
      const photoTitles = newPhotos.map(photo => photo.title);
      
      await updateService({ 
        id: service.id, 
        photos: photoUrls,
        photoTitles: photoTitles
      });
      
      toast.success("Fotos atualizadas com sucesso!");
      await fetchService(service.id);
    } catch (error) {
      console.error("Erro ao atualizar fotos:", error);
      toast.error("Erro ao atualizar fotos");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "concluido":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelado":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluido":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "cancelado":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold mb-4">Serviço não encontrado</h2>
          <Button onClick={() => navigate("/demandas")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar às Demandas
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <motion.div 
        className="container mx-auto p-6 pb-24 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div 
          className="flex items-center gap-4 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Link 
            to="/demandas" 
            className="h-12 w-12 rounded-xl flex items-center justify-center bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-accent hover:border-accent/50 transition-all duration-200 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Detalhes da Demanda
            </h1>
            <p className="text-muted-foreground mt-1">Visualize e gerencie os detalhes da demanda</p>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Header Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <CardTitle className="text-2xl font-bold">{service.title}</CardTitle>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{service.location}</span>
                      </div>
                      {service.number && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="w-4 h-4" />
                          <span>#{service.number}</span>
                        </div>
                      )}
                    </div>
                    <Badge className={`${getStatusColor(service.status)} border flex items-center gap-1`}>
                      {getStatusIcon(service.status)}
                      {service.status === "concluido" ? "Concluído" : 
                       service.status === "cancelado" ? "Cancelado" : "Pendente"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-background/30 rounded-lg border border-border/30">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Criação</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(service.creationDate!), "PPP", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    {service.dueDate && (
                      <div className="flex items-center gap-3 p-3 bg-background/30 rounded-lg border border-border/30">
                        <Clock className="w-5 h-5 text-orange-500" />
                        <div>
                          <p className="text-sm font-medium">Vencimento</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(service.dueDate), "PPP", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-background/30 rounded-lg border border-border/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Técnico Responsável</p>
                          <p className="text-sm text-muted-foreground">
                            {service.technician?.name ?? "Não atribuído"}
                          </p>
                        </div>
                      </div>
                      {service.technician && (
                        <TeamMemberAvatar 
                          src={service.technician.avatar || ""} 
                          name={service.technician.name} 
                          size="sm"
                        />
                      )}
                    </div>
                  </div>

                  {hasPermission("gestor") && (
                    <TechnicianAssigner
                      currentTechnicianId={service.technician?.id}
                      onAssign={async (technician) => {
                        await updateService({ id: service.id, technician });
                        toast.success("Técnico atualizado!");
                        fetchService(service.id);
                      }}
                    />
                  )}

                  {service.description && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Descrição
                      </h4>
                      <p className="text-sm text-muted-foreground p-3 bg-background/30 rounded-lg border border-border/30">
                        {service.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Technical Fields Checklist */}
            {service.serviceType && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <TechnicalFieldsManager
                  serviceType={service.serviceType}
                  currentFields={service.customFields || []}
                  onFieldsUpdate={handleUpdateCustomFields}
                  disabled={editMode}
                />
              </motion.div>
            )}

            {/* Photos Section with PhotoUploader */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Fotos e Anexos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PhotoUploader
                    photos={photos}
                    onPhotosChange={handlePhotosChange}
                    maxPhotos={10}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Action Buttons */}
            {!editMode && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-3">
                      {service.status !== "concluido" && (
                        <Button
                          onClick={() => handleStatusChange("concluido")}
                          className="bg-green-500/20 text-green-500 border border-green-500/30 hover:bg-green-500/30"
                          variant="outline"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Marcar como Concluído
                        </Button>
                      )}
                      {service.status !== "cancelado" && (
                        <Button
                          onClick={() => handleStatusChange("cancelado")}
                          className="bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30"
                          variant="outline"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancelar Demanda
                        </Button>
                      )}
                      {hasPermission("edit_services") && (
                        <Button
                          onClick={() => navigate(`/demandas/${id}/edit`)}
                          className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                          variant="outline"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar Demanda
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Right Column - Messages and Feedback */}
          <div className="space-y-6">
            {/* Enhanced Messages Section with Timestamps */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Mensagens ({service.messages?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ScrollArea className="h-[300px] pr-4">
                    {service.messages && service.messages.length > 0 ? (
                      <div className="space-y-3">
                        {service.messages.map((msg, index) => (
                          <div key={index} className="flex gap-3 p-3 bg-background/30 rounded-lg border border-border/30">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={msg.senderId} />
                              <AvatarFallback className="text-xs">
                                {msg.senderName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{msg.senderName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {msg.senderRole}
                                </Badge>
                                {msg.timestamp && (
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(msg.timestamp), "dd/MM/yy HH:mm", { locale: ptBR })}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{msg.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma mensagem ainda</p>
                      </div>
                    )}
                  </ScrollArea>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="bg-background/50"
                    />
                    <Button onClick={handleSendMessage} size="sm">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Enhanced Feedback Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {service.feedback ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Avaliação do Cliente</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Rating value={service.feedback.clientRating} />
                          <span className="text-sm text-muted-foreground">
                            ({service.feedback.clientRating}/5)
                          </span>
                        </div>
                        {service.feedback.clientComment && (
                          <div className="mt-2 p-3 bg-background/30 rounded-lg border border-border/30">
                            <p className="text-sm">{service.feedback.clientComment}</p>
                          </div>
                        )}
                      </div>
                      
                      {service.feedback.technicianFeedback && (
                        <div>
                          <Label className="text-sm font-medium">Feedback do Técnico</Label>
                          <div className="mt-1 p-3 bg-background/30 rounded-lg border border-border/30">
                            <p className="text-sm">{service.feedback.technicianFeedback}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Avaliação do Cliente</Label>
                        <Rating
                          value={feedback.clientRating}
                          onChange={(value) => setFeedback({ ...feedback, clientRating: value })}
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Comentário do Cliente</Label>
                        <Textarea
                          placeholder="Deixe seu comentário..."
                          value={feedback.clientComment || ""}
                          onChange={(e) => setFeedback({ ...feedback, clientComment: e.target.value })}
                          className="bg-background/50 resize-none"
                          rows={3}
                        />
                      </div>
                      
                      {user?.role === "tecnico" && (
                        <div>
                          <Label className="text-sm font-medium">Feedback do Técnico</Label>
                          <Textarea
                            placeholder="Deixe seu feedback técnico..."
                            value={feedback.technicianFeedback || ""}
                            onChange={(e) => setFeedback({ ...feedback, technicianFeedback: e.target.value })}
                            className="bg-background/50 resize-none"
                            rows={3}
                          />
                        </div>
                      )}
                      
                      <Button onClick={handleSubmitFeedback} className="w-full">
                        Salvar Feedback
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Signatures and Report Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <ServiceSignatureSection
                service={service}
                onUpdateSignatures={handleUpdateSignatures}
                onGenerateReport={handleGenerateReport}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ServiceDetail;
