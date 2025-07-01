
import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { compressImage, isImageFile } from '@/utils/imageCompression';
import { toast } from 'sonner';

interface Photo {
  id: string;
  file?: File;
  url: string;
  title: string;
  compressed?: boolean;
  originalSize?: number;
  compressedSize?: number;
}

interface PhotoUploaderProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  maxPhotos?: number;
  acceptedFormats?: string[];
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = 10,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
}) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

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

    setIsCompressing(true);
    const newPhotos: Photo[] = [];

    try {
      for (const file of filesToProcess) {
        console.log('[PhotoUploader] Processando arquivo:', file.name);
        const originalSize = file.size;
        
        // Comprimir imagem automaticamente
        const compressedFile = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8,
          maxSizeKB: 500
        });

        const photo: Photo = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          file: compressedFile,
          url: URL.createObjectURL(compressedFile),
          title: file.name.replace(/\.[^/.]+$/, ""),
          compressed: compressedFile.size < originalSize,
          originalSize,
          compressedSize: compressedFile.size
        };

        newPhotos.push(photo);
        console.log('[PhotoUploader] Foto processada:', photo.title);

        // Mostrar feedback de compressão
        if (photo.compressed) {
          const savings = ((originalSize - compressedFile.size) / originalSize * 100).toFixed(1);
          toast.success(`${file.name} comprimida (${savings}% menor)`);
        }
      }

      const updatedPhotos = [...photos, ...newPhotos];
      console.log('[PhotoUploader] Chamando onPhotosChange com', updatedPhotos.length, 'fotos');
      onPhotosChange(updatedPhotos);
      
    } catch (error) {
      console.error('Erro ao processar fotos:', error);
      toast.error('Erro ao processar algumas fotos');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [photos, maxPhotos, acceptedFormats, onPhotosChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removePhoto = (photoId: string) => {
    console.log('[PhotoUploader] Removendo foto:', photoId);
    const photoToRemove = photos.find(p => p.id === photoId);
    if (photoToRemove && photoToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(photoToRemove.url);
    }
    const updatedPhotos = photos.filter(p => p.id !== photoId);
    onPhotosChange(updatedPhotos);
  };

  const updatePhotoTitle = (photoId: string, title: string) => {
    console.log('[PhotoUploader] Atualizando título da foto:', photoId, title);
    const updatedPhotos = photos.map(photo =>
      photo.id === photoId ? { ...photo, title } : photo
    );
    onPhotosChange(updatedPhotos);
  };

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
          isCompressing ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <CardContent className="p-6">
          <div className="text-center">
            {isCompressing ? (
              <div className="space-y-2">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Comprimindo imagens...</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center space-x-2 mb-4">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Adicionar Fotos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Arraste e solte fotos aqui ou clique para selecionar<br />
                  <span className="text-xs">
                    Máximo: {maxPhotos} fotos • Formatos: JPG, PNG, WebP • Compressão automática
                  </span>
                </p>
                <div className="flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photos.length >= maxPhotos}
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
              <Card key={photo.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex space-x-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => removePhoto(photo.id)}
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
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {photo.compressed && (
                          <Badge variant="secondary" className="text-xs">
                            Comprimida
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
