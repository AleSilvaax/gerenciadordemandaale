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
import { useIntelligentNotifications } from "@/hooks/useIntelligentNotifications";
import { validateServiceCompletion } from "@/services/inventoryService";

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
const { notifyServiceCompleted } = useIntelligentNotifications();

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
        // Convert photos to signed URLs for display since bucket is now private
        const photosWithSignedUrls = await Promise.all(
          photosData.map(async (photoData, index) => {
            let filePath = photoData.photo_url;
            if (photoData.photo_url.includes('/service-photos/')) {
              filePath = photoData.photo_url.split('/service-photos/')[1];
            } else if (photoData.photo_url.includes('/object/public/service-photos/')) {
              filePath = photoData.photo_url.split('/object/public/service-photos/')[1];
            }
            
            const { data: signedUrlData } = await supabase.storage
              .from('service-photos')
              .createSignedUrl(filePath, 3600);
            
            return {
              id: `db-${photoData.id}`,
              file: new File([], 'existing-photo'),
              url: signedUrlData?.signedUrl || photoData.photo_url,
              title: photoData.title || `Foto ${index + 1}`,
              dbId: photoData.id, // Incluir o ID do banco de dados
            };
          })
        );
        
        return photosWithSignedUrls;
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
      const foundService = await getServiceByIdFromDatabase(serviceId);
      
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
  
  // Se estiver tentando concluir, validar materiais primeiro
  if (newStatus === 'concluido') {
    try {
      console.log('[useServiceDetail] Validando materiais antes de concluir...');
      const shortages = await validateServiceCompletion(service.id);
      
      if (shortages.length > 0) {
        console.log('[useServiceDetail] Materiais em falta encontrados:', shortages);
        // Retornar os materiais em falta para o componente pai decidir o que fazer
        throw new Error(`MATERIAL_SHORTAGE:${JSON.stringify(shortages)}`);
      }
      
      console.log('[useServiceDetail] Todos os materiais OK, prosseguindo com conclusão...');
    } catch (error: any) {
      if (error.message?.startsWith('MATERIAL_SHORTAGE:')) {
        // Re-throw para que o componente pai possa capturar e mostrar o modal
        throw error;
      }
      console.error('[useServiceDetail] Erro na validação de materiais:', error);
      toast.error("Erro ao validar materiais para conclusão");
      return;
    }
  }
  
  try {
    const updatedService = await updateService({ id: service.id, status: newStatus });
    if (updatedService) {
      setService(updatedService);
      toast.success("Status atualizado com sucesso!");
      if (newStatus === 'concluido') {
        // Notificação contextual quando concluído
        notifyServiceCompleted(updatedService);
      }
    } else {
      toast.error("Erro ao atualizar status: Resposta inválida do servidor");
    }
  } catch (error: any) {
    console.error('[useServiceDetail] Erro ao atualizar status:', error);
    const errorMessage = error?.message || "Erro desconhecido ao atualizar status";
    toast.error(`Erro ao atualizar status: ${errorMessage}`);
    throw error; // Re-throw para que o componente pai possa capturar
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
