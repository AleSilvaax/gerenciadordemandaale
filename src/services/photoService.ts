
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PhotoUploadResult {
  url: string;
  path: string;
}

export interface PhotoDeleteResult {
  success: boolean;
  error?: string;
}

class PhotoService {
  private readonly bucketName = 'service-photos';

  async uploadPhoto(file: File): Promise<PhotoUploadResult> {
    try {
      console.log('[PhotoService] Iniciando upload:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      
      // Validar arquivo
      if (!this.isValidImageFile(file)) {
        throw new Error('Arquivo deve ser uma imagem válida (JPG, PNG, WebP)');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB max
        throw new Error('Arquivo muito grande. Máximo 10MB permitido');
      }

      // Gerar nome único
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const filename = `${timestamp}-${randomId}.${fileExt}`;
      
      console.log('[PhotoService] Fazendo upload para:', filename);

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('[PhotoService] Erro no upload:', error);
        throw new Error(`Falha no upload: ${error.message}`);
      }

      // Obter URL pública
      const { data: publicData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      const result = {
        url: publicData.publicUrl,
        path: data.path
      };

      console.log('[PhotoService] Upload concluído:', result.url);
      return result;

    } catch (error) {
      console.error('[PhotoService] Erro no upload:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido no upload';
      throw new Error(message);
    }
  }

  async deletePhoto(path: string): Promise<PhotoDeleteResult> {
    try {
      console.log('[PhotoService] Deletando foto:', path);

      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        console.error('[PhotoService] Erro ao deletar:', error);
        return { success: false, error: error.message };
      }

      console.log('[PhotoService] Foto deletada com sucesso');
      return { success: true };

    } catch (error) {
      console.error('[PhotoService] Erro ao deletar foto:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: message };
    }
  }

  async uploadMultiplePhotos(
    files: File[], 
    onProgress?: (completed: number, total: number) => void
  ): Promise<PhotoUploadResult[]> {
    console.log('[PhotoService] Iniciando upload de', files.length, 'fotos');
    
    const results: PhotoUploadResult[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.uploadPhoto(files[i]);
        results.push(result);
        onProgress?.(i + 1, files.length);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        errors.push(`${files[i].name}: ${message}`);
        console.error(`[PhotoService] Erro no arquivo ${files[i].name}:`, error);
      }
    }

    if (errors.length > 0) {
      toast.error(`Alguns uploads falharam: ${errors.join(', ')}`);
    }

    console.log('[PhotoService] Upload múltiplo concluído:', results.length, 'sucessos,', errors.length, 'erros');
    return results;
  }

  private isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(file.type);
  }

  getBucketName(): string {
    return this.bucketName;
  }
}

// Instância singleton
export const photoService = new PhotoService();

// Função legacy para compatibilidade
export async function uploadServicePhoto(file: File): Promise<string> {
  const result = await photoService.uploadPhoto(file);
  return result.url;
}
