import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Camera, Image, Edit2 } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface PhotoDetails {
  url: string;
  title: string;
}

interface PhotoUploaderProps {
  photos: PhotoDetails[];
  onAddPhoto: (file: File, title: string) => Promise<string>;
  onRemovePhoto: (index: number) => Promise<void>;
  onUpdateTitle: (index: number, title: string) => Promise<void>;
  className?: string;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos,
  onAddPhoto,
  onRemovePhoto,
  onUpdateTitle,
  className = "",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [photoTitle, setPhotoTitle] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      alert("Por favor, selecione um arquivo de imagem válido");
      return;
    }
    setIsUploading(true);
    try {
      await onAddPhoto(file, photoTitle || `Foto ${photos.length + 1}`);
      setPhotoTitle("");
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleEditTitle = (index: number) => {
    setEditingIndex(index);
    setEditTitle(photos[index].title);
  };

  const saveTitle = async (index: number) => {
    try {
      await onUpdateTitle(index, editTitle);
      setEditingIndex(null);
    } catch (error) {
      console.error("Erro ao atualizar título:", error);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <Label htmlFor="photoTitle">Título da foto</Label>
          <Input
            id="photoTitle"
            placeholder="Ex: Painel elétrico"
            value={photoTitle}
            onChange={(e) => setPhotoTitle(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <div className="flex items-center">
                <div className="animate-spin mr-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="32" strokeDashoffset="10" />
                  </svg>
                </div>
                Enviando...
              </div>
            ) : (
              <>
                <Camera size={16} className="mr-2" />
                Adicionar Foto
              </>
            )}
          </Button>
        </div>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {photos.map((photo, index) => (
            <div key={index} className="relative border rounded-lg overflow-hidden group">
              <div className="relative">
                <AspectRatio ratio={4/3}>
                  <img 
                    src={photo.url} 
                    alt={photo.title} 
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>
                <button
                  type="button"
                  onClick={() => onRemovePhoto(index)}
                  className="absolute top-2 right-2 bg-black/70 rounded-full p-1 hover:bg-black/90"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>
              
              <div className="p-2 bg-gray-50 border-t dark:bg-gray-800 dark:border-gray-700">
                {editingIndex === index ? (
                  <div className="flex">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-sm h-8 mr-2"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      onClick={() => saveTitle(index)}
                      className="h-8"
                    >
                      Salvar
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium truncate">{photo.title}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditTitle(index)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit2 size={14} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
