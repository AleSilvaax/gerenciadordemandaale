
import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Camera, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { compressImage, isImageFile } from '@/utils/imageCompression';
import { photoService } from '@/services/photoService';
import { toast } from 'sonner';

export interface Photo {
  id: string;
  file?: File;
  url: string;
  title: string;
  compressed?: boolean;
  originalSize?: number;
  compressedSize?: number;
  uploading?: boolean;
  error?: string;
}

interface PhotoUploaderProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  maxPhotos?: number;
  acceptedFormats?: string[];
  disabled?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = 10,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;

    console.log('[PhotoUploader] Arquivos selecionados:', files.length);

    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      toast.error(`Máximo de ${maxPhotos} fotos permitido`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const invalidFiles = filesToProcess.filter(file => !isImageFile(file) || !acceptedFormats.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast.error(`Formatos aceitos: ${acceptedFormats.join(', ')}`);
      return;
    }

    setIsUploading(true);
    setUploadProgress({ completed: 0, total: filesToProcess.length });

    try {
      const newPhotos: Photo[] = [];

      // Processar arquivos um por vez
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        console.log('[PhotoUploader] Processando arquivo:', file.name);
        
        try {
          const originalSize = file.size;
          
          // Comprimir imagem automaticamente
          const compressedFile = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            maxSizeKB: 500
          });

          // Upload imediatamente para Supabase
          console.log('[PhotoUploader] Fazendo upload para Supabase:', file.name);
          const uploadResult = await photoService.uploadPhoto(compressedFile);
          
          const photo: Photo = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            file: compressedFile,
            url: uploadResult.url, // URL já do Supabase
            title: file.name.replace(/\.[^/.]+$/, ""),
            compressed: compressedFile.size < originalSize,
            originalSize,
            compressedSize: compressedFile.size,
            uploading: false
          };

          newPhotos.push(photo);
          
          // Atualizar progresso
          setUploadProgress({ completed: i + 1, total: filesToProcess.length });

          // Mostrar feedback de compressão
          if (photo.compressed) {
            const savings = ((originalSize - compressedFile.size) / originalSize * 100).toFixed(1);
            console.log(`[PhotoUploader] ${file.name} comprimida (${savings}% menor)`);
          }

        } catch (error) {
          console.error(`[PhotoUploader] Erro ao processar ${file.name}:`, error);
          toast.error(`Erro ao processar ${file.name}`);
        }
      }

      if (newPhotos.length > 0) {
        const updatedPhotos = [...photos, ...newPhotos];
        console.log('[PhotoUploader] Adicionando', newPhotos.length, 'fotos. Total:', updatedPhotos.length);
        onPhotosChange(updatedPhotos);
        toast.success(`${newPhotos.length} foto(s) adicionada(s) com sucesso!`);
      }

    } catch (error) {
      console.error('[PhotoUploader] Erro geral:', error);
      toast.error('Erro ao processar fotos');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [photos, maxPhotos, acceptedFormats, onPhotosChange, disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removePhoto = useCallback((photoId: string) => {
    if (disabled) return;
    
    console.log('[PhotoUploader] Removendo foto:', photoId);
    const photoToRemove = photos.find(p => p.id === photoId);
    
    // Revogar URL blob se necessário
    if (photoToRemove && photoToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(photoToRemove.url);
    }
    
    const updatedPhotos = photos.filter(p => p.id !== photoId);
    onPhotosChange(updatedPhotos);
    toast.success('Foto removida');
  }, [photos, onPhotosChange, disabled]);

  const updatePhotoTitle = useCallback((photoId: string, title: string) => {
    if (disabled) return;
    
    console.log('[PhotoUploader] Atualizando título da foto:', photoId, title);
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
                <p className="text-sm text-muted-foreground">Processando imagens...</p>
                {uploadProgress && (
                  <div className="space-y-2">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(uploadProgress.completed / uploadProgress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {uploadProgress.completed} de {uploadProgress.total} fotos processadas
                    </p>
                  </div>
                )}
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
                    'Upload de fotos desabilitado'
                  ) : (
                    <>
                      Arraste e solte fotos aqui ou clique para selecionar<br />
                      <span className="text-xs">
                        Máximo: {maxPhotos} fotos • Formatos: JPG, PNG, WebP • Compressão automática
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
            accept={acceptedFormats.join(',')}
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
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map((photo) => (
              <Card key={photo.id} className={`overflow-hidden ${photo.error ? 'border-destructive' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex space-x-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className={`w-20 h-20 object-cover rounded-lg ${photo.uploading ? 'opacity-50' : ''}`}
                        onError={(e) => {
                          console.error('[PhotoUploader] Erro ao carregar imagem:', photo.url);
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                      
                      {photo.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                        </div>
                      )}
                      
                      {photo.error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-destructive/20 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        </div>
                      )}
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => removePhoto(photo.id)}
                        disabled={disabled || photo.uploading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
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
                          disabled={disabled || photo.uploading}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2 flex-wrap">
                        {photo.uploading && (
                          <Badge variant="outline" className="text-xs">
                            Enviando...
                          </Badge>
                        )}
                        {photo.compressed && !photo.uploading && (
                          <Badge variant="secondary" className="text-xs">
                            Comprimida
                          </Badge>
                        )}
                        {photo.error && (
                          <Badge variant="destructive" className="text-xs">
                            Erro
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(photo.compressedSize || photo.file?.size || 0)}
                          {photo.compressed && photo.originalSize && (
                            <span className="text-green-600 ml-1">
                              (↓{((photo.originalSize - (photo.file?.size || 0)) / photo.originalSize * 100).toFixed(0)}%)
                            </span>
                          )}
                        </span>
                      </div>
                      
                      {photo.error && (
                        <p className="text-xs text-destructive">{photo.error}</p>
                      )}
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
