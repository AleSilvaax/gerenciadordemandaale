import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface Photo {
  id: string;
  file: File;
  url: string;
  title: string;
  dbId?: number; // ID do banco de dados para permitir edição/exclusão
}

interface PhotoUploaderProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  serviceId?: string;
  maxPhotos?: number;
  disabled?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos,
  onPhotosChange,
  serviceId,
  maxPhotos = 10,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log('[PhotoUploader] Renderizado com:', { 
    photosCount: photos.length, 
    serviceId, 
    disabled 
  });

  const uploadToSupabase = async (file: File): Promise<{ url: string; dbId: number }> => {
    console.log('[PhotoUploader] Iniciando upload para Supabase:', file.name);
    
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const filename = `${serviceId || 'temp'}-${timestamp}-${randomId}.${fileExt}`;
    
    console.log('[PhotoUploader] Nome do arquivo gerado:', filename);

    const { data, error } = await supabase.storage
      .from('service-photos')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('[PhotoUploader] Erro no upload do storage:', error);
      throw new Error(`Falha no upload: ${error.message}`);
    }

    console.log('[PhotoUploader] Upload no storage bem-sucedido:', data.path);

    // Since service-photos is now private, we need to use signed URLs
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('service-photos')
      .createSignedUrl(data.path, 3600); // 1 hour expiry

    if (signedUrlError) {
      console.error('[PhotoUploader] Erro ao gerar URL assinada:', signedUrlError);
      throw new Error(`Erro ao gerar URL da foto: ${signedUrlError.message}`);
    }

    console.log('[PhotoUploader] URL assinada gerada:', signedUrlData.signedUrl);

    // Salvar no banco de dados e retornar o ID
    const title = file.name.replace(/\.[^/.]+$/, "");
    const { data: dbData, error: dbError } = await supabase
      .from('service_photos')
      .insert({
        service_id: serviceId,
        photo_url: signedUrlData.signedUrl,
        title: title
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('[PhotoUploader] Erro ao salvar no banco:', dbError);
      throw new Error(`Erro ao salvar foto: ${dbError.message}`);
    }

    console.log('[PhotoUploader] Foto salva no banco com sucesso:', dbData);
    
    return { 
      url: signedUrlData.signedUrl,
      dbId: Number(dbData.id) // Ensure it's a number
    };
  };

  const updateServicePhotosField = async (serviceId: string) => {
    try {
      console.log('[PhotoUploader] Atualizando campo photos na tabela services');
      
      // Buscar todas as fotos do serviço
      const { data: photosData, error: photosError } = await supabase
        .from('service_photos')
        .select('photo_url')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: true });

      if (photosError) {
        console.error('[PhotoUploader] Erro ao buscar fotos:', photosError);
        return;
      }

      if (photosData && photosData.length > 0) {
        // Convert existing photos to signed URLs since bucket is now private
        console.log('[PhotoUploader] Convertendo URLs para URLs assinadas');
        const photosWithSignedUrls = await Promise.all(
          photosData.map(async (photo) => {
            // Extract file path from existing URL
            let filePath = photo.photo_url;
            if (photo.photo_url.includes('/service-photos/')) {
              filePath = photo.photo_url.split('/service-photos/')[1];
            } else if (photo.photo_url.includes('/object/public/service-photos/')) {
              filePath = photo.photo_url.split('/object/public/service-photos/')[1];
            }
            
            const { data: signedUrlData } = await supabase.storage
              .from('service-photos')
              .createSignedUrl(filePath, 3600);
            return signedUrlData?.signedUrl || photo.photo_url;
          })
        );
        
        const photoUrls = photosWithSignedUrls;
        const { error: updateError } = await supabase
          .from('services')
          .update({ photos: photoUrls })
          .eq('id', serviceId);

        if (updateError) {
          console.error('[PhotoUploader] Erro ao atualizar campo photos:', updateError);
        } else {
          console.log('[PhotoUploader] Campo photos atualizado com sucesso:', photoUrls.length, 'fotos');
        }
      } else {
        console.log('[PhotoUploader] Nenhuma foto encontrada para atualizar');
      }
    } catch (error) {
      console.error('[PhotoUploader] Erro ao atualizar campo photos:', error);
    }
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;

    console.log('[PhotoUploader] Arquivos selecionados:', files.length);

    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      toast.error(`Máximo de ${maxPhotos} fotos permitido`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const validFiles = filesToProcess.filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB max
    );
    
    if (validFiles.length !== filesToProcess.length) {
      toast.error('Alguns arquivos foram ignorados (apenas imagens até 10MB são aceitas)');
    }

    if (validFiles.length === 0) {
      toast.error('Nenhum arquivo válido selecionado');
      return;
    }

    setIsUploading(true);

    try {
      const newPhotos: Photo[] = [];

      for (const file of validFiles) {
        console.log('[PhotoUploader] Processando arquivo:', file.name);
        
        try {
          // Upload para Supabase Storage e salvar no banco
          const { url, dbId } = await uploadToSupabase(file);
          
          // Atualizar também o campo photos na tabela services
          if (serviceId) {
            await updateServicePhotosField(serviceId);
          }
          
          const photo: Photo = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            file: file,
            url: url,
            title: file.name.replace(/\.[^/.]+$/, ""),
            dbId: dbId // Already a number from uploadToSupabase
          };

          newPhotos.push(photo);
          console.log('[PhotoUploader] Foto processada com sucesso:', photo.title);
          
        } catch (error) {
          console.error('[PhotoUploader] Erro ao processar foto:', file.name, error);
          toast.error(`Erro ao enviar ${file.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      if (newPhotos.length > 0) {
        const updatedPhotos = [...photos, ...newPhotos];
        console.log('[PhotoUploader] Adicionando', newPhotos.length, 'fotos. Total:', updatedPhotos.length);
        onPhotosChange(updatedPhotos);
        toast.success(`${newPhotos.length} foto(s) enviada(s) com sucesso!`);
      }

    } catch (error) {
      console.error('[PhotoUploader] Erro geral:', error);
      toast.error('Erro ao processar fotos');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [photos, maxPhotos, onPhotosChange, disabled, serviceId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removePhoto = useCallback(async (photoId: string) => {
    if (disabled) return;
    
    console.log('[PhotoUploader] Removendo foto:', photoId);
    const photoToRemove = photos.find(p => p.id === photoId);
    
    if (photoToRemove && photoToRemove.dbId) {
      try {
        // Usar o ID do banco de dados para remover - convert number to string
        const { error } = await supabase
          .from('service_photos')
          .delete()
          .eq('id', photoToRemove.dbId.toString());
          
        if (error) {
          console.error('[PhotoUploader] Erro ao remover do banco:', error);
          toast.error('Erro ao remover foto do banco de dados');
          return;
        }
        
        console.log('[PhotoUploader] Foto removida do banco com sucesso');
        
        // Atualizar o campo photos na tabela services
        if (serviceId) {
          await updateServicePhotosField(serviceId);
        }
      } catch (error) {
        console.error('[PhotoUploader] Erro ao remover foto do banco:', error);
        toast.error('Erro ao remover foto');
        return;
      }
    } else if (!photoToRemove?.dbId) {
      console.warn('[PhotoUploader] Foto não tem ID do banco, removendo apenas localmente');
      toast.warning('Foto ainda não foi sincronizada. Tente novamente em alguns segundos.');
      return;
    }
    
    const updatedPhotos = photos.filter(p => p.id !== photoId);
    onPhotosChange(updatedPhotos);
    toast.success('Foto removida');
  }, [photos, onPhotosChange, disabled, serviceId]);

  const updatePhotoTitle = useCallback(async (photoId: string, title: string) => {
    if (disabled) return;
    
    console.log('[PhotoUploader] Atualizando título da foto:', photoId, title);
    
    const photoToUpdate = photos.find(p => p.id === photoId);
    if (photoToUpdate && photoToUpdate.dbId) {
      try {
        // Usar o ID do banco de dados para atualizar - convert number to string
        const { error } = await supabase
          .from('service_photos')
          .update({ title: title })
          .eq('id', photoToUpdate.dbId.toString());
          
        if (error) {
          console.error('[PhotoUploader] Erro ao atualizar título no banco:', error);
        } else {
          console.log('[PhotoUploader] Título atualizado no banco com sucesso');
        }
      } catch (error) {
        console.error('[PhotoUploader] Erro ao atualizar título:', error);
      }
    } else if (!photoToUpdate?.dbId) {
      console.warn('[PhotoUploader] Foto não tem ID do banco, aguarde sincronização');
      toast.warning('Aguarde a sincronização da foto para editar o título.');
      return;
    }
    
    const updatedPhotos = photos.map(photo =>
      photo.id === photoId ? { ...photo, title } : photo
    );
    onPhotosChange(updatedPhotos);
  }, [photos, onPhotosChange, disabled]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          disabled 
            ? 'border-muted-foreground/10 bg-muted/20' 
            : isUploading 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDrop={disabled ? undefined : handleDrop}
        onDragOver={disabled ? undefined : handleDragOver}
      >
        <CardContent className="p-6">
          <div className="text-center">
            {isUploading ? (
              <div className="space-y-3">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Enviando fotos...</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center space-x-2 mb-4">
                  <Upload className={`h-8 w-8 ${disabled ? 'text-muted-foreground/50' : 'text-muted-foreground'}`} />
                  <Camera className={`h-8 w-8 ${disabled ? 'text-muted-foreground/50' : 'text-muted-foreground'}`} />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${disabled ? 'text-muted-foreground' : ''}`}>
                  Adicionar Fotos
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {disabled ? (
                    'Upload de fotos desabilitado - serviço concluído'
                  ) : (
                    <>
                      Arraste e solte fotos aqui ou clique para selecionar<br />
                      <span className="text-xs">
                        Máximo: {maxPhotos} fotos • Formatos: JPG, PNG, WebP • Até 10MB cada
                      </span>
                    </>
                  )}
                </p>
                <div className="flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || photos.length >= maxPhotos}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Selecionar Fotos
                  </Button>
                </div>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
          />
        </CardContent>
      </Card>

      {/* Photos Grid */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Fotos Adicionadas ({photos.length}/{maxPhotos})
            </h4>
            {disabled && (
              <p className="text-xs text-muted-foreground">
                Edição bloqueada - serviço concluído
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex space-x-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          console.error('[PhotoUploader] Erro ao carregar imagem:', photo.url);
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                      
                      {!disabled && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => removePhoto(photo.id)}
                          disabled={!photo.dbId}
                          title={!photo.dbId ? "Aguarde sincronização para remover" : "Remover foto"}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label htmlFor={`title-${photo.id}`} className="text-xs">
                          Título da Foto
                        </Label>
                        <Input
                          id={`title-${photo.id}`}
                          value={photo.title}
                          onChange={(e) => updatePhotoTitle(photo.id, e.target.value)}
                          placeholder="Digite um título..."
                          className="mt-1"
                          disabled={disabled || !photo.dbId}
                          title={!photo.dbId ? "Aguarde sincronização para editar" : ""}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(photo.file.size)}
                        </span>
                        {!photo.dbId && (
                          <span className="text-xs text-yellow-600">
                            Sincronizando...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
