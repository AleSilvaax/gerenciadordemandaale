import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  updateService,
  addServiceMessage,
} from "@/services/servicesDataService";
import { Service, ServiceMessage, ServiceFeedback, CustomField, Photo } from "@/types/serviceTypes";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useServiceDetail = () => {
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [feedback, setFeedback] = useState<ServiceFeedback>({ clientRating: 5 });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchService = useCallback(async (serviceId: string) => {
    setIsLoading(true);
    try {
      console.log('[useServiceDetail] Buscando detalhes completos do serviço:', serviceId);

      // 1. Busca o serviço principal e os detalhes do técnico associado em uma única query
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select(`
          *,
          technician:technician_id(id, name, avatar:avatar_url, role),
          messages:service_messages(*)
        `)
        .eq('id', serviceId)
        .single();

      if (serviceError) {
        throw serviceError;
      }

      if (serviceData) {
        console.log('[useServiceDetail] Serviço encontrado:', serviceData.title);
        // O Supabase retorna 'technician' como um objeto e 'messages' como um array
        // que já podemos anexar diretamente ao nosso objeto de serviço.
        setService(serviceData as Service);

        // 2. Busca as fotos separadamente
        const { data: photosData, error: photosError } = await supabase
          .from('service_photos')
          .select('*')
          .eq('service_id', serviceId)
          .order('created_at', { ascending: true });

        if (photosError) {
          console.warn('[useServiceDetail] Erro ao carregar fotos:', photosError);
          setPhotos([]);
        } else if (photosData) {
          const loadedPhotos: Photo[] = photosData.map((photo, index) => ({
            id: `db-${photo.id}`,
            url: photo.photo_url,
            title: photo.title || `Foto ${index + 1}`,
          }));
          setPhotos(loadedPhotos);
        }
      } else {
        toast.error("Serviço não encontrado");
        navigate("/demandas");
      }
    } catch (error: any) {
      console.error("Erro ao carregar detalhes do serviço:", error);
      toast.error("Erro ao carregar detalhes do serviço", { description: error.message });
      navigate("/demandas");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (id) {
      fetchService(id);
    }
  }, [id, fetchService]);


  const handlePhotosChange = async (newPhotos: Photo[]) => {
    setPhotos(newPhotos);
    // A lógica de recarregar pode ser simplificada ou removida se o upload já retornar os dados corretos
    if (service?.id) {
      setTimeout(() => fetchService(service.id), 1000);
    }
  };

  const handleStatusChange = async (newStatus: Service["status"]) => {
    if (!service) return;
    
    try {
      const updatedService = await updateService({ id: service.id, status: newStatus });
      if (updatedService) {
        setService(prev => prev ? { ...prev, status: newStatus } : null);
        toast.success("Status atualizado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleSendMessage = async () => {
    if (!service || !newMessage.trim() || !user) return;
    
    try {
      const messageData: Partial<ServiceMessage> = {
        service_id: service.id,
        user_id: user.id,
        user_name: user.name || "Usuário",
        content: newMessage.trim(),
      };
      
      await addServiceMessage(service.id, messageData);
      
      // Apenas atualiza o estado local para uma UI mais rápida
      const optimisticNewMessage: ServiceMessage = {
          id: new Date().toISOString(), // ID temporário
          created_at: new Date().toISOString(),
          ...messageData
      } as ServiceMessage;

      setService(prev => prev ? { ...prev, messages: [...(prev.messages || []), optimisticNewMessage] } : null);
      setNewMessage("");
      toast.success("Mensagem enviada!");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem");
    }
  };

  const handleSubmitFeedback = async () => {
    if (!service) return;
    
    try {
      const updatedService = await updateService({ id: service.id, feedback });
      if (updatedService) {
        setService(prev => prev ? { ...prev, feedback } : null);
        toast.success("Feedback salvo com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao salvar feedback:", error);
      toast.error("Erro ao salvar feedback");
    }
  };

  const handleUpdateSignatures = async (signatures: { client?: string; technician?: string }) => {
    if (!service) return;
    
    try {
      const updatedService = await updateService({ id: service.id, signatures });
      if (updatedService) {
        setService(prev => prev ? { ...prev, signatures: { ...prev.signatures, ...signatures } } : null);
        toast.success("Assinaturas atualizadas com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao atualizar assinaturas:", error);
      toast.error("Erro ao atualizar assinaturas");
    }
  };

  const handleUpdateCustomFields = async (fields: CustomField[]) => {
    if (!service) return;
    
    try {
      const updatedService = await updateService({ id: service.id, customFields: fields });
      if (updatedService) {
        setService(prev => prev ? { ...prev, customFields: fields } : null);
        toast.success("Campos técnicos atualizados com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao atualizar campos técnicos:", error);
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
