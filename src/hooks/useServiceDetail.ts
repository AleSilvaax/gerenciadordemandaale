// Copie e cole este código completo para o arquivo: src/hooks/useServiceDetail.ts

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  getServices,
  updateService,
  addServiceMessage,
  uploadServicePhoto, // 1. Importando a função de upload que você adicionou
} from "@/services/servicesDataService";
import { Service, ServiceMessage, ServiceFeedback, CustomField } from "@/types/serviceTypes";
import { useAuth } from "@/context/AuthContext";

// Interface para dar um tipo mais seguro às fotos do uploader
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
  const [photos, setPhotos] = useState<UploaderPhoto[]>([]); // Usando a interface
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
      // Não criamos mais um ficheiro falso. O ficheiro só existe ao fazer upload.
      file: undefined, 
      url: photoUrl, // A URL permanente vinda do Supabase
      title: service.photoTitles?.[index] || `Foto ${index + 1}`,
    }));
    setPhotos(uploaderPhotos);
  }
}, [service]);

  const fetchService = async (serviceId: string) => {
    setIsLoading(true);
    try {
      const allServices = await getServices();
      const found = allServices.find(s => s.id === serviceId);
      if (found) {
        setService(found);
        if (found.feedback) setFeedback(found.feedback);
      } else {
        setService(null);
        toast.error("Demanda não encontrada.");
        navigate("/demandas");
      }
    } catch (error) {
      toast.error("Erro ao carregar detalhes do serviço");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Esta é a função CORRIGIDA que usa o uploadServicePhoto
  const handlePhotosChange = async (newPhotos: UploaderPhoto[]) => {
    if (!service) return;

    try {
      toast.info("Processando e salvando fotos, por favor aguarde...");
      setIsLoading(true);

      const uploadPromises = newPhotos.map(async (photo) => {
        // Se a URL já é pública (http), é uma foto antiga. Apenas a mantenha.
        if (typeof photo.url === 'string' && photo.url.startsWith('http')) {
          return { url: photo.url, title: photo.title };
        }
        
        // Se for um novo arquivo (identificado pela presença do objeto File), faz o upload.
        if (photo.file instanceof File) {
            const publicUrl = await uploadServicePhoto(photo.file);
            return { url: publicUrl, title: photo.title };
        }

        // Se não for nenhum dos casos acima, ignora.
        return null;
      });

      // Aguarda todos os uploads terminarem e filtra resultados nulos
      const resolvedPhotos = (await Promise.all(uploadPromises)).filter(p => p !== null);

      const photoUrls = resolvedPhotos.map(p => p!.url);
      const photoTitles = resolvedPhotos.map(p => p!.title);
      
      // Atualiza a demanda no banco com as URLs permanentes
      await updateService({ 
        id: service.id, 
        photos: photoUrls,
        photoTitles: photoTitles
      });
      
      toast.success("Fotos salvas com sucesso no sistema!");
      await fetchService(service.id); // Recarrega os dados para exibir as novas imagens

    } catch (error) {
      console.error("Erro ao atualizar fotos:", error);
      toast.error("Ocorreu um erro ao salvar as fotos. Verifique o console para mais detalhes.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: Service["status"]) => {
    if (!service) return;
    try {
      await updateService({ id: service.id, status: newStatus });
      toast.success("Status do serviço atualizado!");
      fetchService(id!);
    } catch (error) {
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
        timestamp: new Date().toISOString(),
      };
      await addServiceMessage(service.id, messageData);
      setNewMessage("");
      toast.success("Mensagem enviada!");
      fetchService(id!);
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
    }
  };

  const handleSubmitFeedback = async () => {
    if (!service) return;
    try {
      await updateService({ id: service.id, feedback: feedback });
      toast.success("Feedback salvo com sucesso!");
      fetchService(id!);
    } catch (error) {
      toast.error("Erro ao salvar feedback");
    }
  };

  const handleUpdateSignatures = async (signatures: { client?: string; technician?: string }) => {
    if (!service) return;
    try {
      const updatedSignatures = { ...service.signatures, ...signatures };
      await updateService({ id: service.id, signatures: updatedSignatures });
      toast.success("Assinaturas salvas com sucesso!");
      fetchService(id!);
    } catch (error) {
      toast.error("Erro ao salvar assinaturas");
    }
  };

  const handleUpdateCustomFields = async (fields: CustomField[]) => {
    if (!service) return;
    try {
      await updateService({ id: service.id, customFields: fields });
      toast.success("Campos técnicos salvos com sucesso!");
      fetchService(id!);
    } catch (error) {
      toast.error("Erro ao salvar campos técnicos");
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
    handlePhotosChange, // <- A função corrigida está aqui
  };
};
