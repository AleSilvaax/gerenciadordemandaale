// Copie e cole este código completo para o ficheiro: src/hooks/useServiceDetail.ts

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  getServices,
  updateService,
  addServiceMessage,
  uploadServicePhoto, // Importa a função de upload
} from "@/services/servicesDataService";
import { Service, ServiceMessage, ServiceFeedback, CustomField } from "@/types/serviceTypes";
import { useAuth } from "@/context/AuthContext";

// Interface para dar um tipo mais seguro às fotos
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

  // CORREÇÃO PARA O BUG "0 BYTES"
  useEffect(() => {
    if (service) {
      const uploaderPhotos = (service.photos || []).map((photoUrl, index) => ({
        id: `service-photo-${index}`,
        file: undefined, // Esta é a correção. Não criamos mais um ficheiro falso.
        url: photoUrl,   // Usamos a URL permanente que veio do banco de dados.
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
        toast.error("Demanda não encontrada.");
        navigate("/demandas");
      }
    } catch (error) {
      toast.error("Erro ao carregar detalhes do serviço");
    } finally {
      setIsLoading(false);
    }
  };

  // FUNÇÃO CORRIGIDA QUE USA A LÓGICA DE UPLOAD
  const handlePhotosChange = async (newPhotos: UploaderPhoto[]) => {
    if (!service) return;
    try {
      toast.info("A processar e a salvar as fotos...");
      setIsLoading(true);

      const uploadPromises = newPhotos.map(async (photo) => {
        if (typeof photo.url === 'string' && photo.url.startsWith('http')) {
          return { url: photo.url, title: photo.title };
        }
        if (photo.file instanceof File) {
            const publicUrl = await uploadServicePhoto(photo.file);
            return { url: publicUrl, title: photo.title };
        }
        return null;
      });

      const resolvedPhotos = (await Promise.all(uploadPromises)).filter(p => p !== null);
      const photoUrls = resolvedPhotos.map(p => p!.url);
      const photoTitles = resolvedPhotos.map(p => p!.title);
      
      await updateService({ id: service.id, photos: photoUrls, photoTitles: photoTitles });
      toast.success("Fotos salvas com sucesso!");
      await fetchService(service.id);
    } catch (error) {
      toast.error("Ocorreu um erro ao salvar as fotos.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Funções restantes do hook ---
  const handleStatusChange = async (newStatus: Service["status"]) => { if (!service) return; await updateService({ id: service.id, status: newStatus }); toast.success("Status atualizado!"); fetchService(id!); };
  const handleSendMessage = async () => { if (!service || !newMessage.trim() || !user) return; const msg = { senderId: user.id, senderName: user.name, senderRole: user.role, message: newMessage, timestamp: new Date().toISOString() }; await addServiceMessage(service.id, msg); setNewMessage(""); toast.success("Mensagem enviada!"); fetchService(id!); };
  const handleSubmitFeedback = async () => { if (!service) return; await updateService({ id: service.id, feedback }); toast.success("Feedback salvo!"); fetchService(id!); };
  const handleUpdateSignatures = async (signatures: { client?: string; technician?: string }) => { if (!service) return; await updateService({ id: service.id, signatures: { ...service.signatures, ...signatures } }); toast.success("Assinaturas salvas!"); fetchService(id!); };
  const handleUpdateCustomFields = async (fields: CustomField[]) => { if (!service) return; await updateService({ id: service.id, customFields: fields }); toast.success("Campos salvos!"); fetchService(id!); };

  return {
    service, isLoading, newMessage, setNewMessage, feedback, setFeedback, photos, navigate,
    fetchService, handleStatusChange, handleSendMessage, handleSubmitFeedback, handleUpdateSignatures, handleUpdateCustomFields, handlePhotosChange,
  };
};
