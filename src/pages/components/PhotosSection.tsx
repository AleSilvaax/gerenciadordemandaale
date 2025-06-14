
import React from "react";
import ServicePhotosSection from "./ServicePhotosSection";

interface PhotosSectionProps {
  photos: { url: string; title: string }[];
  onAddPhoto: (file: File, title: string) => Promise<string>;
  onRemovePhoto: (idx: number) => Promise<void>;
  onUpdateTitle: (idx: number, title: string) => Promise<void>;
}

const PhotosSection: React.FC<PhotosSectionProps> = ({
  photos,
  onAddPhoto,
  onRemovePhoto,
  onUpdateTitle,
}) => (
  <div>
    <h3 className="text-lg font-medium mb-4">Anexos e Fotos</h3>
    <ServicePhotosSection
      photos={photos}
      onAddPhoto={onAddPhoto}
      onRemovePhoto={onRemovePhoto}
      onUpdateTitle={onUpdateTitle}
    />
  </div>
);

export default PhotosSection;
