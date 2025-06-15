import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  getServices,
  updateService,
  addServiceMessage,
  addServiceFeedback,
} from "@/services/servicesDataService";
import { Service, ServiceMessage, ServiceFeedback } from "@/types/serviceTypes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft, Calendar, MapPin, User, FileText, MessageSquare, Star, Edit, Trash2, Clock, CheckCircle, XCircle, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rating } from "@/components/ui-custom/Rating";
import { Separator } from "@/components/ui/separator";
import { TechnicianAssigner } from "@/components/ui-custom/TechnicianAssigner";
import { ServiceSignatureSection } from "@/components/ui-custom/ServiceSignatureSection";
import { CustomFieldRenderer } from "@/components/ui-custom/CustomFieldRenderer";
import { generateDetailedServiceReport } from "@/utils/detailedReportGenerator";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { PhotoUploader } from "@/components/ui-custom/PhotoUploader";

interface ServiceDetailProps {
  editMode?: boolean;
}

const ServiceDetail: React.FC<ServiceDetailProps> = ({ editMode = false }) => {
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [feedback, setFeedback] = useState<ServiceFeedback>({ clientRating: 5 });
  const { id } = useParams<{ id?: string }>();
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchService(id);
    }
  }, [id]);

  const fetchService = async (serviceId: string) => {
    setIsLoading(true);
    try {
      const allServices = await getServices();
      const found = allServices.find(s => s.id === serviceId);
      setService(found || null);
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
      const messageData: ServiceMessage = {
        senderId: user.id,
        senderName: user.name || "Usuário",
        senderRole: user.role || "tecnico",
        message: newMessage,
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
      await addServiceFeedback(service.id, feedback);
      toast.success("Feedback enviado!");
      fetchService(id!);
    } catch (error) {
      console.error("Erro ao enviar feedback:", error);
      toast.error("Erro ao enviar feedback");
    }
  };

  const handleUpdateSignatures = async (signatures: { client?: string; technician?: string }) => {
    if (!service) return;

    try {
      await updateService({ 
        id: service.id, 
        signatures: {
          ...service.signatures,
          ...signatures
        }
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
      await generateDetailedServiceReport(service);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório PDF");
    }
  };

  const handleAddPhoto = async (file: File, title: string): Promise<string> => {
    if (!service) throw new Error("Service not found");
    
    try {
      console.log("Adicionando foto:", { fileName: file.name, title });
      
      // Criar URL da imagem
      const photoUrl = URL.createObjectURL(file);
      
      // Atualizar arrays de fotos e títulos
      const updatedPhotos = [...(service.photos || []), photoUrl];
      const updatedTitles = [...(service.photoTitles || []), title];
      
      console.log("Atualizando serviço com fotos:", { 
        photosCount: updatedPhotos.length, 
        titlesCount: updatedTitles.length 
      });
      
      // Salvar no serviço
      await updateService({ 
        id: service.id, 
        photos: updatedPhotos,
        photoTitles: updatedTitles
      });
      
      // Recarregar dados do serviço
      await fetchService(service.id);
      
      console.log("Foto adicionada com sucesso!");
      return photoUrl;
    } catch (error) {
      console.error("Erro ao adicionar foto:", error);
      throw error;
    }
  };

  const handleRemovePhoto = async (index: number): Promise<void> => {
    if (!service) return;
    
    try {
      console.log("Removendo foto no índice:", index);
      
      const updatedPhotos = service.photos?.filter((_, i) => i !== index) || [];
      const updatedTitles = service.photoTitles?.filter((_, i) => i !== index) || [];
      
      await updateService({ 
        id: service.id, 
        photos: updatedPhotos,
        photoTitles: updatedTitles
      });
      
      await fetchService(service.id);
      console.log("Foto removida com sucesso!");
    } catch (error) {
      console.error("Erro ao remover foto:", error);
    }
  };

  const handleUpdatePhotoTitle = async (index: number, title: string): Promise<void> => {
    if (!service) return;
    
    try {
      console.log("Atualizando título da foto:", { index, title });
      
      const updatedTitles = [...(service.photoTitles || [])];
      updatedTitles[index] = title;
      
      await updateService({ 
        id: service.id, 
        photoTitles: updatedTitles
      });
      
      await fetchService(service.id);
      console.log("Título da foto atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar título da foto:", error);
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
                  {/* Dates */}
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

                  {/* Technician */}
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

                  {/* Technician Assigner for Managers */}
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

                  {/* Description */}
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

            {/* Custom Fields */}
            {service.customFields && service.customFields.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Campos Personalizados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CustomFieldRenderer 
                      fields={service.customFields} 
                      disabled={true}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Photos Section */}
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
                    photos={service?.photos?.map((url, index) => ({
                      url,
                      title: service.photoTitles?.[index] || `Foto ${index + 1}`
                    })) || []}
                    onAddPhoto={handleAddPhoto}
                    onRemovePhoto={handleRemovePhoto}
                    onUpdateTitle={handleUpdatePhotoTitle}
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

          {/* Right Column - Messages, Feedback and Signatures */}
          <div className="space-y-6">
            {/* Messages Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Mensagens
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
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(msg.timestamp!), "dd/MM HH:mm", { locale: ptBR })}
                                </span>
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

            {/* Feedback Section */}
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
                      Enviar Feedback
                    </Button>
                  </div>
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
