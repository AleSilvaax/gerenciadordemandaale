
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Upload de foto para o storage do Supabase
export async function uploadPhoto(file: File, bucket: string, folder: string): Promise<string | null> {
  try {
    // Verificar se o bucket existe
    const { data: buckets } = await supabase.storage.listBuckets();
    
    if (!buckets?.find(b => b.name === bucket)) {
      // Criar bucket se não existir
      await supabase.storage.createBucket(bucket, {
        public: true
      });
    }

    // Gerar um nome de arquivo único baseado no timestamp
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload do arquivo
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Obter URL pública da imagem
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (!data || !data.publicUrl) throw new Error("Não foi possível obter a URL pública da imagem");

    return data.publicUrl;
  } catch (error) {
    console.error("Erro ao fazer upload da imagem:", error);
    toast.error("Erro ao fazer upload da imagem");
    return null;
  }
}

// Remover foto do storage do Supabase
export async function removePhoto(fileUrl: string, bucket: string): Promise<boolean> {
  try {
    // Extrair caminho do arquivo da URL
    const urlParts = fileUrl.split(`/${bucket}/`);
    
    if (urlParts.length < 2) {
      throw new Error("URL inválida para remoção");
    }
    
    const filePath = urlParts[1];
    
    // Remover arquivo
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Erro ao remover imagem:", error);
    toast.error("Erro ao remover imagem");
    return false;
  }
}

// Atualizar avatar do usuário
export async function updateUserAvatar(userId: string, file: File): Promise<string | null> {
  return uploadPhoto(file, 'avatars', userId);
}

// Adicionar foto a um serviço
export async function addServicePhoto(serviceId: string, file: File): Promise<string | null> {
  return uploadPhoto(file, 'service-photos', serviceId);
}
