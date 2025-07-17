
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  getService,
  updateService,
  addServiceMessage,
} from "@/services/servicesDataService";
import { Service, ServiceMessage, ServiceFeedback, CustomField } from "@/types/serviceTypes";
import { useAuth } from "@/context/MockAuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Photo {
  url: string;
  title: string;
}

export const useServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [feedback, setFeedback] = useState({
    rating: 0,
    comment: "",
    wouldRecommend: false,
  });
  const [photos, setPhotos] = useState<Photo[]>([]);

  const fetchService = async (serviceId: string) => {
    try {
      setIsLoading(true);
      console.log('[ServiceDetail] Buscando serviço:', serviceId);
      
      const serviceData = await getService(serviceId);
      console.log('[ServiceDetail] Dados do serviço:', serviceData);
      
      if (!serviceData) {
        console.log('[ServiceDetail] Serviço não encontrado');
        setService(null);
        return;
      }
      
      setService(serviceData);
      
      // Carregar fotos se existirem
      if (serviceData.photos && serviceData.photos.length > 0) {
        const photoData = serviceData.photos.map((url: string, index: number) => ({
          url,
          title: serviceData.photoTitles?.[index] || `Foto ${index + 1}`
        }));
        setPhotos(photoData);
      }
      
    } catch (error) {
      console.error('[ServiceDetail] Erro ao buscar serviço:', error);
      toast.error("Erro ao carregar demanda");
      setService(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchService(id);
    } else {
      setIsLoading(false);
    }
  }, [id]);

  const handleStatusChange = async (status: Service["status"]) => {
    if (!service || !user) return;

    try {
      console.log('[ServiceDetail] Alterando status para:', status);
      
      await updateService({
        id: service.id,
        status,
      });
      
      setService(prev => prev ? { ...prev, status } : null);
      toast.success("Status atualizado com sucesso!");
      
    } catch (error) {
      console.error('[ServiceDetail] Erro ao atualizar status:', error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleSendMessage = async () => {
    if (!service || !user || !newMessage.trim()) return;

    try {
      console.log('[ServiceDetail] Enviando mensagem:', newMessage);
      
      const message: ServiceMessage = {
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
      };

      await addServiceMessage(service.id, message);
      
      // Atualizar as mensagens localmente
      setService(prev => {
        if (!prev) return null;
        const updatedMessages = [...(prev.messages || []), message];
        return { ...prev, messages: updatedMessages };
      });
      
      setNewMessage("");
      
    } catch (error) {
      console.error('[ServiceDetail] Erro ao enviar mensagem:', error);
      toast.error("Erro ao enviar mensagem");
    }
  };

  const handleSubmitFeedback = async () => {
    if (!service || !user) return;

    try {
      console.log('[ServiceDetail] Enviando feedback:', feedback);
      
      const feedbackData: ServiceFeedback = {
        ...feedback,
        userId: user.id,
        userName: user.name,
        timestamp: new Date().toISOString(),
        clientRating: feedback.rating,
        clientComment: feedback.comment,
      };

      await updateService({
        id: service.id,
        feedback: feedbackData,
      });
      
      setService(prev => prev ? { ...prev, feedback: feedbackData } : null);
      toast.success("Feedback enviado com sucesso!");
      
    } catch (error) {
      console.error('[ServiceDetail] Erro ao enviar feedback:', error);
      toast.error("Erro ao enviar feedback");
    }
  };

  const handleUpdateSignatures = async (signatures: any) => {
    if (!service) return;

    try {
      console.log('[ServiceDetail] Atualizando assinaturas:', signatures);
      
      await updateService({
        id: service.id,
        signatures,
      });
      
      setService(prev => prev ? { ...prev, signatures } : null);
      toast.success("Assinaturas salvas com sucesso!");
      
    } catch (error) {
      console.error('[ServiceDetail] Erro ao salvar assinaturas:', error);
      toast.error("Erro ao salvar assinaturas");
    }
  };

  const handleUpdateCustomFields = async (customFields: CustomField[]) => {
    if (!service) return;

    try {
      console.log('[ServiceDetail] Atualizando campos personalizados:', customFields);
      
      await updateService({
        id: service.id,
        customFields,
      });
      
      setService(prev => prev ? { ...prev, customFields } : null);
      toast.success("Campos técnicos salvos com sucesso!");
      
    } catch (error) {
      console.error('[ServiceDetail] Erro ao salvar campos:', error);
      toast.error("Erro ao salvar campos técnicos");
    }
  };

  const handlePhotosChange = (newPhotos: Photo[]) => {
    setPhotos(newPhotos);
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
    handlePhotosChange,
  };
};
