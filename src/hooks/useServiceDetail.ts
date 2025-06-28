// Copie este código completo para o ficheiro: src/hooks/useServiceDetail.ts

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  getServices,
  updateService,
  addServiceMessage,
  uploadServicePhoto, // 1. Importa a função de upload correta
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

  // 2. CORREÇÃO PARA O BUG "0 BYTES"
  useEffect(() => {
    if (service) {
      const uploaderPhotos = (service.photos || []).map((photoUrl, index) => ({
        id: `service-photo-${index}`,
        file: undefined, // Não criamos mais um ficheiro falso ao carregar
        url: photoUrl,   // Usamos a URL permanente que veio do banco de dados
        title: service.photoTitles?.[index] || `Foto ${index + 1}`,
      }));
      setPhotos(uploaderPhotos);
    }
  }, [service]);

  const fetchService = async (serviceId: string) => { /* ... (esta função não precisa de alteração) ... */ };

  // 3. FUNÇÃO CORRIGIDA QUE USA A LÓGICA DE UPLOAD
  const handlePhotosChange = async (newPhotos: UploaderPhoto[]) => {
    if (!service) return;
    try {
      toast.info("A processar e a salvar as fotos...");
      setIsLoading(true);

      const uploadPromises = newPhotos.map(async (photo) => {
        if (photo.file instanceof File) {
          const publicUrl = await uploadServicePhoto(photo.file);
          return { url: publicUrl, title: photo.title };
        }
        if (typeof photo.url === 'string' && photo.url.startsWith('http')) {
          return { url: photo.url, title: photo.title };
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

  // --- Funções restantes do hook (não precisam de alteração) ---
  const handleStatusChange = async (newStatus: Service["status"]) => { /* ... */ };
  const handleSendMessage = async () => { /* ... */ };
  const handleSubmitFeedback = async () => { /* ... */ };
  const handleUpdateSignatures = async (signatures: { client?: string; technician?: string }) => { /* ... */ };
  const handleUpdateCustomFields = async (fields: CustomField[]) => { /* ... */ };

  return {
    service, isLoading, newMessage, setNewMessage, feedback, setFeedback, photos, navigate,
    fetchService, handleStatusChange, handleSendMessage, handleSubmitFeedback, handleUpdateSignatures, handleUpdateCustomFields, handlePhotosChange,
  };
};
