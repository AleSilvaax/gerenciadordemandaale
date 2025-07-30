// Arquivo: src/hooks/useServiceDetail.ts (VERSÃO ATUALIZADA)

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  getServiceByIdFromDatabase,
  updateService,
  addServiceMessage,
} from "@/services/servicesDataService";
import { Service, ServiceMessage, ServiceFeedback, CustomField } from "@/types/serviceTypes";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Photo {
  id: string;
  file: File;
  url: string;
  title: string;
}

export const useServiceDetail = () => {
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [feedback, setFeedback] = useState<ServiceFeedback>({ clientRating: 5 });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadPhotosFromDatabase = async (serviceId: string) => {
    try {
      const { data: photosData, error } = await supabase
        .from('service_photos')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[useServiceDetail] Erro ao carregar fotos:', error);
        return [];
      }

      if (photosData && photosData.length > 0) {
        return photosData.map((photoData, index) => ({
          id: `db-${photoData.id}`,
          file: new File([], 'existing-photo'),
          url: photoData.photo_url,
          title: photoData.title || `Foto ${index + 1}`,
        }));
      }
      return [];
    } catch (error) {
      console.error('[useServiceDetail] Erro ao carregar fotos:', error);
      return [];
    }
  };

  const fetchService = useCallback(async (serviceId: string) => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const foundService = await getServiceByIdFromDatabase(serviceId, user);
      
      if (foundService) {
        setService(foundService);
        const loadedPhotos = await loadPhotosFromDatabase(serviceId);
        setPhotos(loadedPhotos);
      } else {
        toast.error("Serviço não encontrado", { description: "Você pode não ter permissão para visualizar esta demanda." });
        navigate("/demandas");
      }
    } catch (error: any) {
      toast.error("Erro ao carregar os detalhes do serviço");
      navigate("/demandas");
    } finally {
      setIsLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    if (id && user) {
      fetchService(id);
    }
  }, [id, user, fetchService]);

  const handlePhotosChange = async (newPhotos: Photo[]) => {
    setPhotos(newPhotos);
    if (service?.id) {
      setTimeout(async () => {
        const updatedPhotos = await loadPhotosFromDatabase(service.id);
        setPhotos(updatedPhotos);
      }, 1000);
    }
  };

  const handleStatusChange = async (newStatus: Service["status"]) => {
    if (!service) return;
    try {
      const updatedService = await updateService({ id: service.id, status: newStatus });
      if (updatedService) {
        setService(updatedService);
        toast.success("Status atualizado com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleSendMessage = async () => {
    if (!service || !newMessage.trim() || !user) return;
    try {
      const messageData: ServiceMessage = {
        senderId: user.id,
        senderName: user.name || "Usuário",
        senderRole: user.role || "tecnico",
        message: newMessage.trim(),
        timestamp: new Date().toISOString()
      };
      await addServiceMessage(service.id, messageData);
      await fetchService(service.id);
      setNewMessage("");
      toast.success("Mensagem enviada!");
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
    }
  };

  const handleSubmitFeedback = async () => {
    if (!service) return;
    try {
      const updatedService = await updateService({ id: service.id, feedback });
      if (updatedService) {
        setService(updatedService);
        toast.success("Feedback salvo com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao salvar feedback");
    }
  };

  const handleUpdateSignatures = async (signatures: { client?: string; technician?: string }) => {
    if (!service) return;
    try {
      const updatedService = await updateService({ id: service.id, signatures });
      if (updatedService) {
        setService(updatedService);
        toast.success("Assinaturas atualizadas com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao atualizar assinaturas");
    }
  };

  const handleUpdateCustomFields = async (fields: CustomField[]) => {
    if (!service) return;
    try {
      const updatedService = await updateService({ id: service.id, customFields: fields });
      if (updatedService) {
        setService(updatedService);
        toast.success("Campos técnicos atualizados com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao atualizar campos técnicos");
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
    handlePhotosChange,
  };
};
