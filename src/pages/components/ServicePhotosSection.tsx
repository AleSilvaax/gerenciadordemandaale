
// Adicionar className como prop opcional ou remover dos usos
import React from "react";
import { PhotoUploader } from "@/components/ui-custom/PhotoUploader";

type Photo = {
  url: string;
  title: string;
};

interface ServicePhotosSectionProps {
  photos: Photo[];
  onAddPhoto: (file: File, title: string) => Promise<string>;
  onRemovePhoto: (idx: number) => Promise<void>;
  onUpdateTitle: (idx: number, title: string) => Promise<void>;
  // className?: string; // Descomente caso queira suportar className no futuro
}

const ServicePhotosSection: React.FC<ServicePhotosSectionProps> = ({
  photos,
  onAddPhoto,
  onRemovePhoto,
  onUpdateTitle,
  // className,
}) => (
  <div>
    <h3 className="text-lg font-medium mb-4">Anexos e Fotos</h3>
    <PhotoUploader
      photos={photos}
      onAddPhoto={onAddPhoto}
      onRemovePhoto={onRemovePhoto}
      onUpdateTitle={onUpdateTitle}
      // className={className}
    />
  </div>
);

export default ServicePhotosSection;
