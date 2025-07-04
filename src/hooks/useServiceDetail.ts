
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

  useEffect(() => {
    if (id) {
      fetchService(id);
    }
  }, [id]);

  const loadPhotosFromDatabase = async (serviceId: string) => {
    try {
      console.log('[useServiceDetail] Carregando fotos do banco para o serviço:', serviceId);
      
      const { data: photosData, error } = await supabase
        .from('service_photos')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[useServiceDetail] Erro ao carregar fotos:', error);
        return [];
      }

      console.log('[useServiceDetail] Fotos encontradas no banco:', photosData?.length || 0);

      if (photosData && photosData.length > 0) {
        const loadedPhotos: Photo[] = photosData.map((photoData, index) => ({
          id: `db-${photoData.id}`,
          file: new File([], 'existing-photo'), // Placeholder para fotos do banco
          url: photoData.photo_url,
          title: photoData.title || `Foto ${index + 1}`,
        }));

        console.log('[useServiceDetail] Fotos processadas:', loadedPhotos.length);
        return loadedPhotos;
      }

      return [];
    } catch (error) {
      console.error('[useServiceDetail] Erro ao carregar fotos:', error);
      return [];
    }
  };

  const fetchService = async (serviceId: string) => {
    try {
      setIsLoading(true);
      console.log('[useServiceDetail] Buscando serviço:', serviceId);
      
      const services = await getServices();
      const foundService = services.find(s => s.id === serviceId);
      
      if (foundService) {
        console.log('[useServiceDetail] Serviço encontrado:', foundService.title);
        setService(foundService);
        
        // Carregar fotos do banco de dados
        const loadedPhotos = await loadPhotosFromDatabase(serviceId);
        setPhotos(loadedPhotos);
        
      } else {
        toast.error("Serviço não encontrado");
        navigate("/demandas");
      }
    } catch (error) {
      console.error("Erro ao carregar serviço:", error);
      toast.error("Erro ao carregar serviço");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotosChange = async (newPhotos: Photo[]) => {
    console.log('[useServiceDetail] Atualizando fotos localmente:', newPhotos.length);
    setPhotos(newPhotos);
    
    // Não precisamos fazer upload aqui pois o PhotoUploader já faz
    // Apenas atualizamos o estado local
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
      console.error("Erro ao atualizar status:", error);
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
      console.error("Erro ao enviar mensagem:", error);
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
      console.error("Erro ao salvar feedback:", error);
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
      console.error("Erro ao atualizar assinaturas:", error);
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
