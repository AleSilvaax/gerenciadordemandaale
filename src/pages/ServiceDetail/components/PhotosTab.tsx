
import React from "react";
import { Button } from "@/components/ui/button";
import { Camera, Image, X } from "lucide-react";
import { useServiceDetail } from "../context/ServiceDetailContext";
import { useServicePhotos } from "../hooks/useServicePhotos";

const PhotosTab: React.FC = () => {
  const { selectedPhotos, fileInputRef } = useServiceDetail();
  const { handlePhotoUpload, handleRemovePhoto } = useServicePhotos();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Fotos do relatório</h3>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={16} className="mr-2" />
            Adicionar fotos
          </Button>
        </div>
      </div>

      {selectedPhotos.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 mt-4">
          {selectedPhotos.map((photo, index) => (
            <div key={index} className="relative rounded-lg overflow-hidden">
              <img 
                src={photo} 
                alt={`Foto ${index + 1}`} 
                className="w-full h-32 object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemovePhoto(photo)}
                className="absolute top-2 right-2 bg-black/70 rounded-full p-1 hover:bg-black/90"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-gray-300 rounded-lg bg-secondary/20">
          <Image size={48} className="text-gray-400" />
          <p className="text-muted-foreground text-center">
            Nenhuma foto adicionada. Clique em "Adicionar fotos" para incluir imagens no relatório.
          </p>
        </div>
      )}
    </div>
  );
};

export default PhotosTab;
