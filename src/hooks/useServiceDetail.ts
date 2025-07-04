
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
import { photoService } from "@/services/photoService";

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

  useEffect(() => {
    if (service) {
      console.log('[useServiceDetail] Carregando fotos do serviço:', service.photos?.length || 0);
      // Converter fotos existentes para o formato local
      const existingPhotos: Photo[] = (service.photos || []).map((photoUrl, index) => ({
        id: `existing-${index}`,
        file: new File([], 'existing-photo'), // Placeholder file para fotos existentes
        url: photoUrl,
        title: service.photoTitles?.[index] || `Foto ${index + 1}`,
      }));
      setPhotos(existingPhotos);
    }
  }, [service]);

  const fetchService = async (serviceId: string) => {
    try {
      setIsLoading(true);
      const services = await getServices();
      const foundService = services.find(s => s.id === serviceId);
      
      if (foundService) {
        console.log('[useServiceDetail] Serviço encontrado:', foundService.title);
        console.log('[useServiceDetail] Fotos no serviço:', foundService.photos?.length || 0);
        setService(foundService);
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
    if (!service) {
      console.log('[useServiceDetail] Serviço não encontrado para salvar fotos');
      return;
    }

    try {
      console.log('[useServiceDetail] Processando', newPhotos.length, 'fotos');
      
      const processedPhotos: string[] = [];
      const processedTitles: string[] = [];

      // Processar cada foto
      for (const photo of newPhotos) {
        if (photo.id.startsWith('existing-')) {
          // Foto já existente no servidor
          processedPhotos.push(photo.url);
          processedTitles.push(photo.title);
        } else if (photo.file.size > 0) {
          // Nova foto que precisa ser enviada
          try {
            console.log('[useServiceDetail] Fazendo upload:', photo.title);
            toast.info(`Enviando foto: ${photo.title}...`);
            const uploadResult = await photoService.uploadPhoto(photo.file);
            processedPhotos.push(uploadResult.url);
            processedTitles.push(photo.title);
            console.log('[useServiceDetail] Upload concluído:', uploadResult.url);
          } catch (error) {
            console.error('[useServiceDetail] Erro no upload:', error);
            toast.error(`Erro ao enviar ${photo.title}`);
            // Continua com as outras fotos
          }
        }
      }
      
      console.log('[useServiceDetail] Total de fotos válidas:', processedPhotos.length);
      
      // Atualizar o banco com as fotos processadas
      const updatedService = await updateService({ 
        id: service.id, 
        photos: processedPhotos, 
        photoTitles: processedTitles 
      });

      if (updatedService) {
        console.log('[useServiceDetail] Serviço atualizado com sucesso');
        setService(updatedService);
        toast.success("Fotos salvas com sucesso!");
      } else {
        throw new Error("Falha ao atualizar serviço no banco");
      }

    } catch (error) {
      console.error('[useServiceDetail] Erro ao processar fotos:', error);
      toast.error("Erro ao salvar fotos. Tente novamente.");
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
