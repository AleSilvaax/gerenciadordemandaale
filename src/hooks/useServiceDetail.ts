
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  getServices,
  updateService,
  addServiceMessage,
} from "@/services/servicesDataService";
import { Service, ServiceMessage, ServiceFeedback, CustomField } from "@/types/serviceTypes";
import { useAuth } from "@/context/AuthContext";

export const useServiceDetail = () => {
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [feedback, setFeedback] = useState<ServiceFeedback>({ clientRating: 5 });
  const [photos, setPhotos] = useState<any[]>([]);
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchService(id);
    }
  }, [id]);

  useEffect(() => {
    if (service) {
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

  return {
    service,
    isLoading,
    newMessage,
    setNewMessage,
    feedback,
    setFeedback,
    photos,
    navigate,
    fetchService,
    handleStatusChange,
    handleSendMessage,
    handleSubmitFeedback,
    handleUpdateSignatures,
    handleUpdateCustomFields,
    handlePhotosChange
  };
};
