
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { addServicePhoto } from '@/services/api';
import { useServiceDetail } from '../context/ServiceDetailContext';

export const useServicePhotos = () => {
  const { id } = useParams<{ id: string }>();
  const { selectedPhotos, setSelectedPhotos, fileInputRef } = useServiceDetail();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !id) {
      return;
    }

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `services/${id}/${fileName}`;

    try {
      toast.loading("Enviando foto...");

      // Check if the bucket exists, create if it doesn't
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find(b => b.name === 'service-photos')) {
        await supabase.storage.createBucket('service-photos', { public: true });
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('service-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('service-photos')
        .getPublicUrl(filePath);

      if (!publicUrlData) throw new Error("Failed to get public URL");

      const photoUrl = publicUrlData.publicUrl;
      const success = await addServicePhoto(id, photoUrl);
      
      if (success) {
        setSelectedPhotos([...selectedPhotos, photoUrl]);
        toast.success("Foto adicionada com sucesso!");
      } else {
        throw new Error("Failed to add photo to service");
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Erro ao adicionar foto. Por favor, tente novamente.");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async (photoUrl: string) => {
    if (!id) return;

    try {
      // Extract the path from the URL
      const urlParts = photoUrl.split('/service-photos/');
      if (urlParts.length < 2) {
        throw new Error("Invalid photo URL format");
      }
      
      const filePath = urlParts[1];
      
      // First remove from database
      const { data: photoData, error: fetchError } = await supabase
        .from('service_photos')
        .select('id')
        .eq('photo_url', photoUrl)
        .eq('service_id', id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      // If found in database, delete the record
      if (photoData) {
        const { error: deleteError } = await supabase
          .from('service_photos')
          .delete()
          .eq('id', photoData.id);
        
        if (deleteError) throw deleteError;
      }
      
      // Also try to remove from storage
      const { error: storageError } = await supabase.storage
        .from('service-photos')
        .remove([filePath]);
      
      // This might fail if file doesn't exist, but we still want to remove from UI
      if (storageError) {
        console.warn("Could not delete file from storage:", storageError);
      }
      
      // Update UI state regardless of storage deletion outcome
      setSelectedPhotos(selectedPhotos.filter(photo => photo !== photoUrl));
      toast.success("Foto removida com sucesso!");
      
    } catch (error) {
      console.error("Erro ao remover foto:", error);
      toast.error("Erro ao remover foto. Por favor, tente novamente.");
    }
  };

  return {
    handlePhotoUpload,
    handleRemovePhoto
  };
};
