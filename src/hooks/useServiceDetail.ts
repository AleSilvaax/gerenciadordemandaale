import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  getServices,
  updateService,
  addServiceMessage,
  uploadServicePhoto,
} from "@/services/servicesDataService";
import { Service, ServiceMessage, ServiceFeedback, CustomField } from "@/types/serviceTypes";
import { useAuth } from "@/context/AuthContext";

interface UploaderPhoto {
  id: string;
  file?: File;
  url: string;
  title: string;
}

export const useServiceDetail = () => {
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [feedback, setFeedback] = useState<ServiceFeedback>({ clientRating: 5 });
  const [photos, setPhotos] = useState<UploaderPhoto[]>([]);
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
      const uploaderPhotos = (service.photos || []).map((photoUrl, index) => ({
        id: `service-photo-${index}`,
        file: undefined,
        url: photoUrl,
        title: service.photoTitles?.[index] || `Foto ${index + 1}`,
      }));
      setPhotos(uploaderPhotos);
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

  const handlePhotosChange = async (newPhotos: UploaderPhoto[]) => {
    if (!service) {
      console.log('[useServiceDetail] Serviço não encontrado para salvar fotos');
      return;
    }

    try {
      console.log('[useServiceDetail] Processando', newPhotos.length, 'fotos');
      
      const processedPhotos: string[] = [];
      const processedTitles: string[] = [];
      let hasNewUploads = false;

      // Separar fotos existentes das novas
      for (const photo of newPhotos) {
        if (photo.file instanceof File) {
          // Nova foto que precisa ser enviada
          hasNewUploads = true;
          console.log('[useServiceDetail] Nova foto detectada:', photo.title);
          
          try {
            toast.info(`Enviando foto: ${photo.title}...`);
            const publicUrl = await uploadServicePhoto(photo.file);
            processedPhotos.push(publicUrl);
            processedTitles.push(photo.title);
            console.log('[useServiceDetail] Upload concluído:', publicUrl);
          } catch (error) {
            console.error('[useServiceDetail] Erro no upload:', error);
            toast.error(`Erro ao enviar ${photo.title}`);
            // Continua com as outras fotos
          }
        } else if (typeof photo.url === 'string' && photo.url.startsWith('http')) {
          // Foto já existente no servidor
          processedPhotos.push(photo.url);
          processedTitles.push(photo.title);
        } else if (typeof photo.url === 'string' && photo.url.startsWith('blob:')) {
          // Foto local que ainda não foi enviada - isso é um erro, deve ser enviada primeiro
          console.warn('[useServiceDetail] Foto blob detectada, isso não deveria acontecer:', photo.url);
        }
      }
      
      console.log('[useServiceDetail] Total de fotos válidas:', processedPhotos.length);
      
      // Só atualizar o banco se houver mudanças
      if (hasNewUploads || processedPhotos.length !== (service.photos?.length || 0)) {
        console.log('[useServiceDetail] Atualizando banco de dados...');
        
        const updatedService = await updateService({ 
          id: service.id, 
          photos: processedPhotos, 
          photoTitles: processedTitles 
        });

        if (updatedService) {
          console.log('[useServiceDetail] Serviço atualizado com', updatedService.photos?.length || 0, 'fotos');
          setService(updatedService);
          
          if (hasNewUploads) {
            const newCount = processedPhotos.length - (service.photos?.length || 0);
            toast.success(`${newCount} foto(s) salva(s) com sucesso!`);
          } else {
            toast.success("Fotos atualizadas com sucesso!");
          }
        } else {
          throw new Error("Falha ao atualizar serviço no banco");
        }
      } else {
        console.log('[useServiceDetail] Nenhuma mudança detectada nas fotos');
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
