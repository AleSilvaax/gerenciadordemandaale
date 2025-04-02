
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Upload, ImagePlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface PhotoUploaderProps {
  onPhotosUpdate: (photos: string[], titles: string[]) => void;
  initialPhotos?: string[];
  initialTitles?: string[];
  maxPhotos?: number;
}

export function PhotoUploader({
  onPhotosUpdate,
  initialPhotos = [],
  initialTitles = [],
  maxPhotos = 12
}: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [titles, setTitles] = useState<string[]>(initialTitles.length === initialPhotos.length 
    ? initialTitles 
    : initialPhotos.map((_, i) => `Foto ${i + 1}`)
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (photos.length + files.length > maxPhotos) {
      toast.error(`Limite de fotos excedido`, {
        description: `Você pode adicionar no máximo ${maxPhotos} fotos.`
      });
      return;
    }
    
    // Process each file
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos(prev => [...prev, event.target!.result as string]);
          setTitles(prev => [...prev, `Foto ${prev.length + 1}`]);
          
          // Update parent component
          const updatedPhotos = [...photos, event.target!.result as string];
          const updatedTitles = [...titles, `Foto ${titles.length + 1}`];
          onPhotosUpdate(updatedPhotos, updatedTitles);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    const updatedTitles = titles.filter((_, i) => i !== index);
    
    setPhotos(updatedPhotos);
    setTitles(updatedTitles);
    
    // Update parent component
    onPhotosUpdate(updatedPhotos, updatedTitles);
  };

  const updateTitle = (index: number, newTitle: string) => {
    const updatedTitles = [...titles];
    updatedTitles[index] = newTitle;
    
    setTitles(updatedTitles);
    
    // Update parent component
    onPhotosUpdate(photos, updatedTitles);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Fotos do Serviço ({photos.length}/{maxPhotos})</h3>
        <Label htmlFor="photo-upload" className="cursor-pointer">
          <div className="flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 rounded-md text-sm font-medium">
            <ImagePlus className="h-4 w-4" />
            <span>Adicionar Fotos</span>
          </div>
          <Input 
            id="photo-upload" 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={handleFileChange} 
            className="hidden" 
            disabled={photos.length >= maxPhotos}
          />
        </Label>
      </div>
      
      {photos.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">Faça upload de fotos para o relatório</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="relative">
                <AspectRatio ratio={4/3}>
                  <img 
                    src={photo} 
                    alt={titles[index] || `Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>
                <Button 
                  size="icon" 
                  variant="destructive" 
                  className="absolute top-2 right-2 h-6 w-6 rounded-full"
                  onClick={() => removePhoto(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="p-3">
                <Input
                  placeholder="Título da foto"
                  value={titles[index] || ""}
                  onChange={(e) => updateTitle(index, e.target.value)}
                  className="text-sm mt-2"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
