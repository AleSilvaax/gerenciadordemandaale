// No arquivo: src/hooks/useServiceDetail.ts

// 1. Adicione a importação da função de upload no topo do arquivo
import {
  getServices,
  updateService,
  addServiceMessage,
  uploadServicePhoto // <- Adicione esta importação
} from "@/services/servicesDataService";
// ... (outras importações existentes)


// Defina uma interface para clareza e segurança de tipo
interface UploaderPhoto {
  id: string;
  file?: File;
  url: string;
  title: string;
}


export const useServiceDetail = () => {
  // ... (código existente do seu hook)

  // 2. Substitua completamente a função handlePhotosChange por esta versão:
  const handlePhotosChange = async (newPhotos: UploaderPhoto[]) => {
    if (!service) return;

    try {
      toast.info("Processando e salvando fotos, por favor aguarde...");
      
      const uploadPromises = newPhotos.map(async (photo) => {
        // Se a URL já é uma URL pública (começa com http), é uma foto antiga. Apenas a mantenha.
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
    }
  };


  // ... (resto do seu hook)
  
  // 3. Garanta que a nova função está sendo retornada pelo hook
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
    handlePhotosChange // <- Essencial que ela esteja aqui
  };
};
