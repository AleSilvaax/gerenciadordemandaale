import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  updateService,
  addServiceMessage,
} from "@/services/servicesDataService";
import { Service, ServiceMessage, ServiceFeedback, CustomField, Photo, TeamMember } from "@/types/serviceTypes";
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
      console.log('[useServiceDetail] Buscando detalhes do serviço:', serviceId);

      // Passo 1: Buscar os dados principais do serviço.
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (serviceError) throw serviceError;
      if (!serviceData) throw new Error("Demanda não encontrada.");

      let completeServiceData: Service = serviceData as Service;

      // Passo 2: Buscar as mensagens associadas à demanda.
      const { data: messagesData, error: messagesError } = await supabase
        .from('service_messages')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.warn("Não foi possível carregar as mensagens:", messagesError);
        completeServiceData.messages = [];
      } else {
        completeServiceData.messages = messagesData || [];
      }

      // Passo 3: Buscar os detalhes do técnico, se houver um ID.
      if (serviceData.technician_id) {
        const { data: technicianData, error: technicianError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, role')
          .eq('id', serviceData.technician_id)
          .single();
        
        if (technicianError) {
          console.warn("Não foi possível carregar os detalhes do técnico:", technicianError);
        } else if (technicianData) {
          completeServiceData.technician = {
              id: technicianData.id,
              name: technicianData.name,
              avatar: technicianData.avatar_url,
              role: technicianData.role,
          } as TeamMember;
        }
      }
      
      // Passo 4: Buscar as fotos da demanda.
      const { data: photosData, error: photosError } = await supabase
        .from('service_photos')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: true });

      if (photosError) {
        console.warn("Não foi possível carregar as fotos:", photosError);
        setPhotos([]);
      } else if (photosData) {
        const loadedPhotos: Photo[] = (photosData || []).map((photo, index) => ({
          id: `db-${photo.id}`,
          url: photo.photo_url,
          title: photo.title || `Foto ${index + 1}`,
        }));
        setPhotos(loadedPhotos);
      }

      // Passo 5: Atualizar o estado com todos os dados compilados.
      setService(completeServiceData);

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
      toast.error("Erro ao atualizar status");
    }
  };

  const handleSendMessage = async () => {
    if (!service || !newMessage.trim() || !user) return;
    
    try {
      // ===== CORREÇÃO: Objeto de mensagem criado com as propriedades corretas =====
      const messageData: ServiceMessage = {
        senderId: user.id,
        senderName: user.name || "Usuário",
        senderRole: user.role || "tecnico",
        message: newMessage.trim(),
        // Incluindo propriedades que o tipo ServiceMessage pode esperar
        id: '', 
        service_id: service.id,
        created_at: new Date().toISOString(),
      };
      
      await addServiceMessage(service.id, messageData);
      
      // Recarrega os dados para garantir que a nova mensagem apareça
      await fetchService(service.id);
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
