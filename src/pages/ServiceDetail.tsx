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
  getService,
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
import { Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rating } from "@/components/ui-custom/Rating";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { TechnicianAssigner } from "@/components/ui-custom/TechnicianAssigner";

interface Params {
  id: string;
}

interface ServiceDetailProps {
  editMode?: boolean;
}

const ServiceDetail: React.FC<ServiceDetailProps> = ({ editMode = false }) => {
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [feedback, setFeedback] = useState<ServiceFeedback>({ clientRating: 5 });
  const { id } = useParams<Params>();
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchService(id);
    }
  }, [id]);

  const fetchService = async (id: string) => {
    setIsLoading(true);
    try {
      const serviceData = await getService(id);
      setService(serviceData);
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
      fetchService(id!); // Recarrega os dados do serviço
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
      fetchService(id!); // Recarrega os dados do serviço
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
      fetchService(id!); // Recarrega os dados do serviço
    } catch (error) {
      console.error("Erro ao enviar feedback:", error);
      toast.error("Erro ao enviar feedback");
    }
  };

  if (isLoading) {
    return <div>Carregando detalhes do serviço...</div>;
  }

  if (!service) {
    return <div>Serviço não encontrado.</div>;
  }

  return (
    <div className="container py-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Demanda</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Informações básicas */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{service.title}</h2>
                <p className="text-muted-foreground">
                  Local: {service.location}
                </p>
                {service.number && (
                  <p className="text-muted-foreground">
                    Número da Demanda: {service.number}
                  </p>
                )}
              </div>
              <Badge variant="secondary">{service.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium">
                  Criação:{" "}
                  {format(new Date(service.creationDate!), "PPP", {
                    locale: ptBR,
                  })}
                </span>
              </div>
              <div>
                {service.dueDate && (
                  <span className="text-sm font-medium">
                    Vencimento:{" "}
                    {format(new Date(service.dueDate), "PPP", { locale: ptBR })}
                  </span>
                )}
              </div>
            </div>

            {/* Tecnico Responsável */}
            <div className="flex items-center gap-2 mt-2 mb-4">
              {/* Exibe o atual */}
              <span className="font-medium">Técnico: {service.technician?.name ?? "Não atribuído"}</span>
            </div>

            {/* Só para gestores: exibe opção para editar/atribuir técnico */}
            {hasPermission("gestor") && (
              <TechnicianAssigner
                currentTechnicianId={service.technician?.id}
                onAssign={async (technician) => {
                  // updateService já existente no backend
                  await updateService({ id: service.id, technician });
                  // Forçar reload ou atualizar localmente se necessário
                  toast.success("Técnico atualizado!");
                  // se preferir, pode disparar um refetch dos dados ou recarregar a página
                  window.location.reload();
                }}
              />
            )}

            {/* Descrição */}
            {service.description && (
              <div>
                <h4 className="text-md font-semibold">Descrição:</h4>
                <p className="text-muted-foreground">{service.description}</p>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Ações (somente se não estiver em modo de edição) */}
          {!editMode && (
            <div className="flex justify-between">
              <div>
                {service.status !== "concluido" && (
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange("concluido")}
                  >
                    Marcar como Concluído
                  </Button>
                )}
                {service.status !== "cancelado" && (
                  <Button
                    variant="destructive"
                    onClick={() => handleStatusChange("cancelado")}
                  >
                    Cancelar Demanda
                  </Button>
                )}
              </div>
              <div>
                <Button
                  onClick={() => navigate(`/demandas/${id}/edit`)}
                  disabled={!hasPermission("edit_services")}
                >
                  Editar Demanda
                </Button>
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {/* Mensagens */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="messages">
              <AccordionTrigger>Mensagens</AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-[200px] pr-4">
                  {service.messages && service.messages.length > 0 ? (
                    service.messages.map((msg, index) => (
                      <div key={index} className="mb-2">
                        <div className="flex items-start gap-2">
                          <Avatar>
                            <AvatarImage src={msg.senderId} />
                            <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">
                              {msg.senderName}
                              <span className="text-xs text-muted-foreground ml-1">
                                {format(new Date(msg.timestamp!), "dd/MM/yyyy HH:mm", {
                                  locale: ptBR,
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800">{msg.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      Nenhuma mensagem para esta demanda.
                    </p>
                  )}
                </ScrollArea>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    type="text"
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button type="button" onClick={handleSendMessage}>
                    Enviar <Send className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Separator className="my-4" />

          {/* Feedback */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="feedback">
              <AccordionTrigger>Feedback</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rating">Avaliação do Cliente</Label>
                    <Rating
                      id="rating"
                      value={feedback.clientRating}
                      onChange={(value) =>
                        setFeedback({ ...feedback, clientRating: value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="comment">Comentário do Cliente</Label>
                    <Textarea
                      id="comment"
                      placeholder="Deixe seu comentário..."
                      value={feedback.clientComment}
                      onChange={(e) =>
                        setFeedback({ ...feedback, clientComment: e.target.value })
                      }
                    />
                  </div>
                  {/* Feedback do Técnico (apenas se o usuário for um técnico) */}
                  {user?.role === "tecnico" && (
                    <div>
                      <Label htmlFor="techFeedback">Feedback do Técnico</Label>
                      <Textarea
                        id="techFeedback"
                        placeholder="Deixe seu feedback técnico..."
                        value={feedback.technicianFeedback}
                        onChange={(e) =>
                          setFeedback({
                            ...feedback,
                            technicianFeedback: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                  <Button onClick={handleSubmitFeedback}>Enviar Feedback</Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceDetail;
