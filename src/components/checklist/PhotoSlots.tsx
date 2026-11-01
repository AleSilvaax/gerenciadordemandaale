import React, { useRef, useState } from 'react';
import { Camera, Check, Loader2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { PhotoSlotDef } from '@/types/checklist';
import type { Photo } from '@/components/ui-custom/PhotoUploader';
import { uploadServicePhoto, syncServicePhotosFields } from '@/services/photoUpload';

interface PhotoSlotsProps {
  slots: PhotoSlotDef[];
  photos: Photo[];
  serviceId: string;
  onPhotosChange: (photos: Photo[]) => void;
  disabled?: boolean;
}

/**
 * Slots de fotos delimitados por tipo de serviço. Cada upload entra no fluxo
 * normal de fotos da OS (service_photos) com o título exato do slot.
 */
export const PhotoSlots: React.FC<PhotoSlotsProps> = ({
  slots,
  photos,
  serviceId,
  onPhotosChange,
  disabled = false,
}) => {
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const photosForSlot = (slot: PhotoSlotDef) =>
    photos.filter(p => p.title === slot.title);

  const handleFile = async (slot: PhotoSlotDef, files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;
    const file = Array.from(files).find(f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024);
    if (!file) {
      toast.error('Selecione uma imagem de até 10MB.');
      return;
    }

    setUploadingSlot(slot.id);
    try {
      const uploaded = await uploadServicePhoto(serviceId, file, slot.title);
      await syncServicePhotosFields(serviceId);
      onPhotosChange([
        ...photos,
        {
          id: uploaded.dbId,
          dbId: uploaded.dbId,
          file,
          url: uploaded.signedUrl,
          title: slot.title,
        },
      ]);
      toast.success(`Foto adicionada em "${slot.title}".`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar foto.');
    } finally {
      setUploadingSlot(null);
      const input = inputRefs.current[slot.id];
      if (input) input.value = '';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {slots.map(slot => {
        const slotPhotos = photosForSlot(slot);
        const filled = slotPhotos.length > 0;
        const isUploading = uploadingSlot === slot.id;

        return (
          <div
            key={slot.id}
            className={`rounded-lg border-2 border-dashed p-3 space-y-2 ${
              filled ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20' : 'border-muted-foreground/25'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {filled ? (
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <Camera className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm font-semibold leading-tight">{slot.title}</span>
              </div>
              <Badge
                variant="outline"
                className={
                  slot.required
                    ? 'text-[10px] border-orange-300 text-orange-700 bg-orange-50 dark:bg-orange-950/30'
                    : 'text-[10px] text-muted-foreground'
                }
              >
                {slot.required ? 'OBRIGATÓRIO' : 'OPCIONAL'}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
              {slot.instruction}
            </p>

            {filled && (
              <div className="flex gap-2 flex-wrap">
                {slotPhotos.map(photo => (
                  <img
                    key={photo.id}
                    src={photo.url}
                    alt={slot.title}
                    className="h-16 w-16 object-cover rounded-md border"
                  />
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              disabled={disabled || isUploading}
              onClick={() => inputRefs.current[slot.id]?.click()}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {filled ? 'Adicionar outra foto' : '+ Adicionar foto'}
            </Button>
            <input
              ref={el => { inputRefs.current[slot.id] = el; }}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              disabled={disabled}
              onChange={e => handleFile(slot, e.target.files)}
            />
          </div>
        );
      })}
    </div>
  );
};
