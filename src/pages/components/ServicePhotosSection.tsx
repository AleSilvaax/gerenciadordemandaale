
import React from "react";
import { PhotoUploader } from "@/components/ui-custom/PhotoUploader";

interface ServicePhoto {
  url: string;
  title: string;
}

interface ServicePhotosSectionProps {
  photos: ServicePhoto[];
  onAddPhoto: (file: File, title: string) => Promise<string>;
  onRemovePhoto: (idx: number) => Promise<void>;
  onUpdateTitle: (idx: number, title: string) => Promise<void>;
}

const ServicePhotosSection: React.FC<ServicePhotosSectionProps> = ({
  photos,
  onAddPhoto,
  onRemovePhoto,
  onUpdateTitle,
}) => {
  // Converter photos do service para o formato esperado pelo PhotoUploader
  const uploaderPhotos = photos.map((photo, index) => ({
    id: `service-photo-${index}`,
    file: new File([], photo.title || 'photo', { type: 'image/jpeg' }), // Mock file
    url: photo.url,
    title: photo.title,
    compressed: false
  }));

  const handlePhotosChange = async (newPhotos: any[]) => {
    // Esta função seria chamada quando o PhotoUploader faz mudanças
    // Por enquanto, não implementamos pois o ServicePhotosSection
    // usa suas próprias funções onAddPhoto, onRemovePhoto, onUpdateTitle
    console.log('Photos changed:', newPhotos);
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Anexos e Fotos</h3>
      <div className="space-y-4">
        {photos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="border rounded-lg p-4">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-32 object-cover rounded mb-2"
                />
                <p className="text-sm font-medium">{photo.title}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            Nenhuma foto adicionada ainda
          </p>
        )}
      </div>
    </div>
  );
};

export default ServicePhotosSection;
